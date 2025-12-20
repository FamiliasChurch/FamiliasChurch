exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Método não permitido" };

    const { payload, userEmail } = JSON.parse(event.body);
    const TOKEN = process.env.GH_TOKEN;
    const REPO = "FamiliasChurch/FamiliasChurch";

    const safeEmail = userEmail.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `contr-${safeEmail}-${Date.now()}.json`;
    const folderPath = `content/contribuicoes`;
    const path = `${folderPath}/${fileName}`;

    try {
        // 1. Grava o registo da contribuição
        const contentBase64 = Buffer.from(JSON.stringify(payload, null, 2)).toString('base64');
        await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `Dízimo registado: ${userEmail}`, content: contentBase64 })
        });

        // 2. Atualiza o index.json da pasta contribuições (Essencial para a soma no perfil)
        const resFolder = await fetch(`https://api.github.com/repos/${REPO}/contents/${folderPath}`, {
            headers: { 'Authorization': `token ${TOKEN}` }
        });
        const files = await resFolder.json();
        const indexData = files.filter(f => f.name.endsWith('.json') && f.name !== 'index.json').map(f => f.name);

        const resIndex = await fetch(`https://api.github.com/repos/${REPO}/contents/${folderPath}/index.json`, {
            headers: { 'Authorization': `token ${TOKEN}` }
        });
        const indexFile = resIndex.ok ? await resIndex.json() : null;

        await fetch(`https://api.github.com/repos/${REPO}/contents/${folderPath}/index.json`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "Update contribuicoes index",
                content: Buffer.from(JSON.stringify(indexData, null, 2)).toString('base64'),
                sha: indexFile ? indexFile.sha : undefined
            })
        });

        return { statusCode: 200, body: JSON.stringify({ msg: "Dízimo registado com sucesso!" }) };
    } catch (err) {
        return { statusCode: 500, body: err.toString() };
    }
};