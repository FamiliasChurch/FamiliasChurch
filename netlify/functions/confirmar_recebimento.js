exports.handler = async (event) => {
    const { fileId } = JSON.parse(event.body); // Nome do ficheiro enviado pelo painel
    const TOKEN = process.env.GH_TOKEN;
    const REPO = "FamiliasChurch/FamiliasChurch";
    const path = `content/contribuicoes/${fileId}`;

    try {
        // 1. Busca o ficheiro atual para obter o SHA e o conteúdo
        const resGet = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
            headers: { 'Authorization': `token ${TOKEN}` }
        });
        const fileData = await resGet.json();
        const content = JSON.parse(Buffer.from(fileData.content, 'base64').toString());

        // 2. Altera o estado
        content.status = "Confirmado";
        content.confirmado_em = new Date().toISOString();

        // 3. Grava o ficheiro atualizado
        await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Confirmado: ${fileId}`,
                content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
                sha: fileData.sha
            })
        });

        return { statusCode: 200, body: "Confirmado com sucesso" };
    } catch (err) {
        return { statusCode: 500, body: err.toString() };
    }
};