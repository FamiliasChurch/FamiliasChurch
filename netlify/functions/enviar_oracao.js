exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Método não permitido" };

    const { payload, userEmail } = JSON.parse(event.body);
    const TOKEN = process.env.GH_TOKEN;
    const REPO = "FamiliasChurch/FamiliasChurch";

    // Criamos um nome de ficheiro único: oracao-email-timestamp.json
    const safeEmail = userEmail.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `oracao-${safeEmail}-${Date.now()}.json`;
    const path = `content/oracoes/${fileName}`;

    try {
        const contentBase64 = Buffer.from(JSON.stringify(payload, null, 2)).toString('base64');

        const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Novo pedido de oração: ${userEmail}`,
                content: contentBase64
            })
        });

        if (!res.ok) throw new Error("Falha ao salvar no GitHub");

        return { statusCode: 200, body: JSON.stringify({ msg: "Oração enviada com sucesso!" }) };
    } catch (err) {
        return { statusCode: 500, body: err.toString() };
    }
};