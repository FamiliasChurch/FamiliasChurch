exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Método não permitido" };

    const { payload, path, folder } = JSON.parse(event.body);
    const TOKEN = process.env.GH_TOKEN;
    const REPO = "FamiliasChurch/FamiliasChurch";

    try {
        // 1. SALVAR O NOVO FICHEIRO JSON
        const contentBase64 = Buffer.from(JSON.stringify(payload, null, 2)).toString('base64');
        await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `Add: ${payload.title}`, content: contentBase64 })
        });

        // 2. BUSCAR LISTA DE FICHEIROS NA PASTA PARA ATUALIZAR O ÍNDICE
        const folderPath = path.substring(0, path.lastIndexOf('/'));
        const resFolder = await fetch(`https://api.github.com/repos/${REPO}/contents/${folderPath}`, {
            headers: { 'Authorization': `token ${TOKEN}` }
        });
        const files = await resFolder.json();

        // Filtra apenas ficheiros .json e ignora o index.json
        const indexData = files
            .filter(f => f.name.endsWith('.json') && f.name !== 'index.json')
            .map(f => f.name);

        // 3. ATUALIZAR O index.json (Precisa do SHA se já existir)
        const resIndex = await fetch(`https://api.github.com/repos/${REPO}/contents/${folderPath}/index.json`, {
            headers: { 'Authorization': `token ${TOKEN}` }
        });
        const indexFile = resIndex.ok ? await resIndex.json() : null;

        const indexBase64 = Buffer.from(JSON.stringify(indexData, null, 2)).toString('base64');
        await fetch(`https://api.github.com/repos/${REPO}/contents/${folderPath}/index.json`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "Auto-update index.json",
                content: indexBase64,
                sha: indexFile ? indexFile.sha : undefined
            })
        });

        return { statusCode: 200, body: JSON.stringify({ msg: "Publicado e Indexado!" }) };

    } catch (err) {
        return { statusCode: 500, body: err.toString() };
    }
};