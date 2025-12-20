exports.handler = async (event) => {
    const TOKEN = process.env.GH_TOKEN;
    const REPO = "FamiliasChurch/FamiliasChurch";
    // Pastas que queremos incluir no backup
    const pastas = [
        'content/eventos', 
        'content/publicacoes/devocionais', 
        'content/publicacoes/estudos',
        'content/contribuicoes',
        'content/testemunhos',
        'content/oracoes'
    ];

    try {
        let backupCompleto = {
            data_backup: new Date().toISOString(),
            versao_sistema: "1.0.0",
            conteudo: {}
        };

        // Loop assíncrono para buscar dados de cada pasta
        for (const pasta of pastas) {
            const resList = await fetch(`https://api.github.com/repos/${REPO}/contents/${pasta}`, {
                headers: { 'Authorization': `token ${TOKEN}` }
            });
            
            if (resList.ok) {
                const files = await resList.json();
                const dataPromises = files
                    .filter(f => f.name.endsWith('.json') && f.name !== 'index.json')
                    .map(async (file) => {
                        const res = await fetch(file.download_url);
                        return { nome: file.name, dados: await res.json() };
                    });

                backupCompleto.conteudo[pasta] = await Promise.all(dataPromises);
            }
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(backupCompleto)
        };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};