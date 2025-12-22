const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    // 1. Segurança: Verifica se quem chama é um Moderador logado
    const { user } = context.clientContext;
    if (!user || !user.app_metadata.roles.includes("mod")) {
        return { statusCode: 401, body: "Acesso Negado: Requer privilégios de Moderador." };
    }

    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Método não permitido" };

    const { targetUserId, novoCargo, novaRole } = JSON.parse(event.body);
    
    // O TOKEN do Identity Admin é fornecido automaticamente pelo Netlify nas Functions
    const identityUrl = process.env.URL + "/.netlify/identity/admin/users/" + targetUserId;
    const adminToken = process.env.NETLIFY_ADMIN_TOKEN; // Você deve configurar isso no painel do Netlify

    try {
        const response = await fetch(identityUrl, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${adminToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_metadata: { cargo: novoCargo },
                app_metadata: { roles: [novaRole] }
            })
        });

        if (!response.ok) throw new Error("Erro ao atualizar usuário no Identity");

        return {
            statusCode: 200,
            body: JSON.stringify({ msg: `Membro atualizado para ${novoCargo} com sucesso!` })
        };
    } catch (err) {
        return { statusCode: 500, body: err.toString() };
    }
};