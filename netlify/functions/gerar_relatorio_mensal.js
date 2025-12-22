const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

// 1. INICIALIZAÇÃO DO FIREBASE ADMIN
// Você precisará gerar uma chave privada no console do Firebase (Configurações do Projeto > Contas de Serviço)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}

const db = admin.firestore();

exports.handler = async (event, context) => {
    // 2. SEGURANÇA: Verificação via Netlify Identity (Apostolo)
    const { user } = context.clientContext;
    if (!user || user.user_metadata.cargo !== "Apostolo") {
        return { statusCode: 401, body: "Acesso Negado: Apenas o Apóstolo pode gerar backups." };
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    try {
        // 3. BUSCA DE DADOS NO FIRESTORE (Em vez de arquivos no GitHub)
        const [membrosSnap, logsSnap] = await Promise.all([
            db.collection('membros').get(),
            db.collection('logs').orderBy('data', 'desc').limit(20).get()
        ]);

        const membros = membrosSnap.docs.map(doc => doc.data());
        const logs = logsSnap.docs.map(doc => {
            const d = doc.data();
            // Converte o Timestamp do Firebase para String legível
            const dataFormatada = d.data ? d.data.toDate().toLocaleString('pt-BR') : "N/A";
            return { ...d, dataFormatada };
        });

        // 4. MONTAGEM DO CORPO DO E-MAIL (HTML)
        const emailHtml = `
            <h2 style="color: #163a30;">📊 Relatório Mensal - Famílias Church</h2>
            <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
            <hr>
            <h3>👥 Membros Ativos (${membros.length})</h3>
            <ul>
                ${membros.map(m => `
                    <li><strong>${m.full_name}</strong> - ${m.cargo} <br> 
                    📱 WhatsApp: ${m.whatsapp || 'Não informado'}</li>
                `).join('')}
            </ul>
            <hr>
            <h3>🛡️ Últimos 20 Acessos de Auditoria</h3>
            <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;">
                <tr style="background-color: #f4f6f5;">
                    <th>Data</th><th>Admin</th><th>Cargo</th>
                </tr>
                ${logs.map(l => `
                    <tr>
                        <td>${l.dataFormatada}</td>
                        <td>${l.nome}</td>
                        <td>${l.cargo}</td>
                    </tr>
                `).join('')}
            </table>
            <p style="margin-top: 20px; font-size: 0.8rem; color: #666;">
                Este é um backup automático gerado pelo sistema da Famílias Church.
            </p>
        `;

        // 5. ENVIO VIA SENDGRID
        await sgMail.send({
            to: 'adfamiliaigreja@gmail.com',
            from: 'sistema@familiaschurch.com',
            subject: `📂 Backup Ministerial - ${new Date().toLocaleDateString('pt-BR')}`,
            html: emailHtml,
        });

        return { 
            statusCode: 200, 
            body: JSON.stringify({ msg: "Relatório gerado do Firebase e enviado com sucesso!" }) 
        };

    } catch (err) {
        console.error("Erro na função de relatório:", err);
        return { statusCode: 500, body: "Erro interno ao processar o relatório." };
    }
};