/* ==========================================================
   1. CONFIGURAÇÕES INICIAIS E EVENTOS AO CARREGAR
========================================================== */
document.addEventListener('DOMContentLoaded', function() {

    // --- MENU MOBILE ---
    const mobileBtn = document.getElementById('mobileBtn');
    const navMenu = document.querySelector('.nav-menu');
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileBtn.classList.toggle('active');
        });
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileBtn.classList.remove('active'); 
            });
        });
    }

    // --- FORMULÁRIO DE ORAÇÃO (HOME) ---
    const checkAnonimo = document.getElementById('anonimo');
    if (checkAnonimo) {
        const divIdentificacao = document.getElementById('identificacao-container');
        const inputNome = document.getElementById('nome');
        const inputTelefone = document.getElementById('telefone');
        
        checkAnonimo.addEventListener('change', function() {
            if (this.checked) {
                divIdentificacao.style.display = 'none';
                inputNome.removeAttribute('required');
                inputTelefone.removeAttribute('required');
            } else {
                divIdentificacao.style.display = 'block';
                inputNome.setAttribute('required', 'true');
                inputTelefone.setAttribute('required', 'true');
            }
        });
    }

    // --- PERSONALIZAÇÃO ASSUNTO DÍZIMO (PÁGINA DOAÇÕES) ---
    const formDizimo = document.querySelector('.form-custom');
    if (formDizimo) {
        formDizimo.addEventListener('submit', function() {
            const campoNome = this.querySelector('input[name="nome"]');
            const campoAssunto = this.querySelector('input[name="_subject"]');
            if (campoNome && campoAssunto) {
                campoAssunto.value = "Dízimo - " + campoNome.value;
            }
        });
    }

    // --- REDIRECIONAMENTO ADMIN (NETLIFY IDENTITY) ---
    if (window.netlifyIdentity) {
        window.netlifyIdentity.on("init", user => {
            if (!user) {
                window.netlifyIdentity.on("login", () => {
                    document.location.href = "/admin/";
                });
            }
        });
    }

    // --- DISPARAR CARREGAMENTO DE CONTEÚDO DINÂMICO ---
    if (document.getElementById('lista-proximos')) {
        carregarEventos(); // Página de eventos.html
    }
    
    if (document.getElementById('evento-principal')) {
        carregarDestaquesHome(); // Página index.html
    }
});

/* ==========================================================
   2. LÓGICA DE EVENTOS (PÁGINA EVENTOS.HTML)
========================================================== */
async function carregarEventos() {
    const listaProximos = document.getElementById('lista-proximos');
    const listaPassados = document.getElementById('lista-passados');
    const agora = new Date();

    try {
        const respostaIndice = await fetch('./content/eventos/index.json');
        const arquivos = await respostaIndice.json();

        const promessas = arquivos.map(file => fetch(`./content/eventos/${file}`).then(res => res.json()));
        const eventos = await Promise.all(promessas);

        // Ajustado para 'is_special' e 'date'
        const ordenador = (a, b) => {
            if (a.is_special !== b.is_special) {
                return a.is_special ? -1 : 1;
            }
            return new Date(a.date) - new Date(b.date);
        };

        // Ajustado para 'date'
        const proximos = eventos.filter(ev => new Date(ev.date) >= agora).sort(ordenador);
        const passados = eventos.filter(ev => new Date(ev.date) < agora).sort(ordenador);

        renderizar(proximos, listaProximos);
        renderizar(passados, listaPassados, true);

    } catch (erro) {
        console.error("Erro ao carregar eventos:", erro);
        if(listaProximos) listaProximos.innerHTML = "<p>Erro ao carregar eventos.</p>";
    }
}

function renderizar(lista, container, isPast = false) {
    if (!container) return;
    container.innerHTML = ""; 

    if (lista.length === 0) {
        container.innerHTML = "<p>Nenhum evento encontrado.</p>";
        return;
    }

    lista.forEach(evento => {
        // Ajustado para 'evento.date'
        const dataFormatada = new Date(evento.date).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        // Mapeamento: is_special -> destaque, image -> img, title -> h3, body -> descricao
        const card = `
            <div class="card-evento ${evento.is_special ? 'destaque-encontro' : ''} ${isPast ? 'evento-passado' : ''}">
                <div class="card-img">
                    <img src="${evento.image}" alt="${evento.title}">
                </div>
                <div class="card-info">
                    ${evento.is_special ? '<span class="badge">Destaque</span>' : ''}
                    <h3>${evento.title}</h3>
                    <p class="data">${dataFormatada}</p>
                    <p class="descricao">${evento.body ? evento.body.substring(0, 100) + '...' : ''}</p>
                    ${!isPast ? `<a href="eventos.html" class="btn-card">Saber mais</a>` : ''}
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
}

/* ==========================================================
   3. DESTAQUES DA HOME (PÁGINA INDEX.HTML)
========================================================== */
async function carregarDestaquesHome() {
    const agora = new Date();
    const containerPrincipal = document.getElementById('evento-principal');
    const containerSecundarios = document.getElementById('eventos-secundarios');

    try {
        const respostaIndice = await fetch('./content/eventos/index.json');
        const arquivos = await respostaIndice.json();
        
        const promessas = arquivos.map(file => fetch(`./content/eventos/${file}`).then(res => res.json()));
        const eventos = await Promise.all(promessas);

        // Ajustado para 'date'
        const proximos = eventos.filter(e => new Date(e.date) >= agora);

        if (proximos.length === 0) {
            containerPrincipal.innerHTML = "<p>Fique atento às nossas redes para os próximos eventos!</p>";
            return;
        }

        // Ajustado para 'is_special' e 'date'
        proximos.sort((a, b) => {
            if (a.is_special !== b.is_special) return a.is_special ? -1 : 1;
            return new Date(a.date) - new Date(b.date);
        });

        const principal = proximos[0];
        const secundarios = proximos.slice(1, 3);

        // Render Principal (Ajustado para image, title, date)
        containerPrincipal.innerHTML = `
            <div class="card-principal">
                <img src="${principal.image}" alt="${principal.title}">
                <div class="info-overlay">
                    <span>${principal.is_special ? 'DESTAQUE ESPECIAL' : 'PRÓXIMO DESTAQUE'}</span>
                    <h3>${principal.title}</h3>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <a href="eventos.html" class="btn-copy" style="width: fit-content; margin-top:15px">Saiba Mais</a>
                        <button class="btn-share-whatsapp" style="margin-top:15px; border:none; background:none; cursor:pointer; font-size:1.5rem;" 
                                onclick="compartilharWhatsapp('${principal.title}', '${new Date(principal.date).toLocaleDateString('pt-BR')}')">
                            📲
                        </button>
                    </div>
                </div>
            </div>`;

        // Render Secundários (Ajustado para image, title, date)
        if (containerSecundarios) {
            containerSecundarios.innerHTML = secundarios.map(ev => `
                <div class="card-secundario">
                    <img src="${ev.image}">
                    <div class="info-pequena">
                        <h4 style="color: var(--cor-primaria)">${ev.title}</h4>
                        <p style="font-size: 0.8rem; color: #666">${new Date(ev.date).toLocaleDateString('pt-BR')}</p>
                        <a href="eventos.html" style="color: var(--cor-destaque); font-weight: bold; font-size: 0.8rem">SAIBA MAIS →</a>
                    </div>
                </div>
            `).join('');
        }

    } catch (err) { 
        console.error("Erro nos destaques:", err);
    }
}


/* ==========================================================
   4. FUNÇÕES GLOBAIS (AUXILIARES)
========================================================== */

function trocarUnidade(estado) {    
    const contentPR = document.getElementById('conteudo-pr');
    const contentSC = document.getElementById('conteudo-sc');
    const btnPR = document.getElementById('btn-pr');
    const btnSC = document.getElementById('btn-sc');
    
    if (estado === 'pr') {
        contentPR?.classList.remove('hidden');
        contentSC?.classList.add('hidden');
        btnPR?.classList.add('active');
        btnSC?.classList.remove('active');
    } else {
        contentPR?.classList.add('hidden');
        contentSC?.classList.remove('hidden');
        btnSC?.classList.add('active');
        btnPR?.classList.remove('active');
    }
}

function ativarAba(elemento) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    elemento.classList.add('active');

    const displayImg = document.getElementById('tabImg');
    const displayTitulo = document.getElementById('tabTitulo');
    const displayDesc = document.getElementById('tabDesc');

    if (displayImg) {
        displayImg.style.opacity = '0';
        setTimeout(() => {
            displayImg.src = elemento.getAttribute('data-img');
            displayTitulo.textContent = elemento.getAttribute('data-titulo');
            displayDesc.textContent = elemento.getAttribute('data-desc');
            displayImg.style.opacity = '1';
        }, 200);
    }
}

function mostrarOpcao(tipo) {
    const boxOferta = document.getElementById('box-oferta');
    const boxDizimo = document.getElementById('box-dizimo');
    const botoes = document.querySelectorAll('.btn-toggle');
    botoes.forEach(btn => btn.classList.remove('active'));

    if (tipo === 'oferta') {
        boxOferta?.classList.remove('hidden');
        boxDizimo?.classList.add('hidden');
        botoes[0]?.classList.add('active');
    } else {
        boxOferta?.classList.add('hidden');
        boxDizimo?.classList.remove('hidden');
        botoes[1]?.classList.add('active');
    }
}

function copiarPix(id) {
    const texto = document.getElementById(id).innerText;
    navigator.clipboard.writeText(texto).then(() => alert("Chave Pix copiada!"));
}

function formatarMoeda(i) {
    let v = i.value.replace(/\D/g,'');
    v = (v/100).toFixed(2) + '';
    v = v.replace(".", ",");
    v = v.replace(/(\d)(\d{3})(\d{3}),/g, "$1.$2.$3,");
    v = v.replace(/(\d)(\d{3}),/g, "$1.$2,");
    i.value = v;
}

function compartilharWhatsapp(titulo, data) {
    const urlSite = window.location.href;
    const mensagem = encodeURIComponent(
        `Olá! Veja este evento na Famílias Church:\n\n` +
        `📌 *${titulo}*\n` +
        `📅 ${data}\n\n` +
        `Confira os detalhes no site: ${urlSite}`
    );
    window.open(`https://api.whatsapp.com/send?text=${mensagem}`, '_blank');
}
/* No DOMContentLoaded, adicione estes gatilhos: */
document.addEventListener('DOMContentLoaded', function() {
    // ... (mantenha o que já existe)

    if (document.getElementById('lista-devocionais')) {
        carregarPublicacoes('devocionais', 'lista-devocionais');
    }
    if (document.getElementById('lista-estudos')) {
        carregarPublicacoes('estudos', 'lista-estudos');
    }
});

/* Nova função para carregar publicações */
async function carregarPublicacoes(tipo, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const caminhoBase = `./content/publicacoes/${tipo}/`;
        const respostaIndice = await fetch(`${caminhoBase}index.json`);
        const arquivos = await respostaIndice.json();

        const promessas = arquivos.map(file => fetch(`${caminhoBase}${file}`).then(res => res.json()));
        const publicacoes = await Promise.all(promessas);

        // Ordenar por data (mais recente primeiro)
        publicacoes.sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = publicacoes.map(pub => `
            <article class="card-publicacao">
                <div class="pub-info">
                    <span class="autor">${pub.autor}</span>
                    <h3>${pub.title}</h3>
                    <p class="data">${new Date(pub.date).toLocaleDateString('pt-BR')}</p>
                    <p class="resumo">${pub.body.substring(0, 150)}...</p>
                    <a href="#" class="btn-ler">Ler mensagem completa</a>
                </div>
            </article>
        `).join('');

    } catch (erro) {
        console.error(`Erro ao carregar ${tipo}:`, erro);
        container.innerHTML = "<p>Nenhuma publicação encontrada.</p>";
    }
}

/* No seu DOMContentLoaded existente, adicione: */
if (document.getElementById('lista-devocionais')) {
    carregarPublicacoes('devocionais', 'lista-devocionais');
}

/* Nova função genérica para publicações */
async function carregarPublicacoes(tipo, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const caminhoBase = `./content/publicacoes/${tipo}/`;
        const respostaIndice = await fetch(`${caminhoBase}index.json`);
        const arquivos = await respostaIndice.json();

        const promessas = arquivos.map(file => fetch(`${caminhoBase}${file}`).then(res => res.json()));
        const lista = await Promise.all(promessas);

        // Ordenar por data mais recente
        lista.sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = lista.map(item => `
            <div class="card-publicacao">
                <h3>${item.title}</h3>
                <span class="autor">Por: ${item.autor}</span>
                <p class="data">${new Date(item.date).toLocaleDateString('pt-BR')}</p>
                <div class="texto-previo">${item.body.substring(0, 200)}...</div>
                <button onclick="abrirLeituraCompleta('${item.title}')">Ler mais</button>
            </div>
        `).join('');

    } catch (err) {
        console.error("Erro ao carregar publicações:", err);
        container.innerHTML = "<p>Nenhuma mensagem disponível no momento.</p>";
    }
}

let todasAsPublicacoes = []; // Cache para evitar múltiplos fetchs

async function carregarFeed() {
    const container = document.getElementById('lista-publicacoes');
    if (!container) return;

    try {
        // Busca os índices das duas pastas
        const caminhos = [
            './content/publicacoes/devocionais/index.json',
            './content/publicacoes/estudos/index.json'
        ];

        const respostasIndices = await Promise.all(caminhos.map(c => fetch(c).then(r => r.json())));
        
        // Coleta todos os arquivos e busca o conteúdo
        let promessasConteudo = [];
        respostasIndices[0].forEach(f => promessasConteudo.push(fetch(`./content/publicacoes/devocionais/${f}`).then(r => r.json())));
        respostasIndices[1].forEach(f => promessasConteudo.push(fetch(`./content/publicacoes/estudos/${f}`).then(r => r.json())));

        todasAsPublicacoes = await Promise.all(promessasConteudo);
        renderizarPublicacoes(todasAsPublicacoes);

    } catch (err) {
        console.error("Erro no feed:", err);
    }
}

function renderizarPublicacoes(lista) {
    const container = document.getElementById('lista-publicacoes');
    container.innerHTML = lista.map(item => `
        <div class="card-publicacao">
            <span class="autor">${item.autor}</span>
            <h3>${item.title}</h3>
            <p class="data">${new Date(item.date).toLocaleDateString('pt-BR')}</p>
            <div class="texto-previo">${item.body.substring(0, 250)}...</div>
            <button class="btn-card" onclick="abrirLeitura('${item.title}')">Ler na íntegra</button>
        </div>
    `).join('');
}

function abrirLeitura(titulo) {
    const pub = todasAsPublicacoes.find(p => p.title === titulo);
    const modal = document.getElementById('modalLeitura');
    const display = document.getElementById('conteudo-completo-leitura');

    // A MÁGICA: Converte o texto Markdown do campo 'body' em HTML puro
    const conteudoHTML = marked.parse(pub.body);

    display.innerHTML = `
        <small class="tipo-tag">${pub.tipo.toUpperCase()}</small>
        <h1 style="font-size: 3rem; margin: 20px 0; font-family: 'Playfair Display', serif;">${pub.title}</h1>
        <p><strong>Por: ${pub.autor}</strong> — ${new Date(pub.date).toLocaleDateString('pt-BR')}</p>
        <hr style="opacity: 0.2; margin: 30px 0;">
        <div class="texto-completo" style="font-size: 1.25rem;">
            ${conteudoHTML}
        </div>
    `;
    
    modal.style.display = "block";
    document.body.style.overflow = "hidden"; // Impede o scroll do fundo enquanto lê
}


function fecharLeitura() {
    document.getElementById('modalLeitura').style.display = "none";
    document.body.style.overflow = "auto";
}

// Chame carregarFeed() no seu DOMContentLoaded
