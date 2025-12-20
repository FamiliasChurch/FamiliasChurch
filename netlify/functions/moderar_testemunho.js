exports.handler = async (event) => {
    const { fileId, novoStatus } = JSON.parse(event.body);
    const TOKEN = process.env.GH_TOKEN;
    const REPO = "FamiliasChurch/FamiliasChurch";
    const path = `content/testemunhos/${fileId}`;

    try {
        // 1. Busca o arquivo original
        const resGet = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
            headers: { 'Authorization': `token ${TOKEN}` }
        });
        const fileData = await resGet.json();
        const content = JSON.parse(Buffer.from(fileData.content, 'base64').toString());

        // 2. Atualiza o status
        content.status = novoStatus;
        content.moderado_em = new Date().toISOString();

        // 3. Salva de volta
        await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Moderação: ${novoStatus} - ${fileId}`,
                content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
                sha: fileData.sha
            })
        });

        return { statusCode: 200, body: "Sucesso" };
    } catch (err) {
        return { statusCode: 500, body: err.toString() };
    }
};