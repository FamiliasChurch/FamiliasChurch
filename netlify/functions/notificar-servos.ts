import { schedule } from '@netlify/functions';
import { db } from '../../src/lib/firebase';
// Adicionados: doc, getDoc e addDoc para gerenciar os logs
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const handler = schedule('0 * * * *', async (event: any) => {
  try {
    const configSnap = await getDoc(doc(db, "configuracoes", "notificacoes"));
    const horaConfigurada = configSnap.exists() ? configSnap.data().hora : "09";

    const agora = new Date();
    const horaAtual = agora.getUTCHours() - 3; 
    const horaFormatada = (horaAtual < 0 ? horaAtual + 24 : horaAtual).toString().padStart(2, '0');

    if (horaFormatada !== horaConfigurada) {
      return { statusCode: 200 };
    }

    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const dataString = amanha.toISOString().split('T')[0];

    const q = query(collection(db, "escalas_servos"), where("dataCulto", "==", dataString));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return { statusCode: 200 };

    for (const d of snapshot.docs) {
      const escala = d.data();
      const emails = escala.servosEmails || [];

      if (emails.length > 0) {
        const { data, error } = await resend.emails.send({
          from: 'Famílias Church <avisos@familiaschurch.org>',
          to: emails,
          subject: `🔔 Lembrete: Você serve amanhã no ${escala.ministerio}!`,
          html: ``
        });

        // Gravação do Log no Firestore para auditoria
        await addDoc(collection(db, "logs_notificacoes"), {
          ministerio: escala.ministerio,
          dataCulto: escala.dataCulto,
          destinatarios: emails,
          status: error ? "Erro" : "Sucesso",
          resendId: data?.id || null,
          erroDetalhe: error?.message || null,
          enviadoEm: serverTimestamp()
        });
      }
    }

    return { statusCode: 200 };
  } catch (error: any) {
    console.error("Erro na execução:", error);
    return { statusCode: 500 };
  }
});