exports.handler = async (event) => {
    const { userEmail } = event.queryStringParameters;
    const TOKEN = process.env.GH_TOKEN;
    const REPO = "FamiliasChurch/FamiliasChurch";

    // Padronização do e-mail para busca (mesma lógica do envio)
    const safeEmail = userEmail.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    try {
        // 1. Lista todos os ficheiros na pasta de orações
        const resList = await fetch(`https://api.github.com/repos/${REPO}/contents/content/oracoes`, {
            headers: { 'Authorization': `token ${TOKEN}` }
        });
        const allFiles = await resList.json();

        // 2. Filtra ficheiros que começam com o e-mail do usuário
        const userFiles = allFiles.filter(f => f.name.startsWith(`oracao-${safeEmail}`));

        // 3. Busca o conteúdo de cada ficheiro encontrado
        const dataPromises = userFiles.map(async (file) => {
            const resFile = await fetch(file.download_url);
            return resFile.json();
        });

        const results = await Promise.all(dataPromises);

        // Retorna a lista ordenada pela data (mais recente primeiro)
        const sorted = results.sort((a, b) => new Date(b.date) - new Date(a.date));

        return { statusCode: 200, body: JSON.stringify(sorted) };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};