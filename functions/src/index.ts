import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

export const notifyNewStudy = onDocumentCreated("estudos_biblicos/{studyId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const data = snapshot.data();
  const titulo = data.titulo;

  // Procura todos os tokens dos membros inscritos
  const tokensSnapshot = await admin.firestore().collection("notificacoes_inscritos").get();
  const registrationTokens = tokensSnapshot.docs.map(doc => doc.data().token);

  if (registrationTokens.length === 0) return;

  const message = {
    notification: {
      title: "📖 Nova Palavra Liberada!",
      body: `Confira agora: "${titulo}"`,
    },
    tokens: registrationTokens,
  };

  try {
    // Envia para todos os tokens registados
    await admin.messaging().sendEachForMulticast(message);
    console.log("Notificações enviadas com sucesso.");
  } catch (error) {
    console.error("Erro ao enviar notificações:", error);
  }
});