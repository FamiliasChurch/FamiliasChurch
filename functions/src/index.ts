import { onDocumentCreated, FirestoreEvent, QueryDocumentSnapshot } from "firebase-functions/v2/firestore";
import { onSchedule, ScheduledEvent } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as vision from "@google-cloud/vision";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios"; 

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
cloudinary.config({ 
  cloud_name: 'ddndbv7do', 
  api_key: '891824751438568',
  api_secret: 'eC6npmI9rmfQysOqFJFKponzFBQ'
});

// --- FUNÇÃO 1: NOTIFICAR NOVO ESTUDO ---
export const notifyNewStudy = onDocumentCreated("estudos_biblicos/{studyId}", async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const data = snapshot.data();
  const titulo = data.titulo;

  const tokensSnapshot = await db.collection("notificacoes_inscritos").get();
  const registrationTokens: string[] = tokensSnapshot.docs.map((doc) => doc.data().token);

  if (registrationTokens.length === 0) return;

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
  } catch (error) {
    console.error("Erro em notifyNewStudy:", error);
  }
});

// --- FUNÇÃO 2: ALERTA DE MEDICAÇÃO ---
export const verificarMedicamentos = onSchedule("every 10 minutes", async (event: ScheduledEvent) => {
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
    
    if (dados.horariosMedicacao?.includes(agora)) {
       const equipeSnap = await db.collection("contas_acesso")
         .where("permissaoEncontro", "array-contains-any", ["Saude", "Coordenador"])
         .get();

       const tokensSaude: string[] = equipeSnap.docs
         .map((d) => d.data().fcmToken)
         .filter((token: string | undefined): token is string => !!token);

       if (tokensSaude.length > 0) {
         await admin.messaging().sendEachForMulticast({
           tokens: tokensSaude,
           notification: {
             title: "💊 Hora de Medicar!",
             body: `O encontrista ${dados.nome} precisa tomar: ${dados.remediosControlados}`
           },
           android: { priority: "high" as const }
         });
       }
    }
  }
});

// --- FUNÇÃO 3: VALIDAR COMPROVANTE PIX (HÍBRIDO + CORS MANUAL) ---
interface ValidarPixData {
  downloadUrl: string;
  registroId: string;
}

// ⚠️ IMPORTANTE: Usamos onRequest SEM options de cors, pois faremos manual
export const validarComprovantePix = onRequest(async (request, response) => {
  // 1. APLICAR CORS MANUALMENTE (Para liberar qualquer origem, inclusive localhost)
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Libera headers comuns

  // 2. TRATAR PREFLIGHT (O navegador pergunta "Posso?" antes de enviar)
  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  // 3. SE NÃO FOR POST, REJEITA
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    // Captura o payload (suporta tanto formato {data: ...} quanto direto)
    const rawBody = request.body.data || request.body; 
    const payload = rawBody as ValidarPixData;

    const { downloadUrl, registroId } = payload;

    if (!downloadUrl || !registroId) {
       response.status(400).json({ data: { success: false, error: 'Faltam parâmetros.' }});
       return;
    }

    const cnpjOficial = "33206513000102"; // Destinatário Fazenda Rio Grande
    let fullText = "";

    // 1. Baixar o arquivo
    const axiosResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(axiosResponse.data, 'binary');
    const contentType = axiosResponse.headers['content-type'];

    console.log(`Processando arquivo ID: ${registroId} | Tipo: ${contentType}`);

    if (contentType === 'application/pdf') {
      const data = await pdfParse(buffer);
      fullText = data.text;
      console.log("Texto extraído via PDF-Parse");
    } else {
      // Otimização: Buffer direto no Vision
      const [result] = await visionClient.textDetection({
          image: { content: buffer }
      });
      
      const detections = result.textAnnotations;
      
      if (!detections || detections.length === 0) {
        throw new Error("OCR não detectou texto na imagem.");
      }
      fullText = detections[0].description || "";
      console.log("Texto extraído via Google Vision");
    }

    // 2. Limpeza e Validação
    const textRaw = fullText.replace(/\n/g, " "); 
    const textClean = fullText.replace(/\D/g, ""); 
    const cnpjConfirmado = textClean.includes(cnpjOficial);
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
      
      // Resposta 200 OK com sucesso
      response.status(200).json({ data: { success: true, valor: valorExtraido }});
    } else {
      await docRef.update({ 
        status: "Rejeitado: Dados divergentes",
        motivoRejeicao: !cnpjConfirmado ? "CNPJ não encontrado" : "Valor ilegível"
      });
      response.status(200).json({ data: { success: false, error: "CNPJ ou valor não identificados." }});
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro no processamento Híbrido:", errorMessage);
    
    try {
        const rawBody = request.body.data || request.body;
        if(rawBody?.registroId) {
             const docRef = db.collection("registros_financeiros_validados").doc(rawBody.registroId);
             await docRef.update({ status: `Erro Técnico: ${errorMessage}` });
        }
    } catch(e) {}

    response.status(500).json({ data: { success: false, error: errorMessage }});
  }
});

// --- FUNÇÃO 4: LIMPEZA AUTOMÁTICA (FAXINA) ---
export const limparComprovantesExpirados = onSchedule("0 0 * * *", async (event: ScheduledEvent) => {
  const agora = new Date();
  
  const registrosSnap = await db.collection("registros_financeiros_validados")
    .where("comprovanteUrl", "!=", null)
    .get();

  console.log(`Iniciando faxina diária em ${registrosSnap.size} documentos...`);

  for (const doc of registrosSnap.docs) {
    const item = doc.data();
    if (!item.data) continue; 

    const itemDate = item.data.toDate();
    const difHoras = (agora.getTime() - itemDate.getTime()) / (1000 * 60 * 60);

    // Dízimo: 7 dias (168h) | Oferta: 24h
    const limite = item.tipo === "Dízimo" ? 168 : 24;

    if (difHoras > limite) {
      try {
        const urlParts = item.comprovanteUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const publicId = fileName.split('.')[0]; 

        await cloudinary.uploader.destroy(publicId);

        await doc.ref.update({
          comprovanteUrl: null,
          arquivadoEm: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Arquivo ${publicId} (${item.tipo}) removido.`);
      } catch (error) {
        console.error(`❌ Erro ao deletar do Cloudinary no doc ${doc.id}:`, error);
      }
    }
  }
});