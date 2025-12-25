// netlify/functions/backup-financeiro.ts
import { schedule } from '@netlify/functions';
import { db } from '../../src/lib/firebase';

import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const handler = schedule('0 3 * * 1', async () => {
    try {
        const snapshot = await getDocs(collection(db, "registros_dizimos"));
        const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (dados.length === 0) return { statusCode: 200 };

        // RESOLVE O ERRO DE VARIÁVEL NÃO ENCONTRADA
        const totalSemeado = dados.reduce((acc, curr: any) => acc + Number(curr.valor || 0), 0);

        const backupJson = JSON.stringify(dados, null, 2);
        const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');

        // GRAVA OS METADADOS (RESOLVE O ERRO DE addDoc e serverTimestamp)
        await addDoc(collection(db, "backup_metadata"), {
            dataBackup: dataAtual,
            valorTotalNoMomento: totalSemeado, // Agora a variável existe!
            quantidadeRegistros: snapshot.size,
            criadoEm: serverTimestamp()
        });

        // Envio de e-mail com anexo JSON...
        return { statusCode: 200 };
    } catch (error) {
        return { statusCode: 500 };
    }
});