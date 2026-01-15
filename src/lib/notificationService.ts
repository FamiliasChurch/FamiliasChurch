import { db } from "./firebase";
import { collection, addDoc, serverTimestamp, query, getDocs, writeBatch, doc } from "firebase/firestore";

// --- GRUPOS DE PERMISSÃO V2 ---
export const GROUPS = {
    // Apenas quem mexe com dinheiro
    FINANCEIRO: ["Dev", "Admin", "Gerenciador"], 

    // Apenas quem produz/entrega carteirinhas
    CARTEIRINHAS: ["Dev", "Admin", "Gerenciador"],

    // Quem modera/recebe pedidos
    ORACAO: ["Dev", "Admin", "Publicador", "Pastor", "Apóstolo"],

    // Quem define a agenda
    AGENDA: ["Dev", "Admin", "Gerenciador", "Midia", "Mídia"],

    // Quem gerencia a secretaria
    MEMBROS: ["Dev", "Admin", "Gerenciador"], 

    // Quem gerencia escalas e grupos
    MINISTERIOS: ["Dev", "Admin", "Gerenciador", "Moderador"], 
};

// 1. Enviar Notificação Individual
// AJUSTE: 'link' movido para 4º posição para facilitar redirecionamento
// AJUSTE: 'type' movido para 5º posição com valor padrão "aviso"
export const sendNotification = async (
  toEmail: string, 
  title: string, 
  message: string, 
  link: string = "", 
  type: "escala" | "evento" | "devocional" | "aviso" | "financeiro" | "admin" | "social" = "aviso"
) => {
  try {
    if (!toEmail) return;
    
    await addDoc(collection(db, "notificacoes_usuario"), {
      toEmail, 
      title,
      message,
      link, // Link para redirecionamento
      type, // Ícone/Cor (usado no NotificationBell)
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Erro ao enviar notificação individual:", error);
  }
};

// 2. Enviar Notificação por Grupo
export const notifyRoles = async (
    rolesAlvo: string[], 
    title: string,
    message: string,
    type: "escala" | "evento" | "devocional" | "aviso" | "financeiro" | "admin" | "social" = "aviso",
    link: string = "/admin" 
) => {
    try {
        const rolesAlvoLower = rolesAlvo.map(r => r.toLowerCase());

        const q = query(collection(db, "contas_acesso"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return;

        const batch = writeBatch(db);
        let count = 0;

        snapshot.docs.forEach(userDoc => {
            const data = userDoc.data();
            
            const userPermissao = (data.permissao || "").toLowerCase();
            const userCargo = (data.cargo || "").toLowerCase();

            // Verifica permissão ou cargo
            const temPermissao = userPermissao && rolesAlvoLower.includes(userPermissao);
            const temCargo = userCargo && rolesAlvoLower.includes(userCargo);

            if ((temPermissao || temCargo) && data.email) {
                const newNotifRef = doc(collection(db, "notificacoes_usuario"));
                batch.set(newNotifRef, {
                    toEmail: data.email,
                    title,
                    message,
                    type,
                    link,
                    read: false,
                    createdAt: serverTimestamp()
                });
                count++;
            }
        });

        if (count > 0) {
            await batch.commit();
            console.log(`Notificação enviada para ${count} usuários.`);
        }

    } catch (error) {
        console.error("Erro ao notificar grupo:", error);
    }
};

// 3. Log Administrativo
export const logNotificationBatch = async (
    titulo: string,
    qtdDestinatarios: number,
    status: "Sucesso" | "Falha"
) => {
    try {
        await addDoc(collection(db, "logs_notificacoes"), {
            titulo,
            destinatarios: qtdDestinatarios,
            status,
            enviadoEm: serverTimestamp()
        });
    } catch (e) {
        console.error("Erro ao gravar log", e);
    }
};