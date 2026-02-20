"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.limparComprovantesExpirados = exports.validarComprovantePix = exports.verificarMedicamentos = exports.notifyNewStudy = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const vision = require("@google-cloud/vision");
const cloudinary_1 = require("cloudinary");
const axios_1 = require("axios");
// ✅ CORREÇÃO DE ENGENHARIA: 
// Usamos 'require' aqui porque o pdf-parse não tem exportação padrão compatível com 'import * as'
const pdfParse = require("pdf-parse");
// Inicialização Única
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
const visionClient = new vision.ImageAnnotatorClient();
// --- CONFIGURAÇÃO CLOUDINARY ---
cloudinary_1.v2.config({
    cloud_name: 'ddndbv7do',
    api_key: '891824751438568',
    api_secret: 'eC6npmI9rmfQysOqFJFKponzFBQ'
});
// --- FUNÇÃO 1: NOTIFICAR NOVO ESTUDO ---
exports.notifyNewStudy = (0, firestore_1.onDocumentCreated)("estudos_biblicos/{studyId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    const data = snapshot.data();
    const titulo = data.titulo;
    const tokensSnapshot = await db.collection("notificacoes_inscritos").get();
    const registrationTokens = tokensSnapshot.docs.map((doc) => doc.data().token);
    if (registrationTokens.length === 0)
        return;
    const message = {
        notification: {
            title: "📖 Nova Palavra Liberada!",
            body: `Confira agora: "${titulo}"`,
        },
        tokens: registrationTokens,
    };
    try {
        await admin.messaging().sendEachForMulticast(message);
        console.log("Notificações de estudo enviadas.");
    }
    catch (error) {
        console.error("Erro em notifyNewStudy:", error);
    }
});
// --- FUNÇÃO 2: ALERTA DE MEDICAÇÃO ---
exports.verificarMedicamentos = (0, scheduler_1.onSchedule)("every 10 minutes", async (event) => {
    var _a;
    const agora = new Date().toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit'
    });
    const encontristasSnap = await db.collection("encontro_inscritos")
        .where("remediosControlados", "!=", "")
        .get();
    for (const doc of encontristasSnap.docs) {
        const dados = doc.data();
        if ((_a = dados.horariosMedicacao) === null || _a === void 0 ? void 0 : _a.includes(agora)) {
            const equipeSnap = await db.collection("contas_acesso")
                .where("permissaoEncontro", "array-contains-any", ["Saude", "Coordenador"])
                .get();
            const tokensSaude = equipeSnap.docs
                .map((d) => d.data().fcmToken)
                .filter((token) => !!token);
            if (tokensSaude.length > 0) {
                await admin.messaging().sendEachForMulticast({
                    tokens: tokensSaude,
                    notification: {
                        title: "💊 Hora de Medicar!",
                        body: `O encontrista ${dados.nome} precisa tomar: ${dados.remediosControlados}`
                    },
                    android: { priority: "high" }
                });
            }
        }
    }
});
exports.validarComprovantePix = (0, https_1.onCall)({ cors: true }, async (request) => {
    const { downloadUrl, registroId } = request.data;
    const cnpjOficial = "33206513000102"; // Destinatário Fazenda Rio Grande
    try {
        let fullText = "";
        // 1. Baixar o arquivo para memória para identificar o tipo
        const response = await axios_1.default.get(downloadUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        const contentType = response.headers['content-type'];
        console.log(`Processando arquivo ID: ${registroId} | Tipo: ${contentType}`);
        if (contentType === 'application/pdf') {
            // --- ESTRATÉGIA PDF (Econômica e Rápida) ---
            // Agora chamamos como função direta, pois usamos 'require'
            const data = await pdfParse(buffer);
            fullText = data.text;
            console.log("Texto extraído via PDF-Parse");
        }
        else {
            // --- ESTRATÉGIA OCR/VISION (Para Imagens) ---
            const [result] = await visionClient.textDetection(downloadUrl);
            const detections = result.textAnnotations;
            if (!detections || detections.length === 0) {
                throw new Error("OCR não detectou texto na imagem.");
            }
            fullText = detections[0].description || "";
            console.log("Texto extraído via Google Vision");
        }
        // 2. Limpeza e Validação Unificada
        const textRaw = fullText.replace(/\n/g, " ");
        const textClean = fullText.replace(/\D/g, ""); // Apenas números para CNPJ
        const cnpjConfirmado = textClean.includes(cnpjOficial);
        // Regex ajustado para pegar valores monetários (ex: 1.200,00 ou 50,00)
        const regexValor = /(?:R\$|VALOR|TOTAL|PAGO)?\s?(\d{1,3}(?:\.\d{3})*,\d{2})/i;
        const match = textRaw.match(regexValor);
        const valorExtraido = match ? parseFloat(match[1].replace(/\./g, "").replace(",", ".")) : 0;
        const docRef = db.collection("registros_financeiros_validados").doc(registroId);
        if (cnpjConfirmado && valorExtraido > 0) {
            await docRef.update({
                status: "Aprovado via OCR/PDF",
                valorExtraido: valorExtraido,
                validadoEm: admin.firestore.FieldValue.serverTimestamp(),
                auditado: "Sistema Automático (Híbrido)",
                metodoValidacao: contentType === 'application/pdf' ? 'PDF Parse' : 'Google Vision'
            });
            return { success: true, valor: valorExtraido };
        }
        else {
            await docRef.update({
                status: "Rejeitado: Dados divergentes",
                motivoRejeicao: !cnpjConfirmado ? "CNPJ não encontrado" : "Valor ilegível"
            });
            return { success: false, error: "CNPJ ou valor não identificados." };
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        console.error("Erro no processamento Híbrido:", errorMessage);
        const docRef = db.collection("registros_financeiros_validados").doc(registroId);
        await docRef.update({ status: `Erro Técnico: ${errorMessage}` });
        return { success: false, error: errorMessage };
    }
});
// --- FUNÇÃO 4: LIMPEZA AUTOMÁTICA (FAXINA) ---
exports.limparComprovantesExpirados = (0, scheduler_1.onSchedule)("0 0 * * *", async (event) => {
    const agora = new Date();
    const registrosSnap = await db.collection("registros_financeiros_validados")
        .where("comprovanteUrl", "!=", null)
        .get();
    console.log(`Iniciando faxina diária em ${registrosSnap.size} documentos...`);
    for (const doc of registrosSnap.docs) {
        const item = doc.data();
        if (!item.data)
            continue;
        const itemDate = item.data.toDate();
        const difHoras = (agora.getTime() - itemDate.getTime()) / (1000 * 60 * 60);
        // Dízimo: 7 dias (168h) | Oferta: 24h
        const limite = item.tipo === "Dízimo" ? 168 : 24;
        if (difHoras > limite) {
            try {
                const urlParts = item.comprovanteUrl.split('/');
                const fileName = urlParts[urlParts.length - 1];
                const publicId = fileName.split('.')[0];
                await cloudinary_1.v2.uploader.destroy(publicId);
                await doc.ref.update({
                    comprovanteUrl: null,
                    arquivadoEm: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`✅ Arquivo ${publicId} (${item.tipo}) removido.`);
            }
            catch (error) {
                console.error(`❌ Erro ao deletar do Cloudinary no doc ${doc.id}:`, error);
            }
        }
    }
});
//# sourceMappingURL=index.js.map