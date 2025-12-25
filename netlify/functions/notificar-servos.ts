import { schedule } from '@netlify/functions';
import { db } from '../../src/lib/firebase'; // Ajuste o caminho conforme o seu projeto
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const handler = schedule('0 9 * * *', async (event) => {
  try {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const dataString = amanha.toISOString().split('T')[0]; // Formato YYYY-MM-DD

    // 1. Procurar escalas para amanhã no Firestore
    const q = query(collection(db, "escalas_servos"), where("dataCulto", "==", dataString));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return { statusCode: 200 };

    for (const doc of snapshot.docs) {
      const escala = doc.data();
      
      // 2. Enviar e-mail para cada servo (Assumindo que temos os e-mails na lista)
      // Nota: No seu sistema, seria ideal guardar o e-mail junto ao nome na escala
      await resend.emails.send({
        from: 'Famílias Church <no-reply@familiaschurch.org>',
        to: 'lideranca@familiaschurch.org', // Para teste, ou use o e-mail do servo
        subject: `🔔 Lembrete de Serviço: ${escala.ministerio}`,
        html: `<p>Olá! Este é um lembrete de que você está escalado para servir amanhã no ministério <strong>${escala.ministerio}</strong>.</p>`
      });
    }

    return { statusCode: 200 };
  } catch (error) {
    console.error(error);
    return { statusCode: 500 };
  }
});
