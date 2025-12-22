    exports.handler = async (event) => {
        if (event.httpMethod !== "POST") return { statusCode: 405, body: "Método não permitido" };

        const { payload, path, folder } = JSON.parse(event.body);
        const TOKEN = process.env.GH_TOKEN;
        const BUILD_HOOK = process.env.NETLIFY_BUILD_HOOK; // Configurar no painel do Netlify
        const REPO = "FamiliasChurch/FamiliasChurch";

        try {
            // 1. SALVAR O NOVO FICHEIRO JSON
            const contentBase64 = Buffer.from(JSON.stringify(payload, null, 2)).toString('base64');
            await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${TOKEN}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `Add: ${payload.title}`, content: contentBase64 })
            });

            // 2. BUSCAR LISTA DE FICHEIROS PARA ATUALIZAR O ÍNDICE
            const folderPath = path.substring(0, path.lastIndexOf('/'));
            const resFolder = await fetch(`https://api.github.com/repos/${REPO}/contents/${folderPath}`, {
                headers: { 'Authorization': `token ${TOKEN}` }
            });
            const files = await resFolder.json();

            const indexData = files
                .filter(f => f.name.endsWith('.json') && f.name !== 'index.json')
                .map(f => f.name);

            // 3. ATUALIZAR O index.json
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

            // 🚀 PASSO 4: DISPARAR O BUILD AUTOMÁTICO
            // Isso fará o Netlify rodar o bundle_content.py e atualizar o site
            if (BUILD_HOOK) {
                await fetch(BUILD_HOOK, { method: 'POST' });
                console.log("Gatilho de Build enviado com sucesso!");
            }

            return { 
                statusCode: 200, 
                body: JSON.stringify({ msg: "Publicado e automação de build iniciada!" }) 
            };

        } catch (err) {
            return { statusCode: 500, body: err.toString() };
        }
    };