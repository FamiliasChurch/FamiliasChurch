exports.handler = async () => {
    const TOKEN = process.env.GH_TOKEN;
    const REPO = "FamiliasChurch/FamiliasChurch";

    try {
        // 1. Lista os ficheiros da pasta
        const resList = await fetch(`https://api.github.com/repos/${REPO}/contents/content/contribuicoes`, {
            headers: { 'Authorization': `token ${TOKEN}` }
        });
        const files = await resList.json();

        // 2. Procura o conteúdo de cada ficheiro .json
        const dataPromises = files
            .filter(f => f.name.endsWith('.json') && f.name !== 'index.json')
            .map(async (file) => {
                const res = await fetch(file.download_url);
                const json = await res.json();
                return { ...json, id: file.name }; // Inclui o nome do ficheiro como ID
            });

        const results = await Promise.all(dataPromises);
        return { statusCode: 200, body: JSON.stringify(results) };
    } catch (err) {
        return { statusCode: 500, body: err.toString() };
    }
};