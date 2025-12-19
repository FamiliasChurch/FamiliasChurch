/* ==========================================================
   CONFIGURAÇÕES GERAIS E CONFIG
========================================================== */
const CONFIG = {
    basePath: './content',
    repo: "FamiliasChurch/FamiliasChurch"
};

// Cache global para evitar múltiplos fetches
let cacheConteudo = []; 
let synth = window.speechSynthesis;
let utterance = null;

/* ==========================================================
   ORQUESTRADOR DE INICIALIZAÇÃO
========================================================== */
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Carrega Componentes Modulares (Header e Footer)
    await carregarComponentes();
    
    // 2. Inicializa Menu Mobile (Pós-carregamento do Header)
    initMenuMobile();

    // 3. ROTEADOR: Executa funções específicas conforme os IDs na página
    const acoes = {
        'lista-proximos': carregarEventos,        // Página Eventos
        'evento-principal': carregarDestaquesHome, // Home
        'lista-publicacoes': carregarFeed,         // Página Devocionais
        'anonimo': initFormOracao,                 // Formulário Oração
        'box-oferta': () => mostrarOpcao('oferta'), // Página Doações
        'passkey': initAdminObreiros               // Admin
    };

    Object.keys(acoes).forEach(id => {
        if (document.getElementById(id)) acoes[id]();
    });

    // Netlify Identity
    if (window.netlifyIdentity) {
        window.netlifyIdentity.on("init", user => {
            if (!user) window.netlifyIdentity.on("login", () => document.location.href = "/admin/");
        });
    }
});

/* ==========================================================
   1. CORE: COMPONENTIZAÇÃO E UI
========================================================== */
async function carregarComponentes() {
    const itens = [
        { id: 'header', file: 'header' },
        { id: 'footer', file: 'footer' }
    ];
    
    const promessas = itens.map(async item => {
        const el = document.getElementById(item.id);
        if (el) {
            try {
                const res = await fetch(`./components/${item.file}.html`);
                el.innerHTML = await res.text();
            } catch (e) { console.error(`Erro ao carregar ${item.file}`); }
        }
    });
    await Promise.all(promessas);
}

function initMenuMobile() {
    const btn = document.getElementById('mobileBtn');
    const menu = document.querySelector('.nav-menu');
    if (!btn || !menu) return;

    const toggle = () => {
        menu.classList.toggle('active');
        btn.classList.toggle('active');
    };

    btn.onclick = toggle;
    document.querySelectorAll('.nav-link').forEach(l => l.onclick = toggle);
}

/* ==========================================================
   2. BUSCA DE DADOS E EVENTOS
========================================================== */
async function fetchConteudo(subpasta) {
    const res = await fetch(`${CONFIG.basePath}/${subpasta}/index.json`);
    const arquivos = await res.json();
    return Promise.all(arquivos.map(f => fetch(`${CONFIG.basePath}/${subpasta}/${f}`).then(r => r.json())));
}

async function carregarEventos() {
    const eventos = await fetchConteudo('eventos');
    const agora = new Date();
    
    const ordenador = (a, b) => (a.is_special !== b.is_special ? (a.is_special ? -1 : 1) : new Date(a.date) - new Date(b.date));
    
    const proximos = eventos.filter(e => new Date(e.date) >= agora).sort(ordenador);
    const passados = eventos.filter(e => new Date(e.date) < agora).sort(ordenador);

    renderizarCards(proximos, 'lista-proximos');
    renderizarCards(passados, 'lista-passados', true);
}

function renderizarCards(lista, containerId, isPast = false) {
    const container = document.getElementById(containerId);
    if (!container || lista.length === 0) {
        if (container) container.innerHTML = "<p>Nenhum conteúdo encontrado.</p>";
        return;
    }

    container.innerHTML = lista.map(e => `
        <div class="card-evento ${e.is_special ? 'destaque-encontro' : ''} ${isPast ? 'evento-passado' : ''}">
            <div class="card-img"><img src="${e.image}" alt="${e.title}"></div>
            <div class="card-info">
                ${e.is_special ? '<span class="badge">Destaque</span>' : ''}
                <h3>${e.title}</h3>
                <p class="data">${new Date(e.date).toLocaleDateString('pt-BR')}</p>
                <p class="descricao">${e.body?.substring(0, 100)}...</p>
                ${!isPast ? `<a href="eventos.html" class="btn-card">Saber mais</a>` : ''}
            </div>
        </div>
    `).join('');
}

/* ==========================================================
   3. PUBLICACÕES (FEED E LEITURA)
========================================================== */
async function carregarFeed() {
    const folders = ['devocionais', 'estudos'];
    const promessas = folders.map(f => fetchConteudo(`publicacoes/${f}`));
    const resultados = await Promise.all(promessas);
    
    cacheConteudo = resultados.flat().sort((a,b) => new Date(b.date) - new Date(a.date));
    renderizarFeed(cacheConteudo);
}

function renderizarFeed(lista) {
    const container = document.getElementById('lista-publicacoes');
    if (!container) return;
    
    container.innerHTML = lista.map(p => `
        <div class="card-publicacao">
            <span class="autor">${p.autor}</span>
            <h3>${p.title}</h3>
            <p class="data">${new Date(p.date).toLocaleDateString('pt-BR')}</p>
            <div class="texto-previo">${p.body.substring(0, 250)}...</div>
            <button class="btn-card" onclick="abrirLeitura('${p.title}')">Ler na íntegra</button>
        </div>
    `).join('');
}

function abrirLeitura(titulo) {
    const pub = cacheConteudo.find(p => p.title === titulo);
    const modal = document.getElementById('modalLeitura');
    const display = document.getElementById('conteudo-completo-leitura');

    display.innerHTML = `
        <div class="controles-audio">
            <button onclick="iniciarLeitura()" id="btnOuvir" class="btn-audio">🔊 Ouvir</button>
            <button onclick="pararLeitura()" id="btnParar" class="btn-audio hidden">⏹️ Parar</button>
        </div>
        <small class="tipo-tag">${pub.tipo?.toUpperCase() || 'MENSAGEM'}</small>
        <h1 style="font-family: 'Playfair Display', serif; margin: 20px 0;">${pub.title}</h1>
        <p><strong>Por: ${pub.autor}</strong></p>
        <hr><div class="texto-completo">${marked.parse(pub.body)}</div>
    `;
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
}

/* ==========================================================
   4. UTILITÁRIOS (ÁUDIO, PIX, FORM)
========================================================== */
function iniciarLeitura() {
    const texto = document.querySelector('.texto-completo').innerText;
    synth.cancel();
    utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'pt-BR';
    utterance.onend = pararLeitura;
    synth.speak(utterance);
    document.getElementById('btnOuvir').classList.add('hidden');
    document.getElementById('btnParar').classList.remove('hidden');
}

function pararLeitura() {
    synth.cancel();
    document.getElementById('btnOuvir')?.classList.remove('hidden');
    document.getElementById('btnParar')?.classList.add('hidden');
}

function fecharLeitura() {
    pararLeitura();
    document.getElementById('modalLeitura').style.display = "none";
    document.body.style.overflow = "auto";
}

function copiarPix(id) {
    navigator.clipboard.writeText(document.getElementById(id).innerText).then(() => alert("Chave Pix copiada!"));
}

function formatarMoeda(i) {
    let v = i.value.replace(/\D/g,'');
    v = (v/100).toFixed(2).replace(".", ",").replace(/(\d)(\d{3})(\d{3}),/g, "$1.$2.$3,").replace(/(\d)(\d{3}),/g, "$1.$2,");
    i.value = v;
}

// Inicializadores de Formulário
function initFormOracao() {
    const check = document.getElementById('anonimo');
    const container = document.getElementById('identificacao-container');
    check.onchange = () => {
        container.style.display = check.checked ? 'none' : 'block';
        container.querySelectorAll('input').forEach(i => i.required = !check.checked);
    };
}

/* ==========================================================
   5. HOME (DESTAQUES)
========================================================== */
async function carregarDestaquesHome() {
    const eventos = await fetchConteudo('eventos');
    const agora = new Date();
    const proximos = eventos.filter(e => new Date(e.date) >= agora).sort((a,b) => (a.is_special ? -1 : 1));

    if (proximos.length === 0) return;

    const principal = proximos[0];
    const secundarios = proximos.slice(1, 3);

    document.getElementById('evento-principal').innerHTML = `
        <div class="card-principal">
            <img src="${principal.image}" alt="${principal.title}">
            <div class="info-overlay">
                <span>PRÓXIMO DESTAQUE</span>
                <h3>${principal.title}</h3>
                <div style="display:flex; gap:10px;">
                    <a href="eventos.html" class="btn-copy">Saiba Mais</a>
                    <button class="btn-share-whatsapp" onclick="compartilharWhatsapp('${principal.title}', '${new Date(principal.date).toLocaleDateString('pt-BR')}')">📲</button>
                </div>
            </div>
        </div>`;
}

function compartilharWhatsapp(titulo, data) {
    const msg = encodeURIComponent(`Olá! Veja este evento na Famílias Church:\n📌 *${titulo}*\n📅 ${data}\nConfira: ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
}