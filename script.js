/* ==========================================================
   CONFIGURAÇÕES GERAIS COM DETECÇÃO DE NÍVEL
========================================================== */
const prefixo = window.location.pathname.includes('/admin/') ? '../' : './';

const CONFIG = {
    basePath: `${prefixo}content`,
    repo: "FamiliasChurch/FamiliasChurch"
};

let cacheConteudo = [];
let synth = window.speechSynthesis;
let utterance = null;

/* ==========================================================
   ORQUESTRADOR DE INICIALIZAÇÃO
========================================================== */
/* ==========================================================
   ORQUESTRADOR DE INICIALIZAÇÃO OTIMIZADO
========================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // Carrega o esqueleto do site primeiro
    carregarComponentes(); 
    initMenuMobile();

    // Inicia as seções dinâmicas sem travar a navegação
    const rotas = {
        'lista-proximos': carregarEventos,
        'evento-principal': carregarDestaquesHome,
        'mural-testemunhos': carregarMuralTestemunhos,
        'lista-publicacoes': carregarFeed,
        'ministerios-tabs': initTabsMinisterios,
        'formOracao': initFormOracao,
        'passkey': initAdminObreiros
    };

    Object.keys(rotas).forEach(id => {
        if (document.getElementById(id)) setTimeout(rotas[id], 0);
    });

    // ÚNICO lugar para configurar o Netlify Identity
    if (window.netlifyIdentity) {
        window.netlifyIdentity.on("init", user => {
            if (user) {
                atualizarDadosUsuario(user);
                checarNotificacoes();
            }
        });

        window.netlifyIdentity.on("login", user => {
            atualizarDadosUsuario(user);
            netlifyIdentity.close();
            // Limpa o cache para garantir que o novo login veja dados novos
            localStorage.clear(); 
            location.reload(); 
        });

        window.netlifyIdentity.on("logout", () => {
            localStorage.clear();
            location.reload();
        });
    }
});

/* ==========================================================
   1. CORE: COMPONENTIZAÇÃO
========================================================== */
async function carregarComponentes() {
    const itens = [{ id: 'header', file: 'header' }, { id: 'footer', file: 'footer' }];
    const promessas = itens.map(async item => {
        const el = document.getElementById(item.id);
        if (el) {
            try {
                const res = await fetch(`${prefixo}components/${item.file}.html`);
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

    const toggleState = () => {
        const isActive = menu.classList.toggle('active');
        btn.classList.toggle('active');
        document.body.classList.toggle('menu-open', isActive);
    };

    btn.onclick = toggleState;

    document.querySelectorAll('.nav-link').forEach(link => {
        link.onclick = () => {
            menu.classList.remove('active');
            btn.classList.remove('active');
            document.body.classList.remove('menu-open');
        };
    });
}

/* ==========================================================
   2. GESTÃO DE DADOS (JSON)
========================================================== */
async function fetchConteudo(subpasta) {
    // 1. Definições de Cache
    const cacheKey = `church_cache_${subpasta.replace('/', '_')}`;
    const expiraEm = 10 * 60 * 1000; // 10 minutos
    const cacheSalvo = localStorage.getItem(cacheKey);

    // 2. Tenta carregar do Cache primeiro (Velocidade Instantânea)
    if (cacheSalvo) {
        const { timestamp, data } = JSON.parse(cacheSalvo);
        if (Date.now() - timestamp < expiraEm) {
            console.log(`⚡ Cache: ${subpasta} carregado instantaneamente.`);
            return data;
        }
    }

    // 3. Busca o arquivo consolidado (Apenas 1 requisição ao servidor)
    // Transforma 'publicacoes/devocionais' em 'devocionais_all'
    const nomeBase = subpasta.includes('/') ? subpasta.split('/').pop() : subpasta;
    const urlConsolidada = `${CONFIG.basePath}/${nomeBase}_all.json`;

    try {
        console.log(`🌐 Servidor: Buscando arquivo único ${urlConsolidada}...`);
        const res = await fetch(urlConsolidada);
        
        if (!res.ok) throw new Error("Arquivo consolidado não encontrado. Rode o script Python!");
        
        const dataFinal = await res.json();

        // 4. Salva o resultado no Cache para a próxima vez
        localStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            data: dataFinal
        }));

        return dataFinal;
    } catch (e) { 
        console.error(`❌ Erro crítico em ${subpasta}:`, e);
        return []; 
    }
}

async function carregarEventos() {
    const eventos = await fetchConteudo('eventos');
    const agora = new Date();
    const ordenador = (a, b) => (a.is_special !== b.is_special ? (a.is_special ? -1 : 1) : new Date(a.date) - new Date(b.date));

    const proximos = eventos.filter(e => new Date(e.date) >= agora).sort(ordenador);
    const passados = eventos.filter(e => new Date(e.date) < agora).sort((a, b) => new Date(b.date) - new Date(a.date));

    renderizarCards(proximos, 'lista-proximos');
    renderizarCards(passados, 'lista-passados', true);
}

function renderizarCards(lista, containerId, isPast = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (lista.length === 0) { container.innerHTML = "<p>Nenhum registro encontrado.</p>"; return; }

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
   3. FEED DE PUBLICAÇÕES (COM FILTROS)
========================================================== */
async function carregarFeed() {
    const folders = ['devocionais', 'estudos'];
    const promessas = folders.map(f => fetchConteudo(`publicacoes/${f}`));
    const resultados = await Promise.all(promessas);

    // Cache para filtros rápidos sem novo fetch
    cacheConteudo = resultados.flat().sort((a, b) => new Date(b.date) - new Date(a.date));

    renderizarFeed(cacheConteudo);
    initFiltrosPublicacoes();
}

function renderizarFeed(lista) {
    const container = document.getElementById('lista-publicacoes');
    if (!container) return;

    if (lista.length === 0) {
        container.innerHTML = "<p>Nenhuma mensagem encontrada.</p>";
        return;
    }

    container.innerHTML = lista.map(p => `
        <div class="card-evento">
            <div class="card-info">
                <span class="badge">${p.tipo?.toUpperCase() || 'MENSAGEM'}</span>
                <h3>${p.title}</h3>
                <p class="data">${new Date(p.date).toLocaleDateString('pt-BR')}</p>
                <p class="descricao">${p.body.substring(0, 150)}...</p>
                <button class="btn-hero" style="margin-top:20px; font-size:0.7rem; padding:10px 20px;" onclick="abrirLeitura('${p.title}')">Ler Mensagem</button>
            </div>
        </div>
    `).join('');
}

function initFiltrosPublicacoes() {
    const botoes = document.querySelectorAll('.btn-filtro');
    botoes.forEach(btn => {
        btn.onclick = () => {
            botoes.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tipo = btn.getAttribute('data-tipo');
            const filtrados = tipo === 'todos' ? cacheConteudo : cacheConteudo.filter(p => p.tipo === tipo);
            renderizarFeed(filtrados);
        };
    });
}

function abrirLeitura(titulo) {
    const pub = cacheConteudo.find(p => p.title === titulo);
    const modal = document.getElementById('modalLeitura');
    const display = document.getElementById('conteudo-completo-leitura');
    const htmlBody = typeof marked !== 'undefined' ? marked.parse(pub.body) : pub.body;

    display.innerHTML = `
        <div class="controles-audio">
            <button onclick="iniciarLeitura()" id="btnOuvir" class="btn-audio">🔊 Ouvir</button>
            <button onclick="pararLeitura()" id="btnParar" class="btn-audio hidden">⏹️ Parar</button>
        </div>
        <small class="badge" style="display:inline-block; margin-bottom:10px;">${pub.tipo?.toUpperCase()}</small>
        <h1 style="font-family: 'Playfair Display', serif; margin-bottom: 10px;">${pub.title}</h1>
        <p><strong>Por: ${pub.autor}</strong></p>
        <hr style="margin:20px 0;"><div class="texto-completo">${htmlBody}</div>
    `;
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
}

/* ==========================================================
   4. UTILITÁRIOS & HOME
========================================================== */
function fecharLeitura() { pararLeitura(); document.getElementById('modalLeitura').style.display = "none"; document.body.style.overflow = "auto"; }

async function carregarDestaquesHome() {
    const eventos = await fetchConteudo('eventos');
    const agora = new Date();
    const proximos = eventos.filter(e => new Date(e.date) >= agora).sort((a, b) => (a.is_special ? -1 : 1));
    const cp = document.getElementById('evento-principal');
    if (!cp || proximos.length === 0) return;

    // Dentro de carregarDestaquesHome()
    const p = proximos[0];
    cp.innerHTML = `
        <img src="${p.image}" alt="${p.title}" style="width:100%; height:100%; object-fit:cover; opacity:0.85;">
        <div class="info-overlay">
            <span class="badge-flutuante">DESTAQUE</span>
            <h3 class="titulo-flutuante">${p.title}</h3>
            
            <div class="hero-buttons">
                <a href="eventos.html" class="btn-saiba-mais">SAIBA MAIS</a>
                <button class="btn-share-whatsapp" onclick="compartilharWhatsapp('${p.title}', '${new Date(p.date).toLocaleDateString('pt-BR')}')">
                    <i class="fa-brands fa-whatsapp"></i>
                </button>
            </div>
        </div>
    `;
    const cs = document.getElementById('eventos-secundarios');
    if (cs) cs.innerHTML = s.map(ev => `<div class="card-secundario"><img src="${ev.image}"><div class="info-pequena"><h4>${ev.title}</h4><p>${new Date(ev.date).toLocaleDateString('pt-BR')}</p><a href="eventos.html">SAIBA MAIS →</a></div></div>`).join('');
}

// ... manter funções auxiliares (copiarPix, formatarMoeda, compartilharWhatsapp) ...

function copiarPix(id) { navigator.clipboard.writeText(document.getElementById(id).innerText).then(() => alert("Chave Pix copiada!")); }
function formatarMoeda(i) { let v = i.value.replace(/\D/g, ''); v = (v / 100).toFixed(2).replace(".", ",").replace(/(\d)(\d{3})(\d{3}),/g, "$1.$2.$3,").replace(/(\d)(\d{3}),/g, "$1.$2,"); i.value = v; }

function trocarUnidade(unidade) {
    const c = { pr: { b: 'btn-pr', ct: 'conteudo-pr', h: ['btn-sc', 'conteudo-sc'] }, sc: { b: 'btn-sc', ct: 'conteudo-sc', h: ['btn-pr', 'conteudo-pr'] } }[unidade];
    document.getElementById(c.b)?.classList.add('active');
    document.getElementById(c.ct)?.classList.remove('hidden');
    c.h.forEach(id => { document.getElementById(id)?.classList.remove('active'); if (id.startsWith('conteudo')) document.getElementById(id)?.classList.add('hidden'); });
}

function mostrarOpcao(tipo) {
    const user = netlifyIdentity.currentUser();
    const btnDizimo = document.querySelector('button[onclick="mostrarOpcao(\'dizimo\')"]');
    const btnOferta = document.querySelector('button[onclick="mostrarOpcao(\'oferta\')"]');
    const boxDizimo = document.getElementById('box-dizimo');
    const boxOferta = document.getElementById('box-oferta');

    if (tipo === 'dizimo') {
        if (!user) {
            alert("Para registrar dízimos e acompanhar seu histórico, por favor, faça login.");
            netlifyIdentity.open(); // Abre o widget de login
            return;
        }
        boxDizimo.classList.remove('hidden');
        boxOferta.classList.add('hidden');
        btnDizimo.classList.add('active');
        btnOferta.classList.remove('active');
    } else {
        boxDizimo.classList.add('hidden');
        boxOferta.classList.remove('hidden');
        btnOferta.classList.add('active');
        btnDizimo.classList.remove('active');
    }
}

function initFormOracao() {
    const ck = document.getElementById('anonimo'), ct = document.getElementById('identificacao-container');
    if (!ck || !ct) return;
    ck.onchange = () => { ct.style.display = ck.checked ? 'none' : 'block'; ct.querySelectorAll('input').forEach(i => i.required = !ck.checked); };
}

function compartilharWhatsapp(t, d) { window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Paz! Veja este evento na Famílias Church:\n📌 *${t}*\n📅 ${d}\nConfira: ${window.location.origin}/eventos.html`)}`, '_blank'); }

// Função placeholder para Admin
function initAdminObreiros() { console.log("Admin pronto"); }

/* ==========================================================
   LÓGICA DE MINISTÉRIOS (TABS)
========================================================== */
function initTabsMinisterios() {
    const container = document.getElementById('ministerios-tabs');
    if (!container) return;

    const botoes = container.querySelectorAll('.tab-btn');
    const displayImg = document.querySelector('.tab-img-box img');
    const displayTitulo = document.querySelector('.tab-text-box h3');
    const displayTexto = document.querySelector('.tab-text-box p');

    const dados = {
        "LOUVOR": { img: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=800", txt: "Levando a igreja à adoração profunda através da música." },
        "FAMÍLIAS": { img: "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=800", txt: "Edificando lares sobre a rocha que é a Palavra de Deus." },
        "DÉBORAS": { img: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800", txt: "Mães de joelhos, filhos de pé. Intercessão contínua." },
        "JOVENS": { img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800", txt: "Uma geração apaixonada por Jesus e pelo Seu Reino." },
        "TEENS": { img: "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?q=80&w=800", txt: "Adolescentes crescendo em sabedoria e graça." },
        "KIDS": { img: "https://images.unsplash.com/photo-1484981138541-3d074aa97716?q=80&w=800", txt: "Plantando a semente da vida no coração dos pequenos." },
        "TEATRO": { img: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=800", txt: "Expressando o Evangelho através da arte dramática." },
        "DANÇA": { img: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=800", txt: "Adoração em movimento e gratidão ao Criador." }
    };

    botoes.forEach(btn => {
        btn.onclick = () => {
            const chave = btn.innerText.trim().toUpperCase();
            if (dados[chave]) {
                botoes.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Transição visual
                document.querySelector('.tab-content-display').style.opacity = 0;
                setTimeout(() => {
                    displayImg.src = dados[chave].img;
                    displayTitulo.innerText = chave;
                    displayTexto.innerText = dados[chave].txt;
                    document.querySelector('.tab-content-display').style.opacity = 1;
                }, 200);
            }
        };
    });
}


// Abre/Fecha o menu
function toggleMenu() {
    const card = document.getElementById('profileCard');
    card.classList.toggle('active');
}

// Atualiza as informações do usuário logado
// 1. Função Matemática para calcular a idade
function calcularIdade(dataNascimento) {
    if (!dataNascimento) return "--";
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }
    return idade;
}

// 2. Função Principal de Sincronização
function atualizarDadosUsuario(user) {
    if (!user) return;

    const meta = user.user_metadata;
    const idadeCalculada = calcularIdade(meta.nascimento);

    // Elementos do Menu Flutuante (Header)
    const elementos = {
        nome: document.getElementById('userName'),
        email: document.getElementById('userEmail'),
        cargo: document.getElementById('userRole'),
        idade: document.getElementById('userAge'),
        avatarPequeno: document.getElementById('userAvatarSmall'),
        avatarGrande: document.getElementById('userAvatarLarge')
    };

    // Preenchimento Automático do Menu
    if (elementos.nome) elementos.nome.innerText = `Olá, ${meta.full_name || 'Membro'}!`;
    if (elementos.email) elementos.email.innerText = user.email;
    if (elementos.cargo) elementos.cargo.innerText = meta.cargo || "Membro";
    if (elementos.idade) elementos.idade.innerText = idadeCalculada;
    if (elementos.avatarPequeno && meta.avatar_url) elementos.avatarPequeno.src = meta.avatar_url;
    if (elementos.avatarGrande && meta.avatar_url) elementos.avatarGrande.src = meta.avatar_url;
    if (meta.avatar_url) {    
        document.getElementById('avatarImg').src = meta.avatar_url;
        document.getElementById('userAvatarSmall').src = meta.avatar_url;
    } else {
    // Se não tiver nada, ele mantém a imagem padrão que você colocou no HTML
    document.getElementById('avatarImg').src = "https://via.placeholder.com/120";
    }       
    // Sincronização com a Página de Perfil (perfil.html)
    const perfilNome = document.getElementById('nomeUsuario');
    const perfilCargo = document.getElementById('cargoUsuario');
    const perfilAvatar = document.getElementById('avatarImg');

    if (perfilNome) perfilNome.innerText = meta.full_name || "Membro da Família";
    if (perfilCargo) perfilCargo.innerText = meta.cargo || "Membro";
    if (perfilAvatar && meta.avatar_url) perfilAvatar.src = meta.avatar_url;
}


// 3. Netlify Identity
netlifyIdentity.on('init', user => atualizarDadosUsuario(user));
netlifyIdentity.on('login', user => {
    atualizarDadosUsuario(user);
    netlifyIdentity.close();
});

// Dentro da sua função atualizarInterfaceUsuario(user):
const meta = user.user_metadata;
const elementoIdade = document.getElementById('userAge'); //

if (elementoIdade) {
    elementoIdade.innerText = calcularIdade(meta.nascimento);
}
// Função para atualizar a interface com os dados do usuário
function atualizarInterfaceUsuario(user) {
    if (user) {
        const meta = user.user_metadata;
        const cargo = meta.cargo ? meta.cargo.toLowerCase() : "membro";
        const containerAcoes = document.getElementById('admin-actions-container');

        // 1. Preenche os dados básicos
        document.getElementById('userName').innerText = `Olá, ${meta.full_name || 'Membro'}!`;
        document.getElementById('userRole').innerText = meta.cargo || "Membro";
        if (meta.avatar_url) document.getElementById('userAvatarSmall').src = meta.avatar_url;

        // 2. Limpa o container antes de adicionar novos botões
        containerAcoes.innerHTML = '';

        // 3. Regra de Acesso para Pastor e Apóstolo (Acesso Total)
        if (cargo === "pastor" || cargo === "apóstolo" || cargo === "apostolo") {
            containerAcoes.innerHTML = `
                <button class="action-btn" onclick="window.location.href='publicar.html'" style="background-color: #2c3e50; margin-bottom: 5px;">
                    📢 Painel de Publicação
                </button>
            `;
        }
        // 4. Regra de Acesso para Mídia (Apenas Eventos)
        else if (cargo === "mídia" || cargo === "midia") {
            containerAcoes.innerHTML = `
                <button class="action-btn" onclick="window.location.href='publicar.html?tab=eventos'" style="background-color: #e67e22; margin-bottom: 5px;">
                    📅 Publicar Eventos
                </button>
            `;
        }
    }
}

// Escutadores do Netlify Identity
netlifyIdentity.on('init', user => atualizarInterfaceUsuario(user));
netlifyIdentity.on('login', user => {
    atualizarInterfaceUsuario(user);
    netlifyIdentity.close(); // Fecha a janelinha de login após logar
});
netlifyIdentity.on('logout', () => window.location.href = 'index.html');
// Listener do Netlify Identity
if (window.netlifyIdentity) {
    window.netlifyIdentity.on("init", user => updateUserInfo(user));
    window.netlifyIdentity.on("login", user => {
        updateUserInfo(user);
        toggleMenu(); // Fecha o widget de login e abre o perfil se quiser
    });
    window.netlifyIdentity.on("logout", () => location.reload());
}
document.getElementById('formOracaoPerfil').onsubmit = async function (e) {
    e.preventDefault();
    const user = netlifyIdentity.currentUser();
    const status = document.getElementById('statusOracao');
    const texto = document.getElementById('textoOracao').value;

    if (!user) {
        alert("Precisas de estar logado!");
        return;
    }

    status.innerText = "⏳ A enviar ao altar...";

    const payload = {
        texto: texto,
        data: new Date().toISOString(),
        nome: user.user_metadata.full_name
    };

    try {
        const res = await fetch('/.netlify/functions/enviar_oracao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payload, userEmail: user.email })
        });

        if (res.ok) {
            status.innerHTML = "<span style='color: green'>✅ Oração enviada!</span>";
            document.getElementById('formOracaoPerfil').reset();
            // poderias chamar uma função para atualizar a lista abaixo
        } else {
            throw new Error("Erro ao enviar");
        }
    } catch (err) {
        status.innerHTML = "<span style='color: red'>❌ Tenta novamente mais tarde.</span>";
    }
};

async function carregarEstatisticasFinanceiras() {
    const user = netlifyIdentity.currentUser();
    if (!user) return;

    // Verificação de Role para o Financeiro
    // No Netlify: Identity -> Metadata -> {"roles": ["financeiro"]}
    const roles = user.app_metadata?.roles || [];
    if (roles.includes("financeiro")) {
        document.getElementById('adminFinanceiro').classList.remove('hidden');
    }

    try {
        const res = await fetch(`/.netlify/functions/buscar_contribuicoes?userEmail=${user.email}`);
        const contribuicoes = await res.json();

        const agora = new Date();
        const mesAtual = agora.getMonth();
        const anoAtual = agora.getFullYear();

        let somaMes = 0;
        let somaAno = 0;

        contribuicoes.forEach(c => {
            const dataContr = new Date(c.data);
            const valor = parseFloat(c.valor.replace(',', '.'));

            if (dataContr.getFullYear() === anoAtual) {
                somaAno += valor;
                if (dataContr.getMonth() === mesAtual) {
                    somaMes += valor;
                }
            }
        });

        document.getElementById('totalMensal').innerText = `R$ ${somaMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        document.getElementById('totalAnual').innerText = `R$ ${somaAno.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    } catch (err) {
        console.error("Erro ao calcular finanças:", err);
    }
}

document.getElementById('formDizimoReal').onsubmit = async function (e) {
    e.preventDefault();
    const user = netlifyIdentity.currentUser();
    const btn = e.target.querySelector('button');

    if (!user) return alert("Login necessário");

    btn.innerText = "⏳ A registar...";
    btn.disabled = true;

    const payload = {
        nome: e.target.nome.value,
        data: e.target.data.value,
        valor: e.target.valor.value,
        tipo: "Dízimo",
        status: "Pendente" // O financeiro mudará para "Confirmado" no painel
    };

    try {
        const res = await fetch('/.netlify/functions/registrar_contribuicao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payload, userEmail: user.email })
        });

        if (res.ok) {
            alert("Dízimo enviado com sucesso! Poderá acompanhar o status no seu perfil.");
            window.location.href = "perfil.html";
        }
    } catch (err) {
        alert("Erro ao processar. Tente novamente.");
        btn.innerText = "Enviar Comprovante";
        btn.disabled = false;
    }
};

async function checarNotificacoes() {
    const user = netlifyIdentity.currentUser();
    if (!user) return;

    const countLabel = document.getElementById('noti-count');
    const listContainer = document.getElementById('noti-list');

    try {
        // Buscamos o histórico (usando a função que já criamos antes)
        const resOracoes = await fetch(`/.netlify/functions/buscar_historico?userEmail=${user.email}`);
        const resContri = await fetch(`/.netlify/functions/buscar_contribuicoes?userEmail=${user.email}`);

        const oracoes = await resOracoes.json();
        const contribuicoes = await resContri.json();

        const novidades = [
            ...oracoes.filter(o => o.status === "Lida"),
            ...contribuicoes.filter(c => c.status === "Confirmado")
        ];

        if (novidades.length > 0) {
            countLabel.innerText = novidades.length;
            countLabel.classList.remove('hidden');

            listContainer.innerHTML = novidades.map(n => `
                <div class="noti-item">
                    <i class="fa-solid ${n.texto ? 'fa-hands-praying' : 'fa-circle-check'}"></i>
                    <div>
                        <strong>${n.texto ? 'Oração Lida!' : 'Dízimo Confirmado!'}</strong>
                        <p>${n.texto || 'Seu dízimo de R$ ' + n.valor + ' foi validado.'}</p>
                    </div>
                </div>
            `).join('');
        }
    } catch (err) { console.error("Erro nas notificações", err); }
}

function toggleNotifications() {
    document.getElementById('noti-dropdown').classList.toggle('hidden');
    // Ao abrir, poderíamos marcar como "vistas" chamando outra função Netlify
}

// Inicia a checagem ao carregar
netlifyIdentity.on("login", () => setInterval(checarNotificacoes, 60000)); // Checa a cada 1 minuto

async function carregarMuralTestemunhos() {
    const container = document.getElementById('mural-testemunhos');
    if (!container) return;

    try {
        const res = await fetch('/.netlify/functions/listar_testemunhos');
        const lista = await res.json();

        // Engenharia: Ordena do mais recente para o mais antigo e pega os 10 primeiros
        const dezMaisRecentes = lista
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        container.innerHTML = dezMaisRecentes.map(t => `
            <div class="card-testemunho">
                <div class="aspas-icon">“</div>
                <p class="texto-testemunho">${t.texto}</p>
                <div class="autor-testemunho">
                    <strong>— ${t.autor}</strong>
                </div>
            </div>
        `).join('');

        // Caso não haja testemunhos aprovados ainda
        if (dezMaisRecentes.length === 0) {
            container.innerHTML = "<p class='aviso-vazio'>Em breve, novas vitórias compartilhadas!</p>";
        }

    } catch (err) {
        console.error("Erro ao carregar testemunhos:", err);
        container.innerHTML = "<p>Em breve, novas vitórias compartilhadas!</p>";
    }
}

// Variáveis globais para o controle do editor
let cropper;
const modal = document.getElementById('modalCrop');
const imageToCrop = document.getElementById('imageToCrop');
const fotoInput = document.getElementById('fotoInput');

// 1. Detecta a escolha da foto e abre o Modal de Recorte
fotoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            imageToCrop.src = event.target.result;
            modal.style.display = 'flex'; // Exibe o modal de ajuste
            
            // Inicia o Cropper.js com proporção 1:1 (quadrado)
            if (cropper) cropper.destroy();
            cropper = new Cropper(imageToCrop, {
                aspectRatio: 1,
                viewMode: 1,
                guides: false
            });
        };
        reader.readAsDataURL(file);
    }
});

// 2. Lógica de Upload (Integrada com sua Chave API: aa5bd2aacedeb43b6521a4f45d71b442)
document.getElementById('btnSalvarCrop').addEventListener('click', () => {
    const canvas = cropper.getCroppedCanvas({ width: 400, height: 400 });
    const status = document.getElementById('statusUpload');
    const user = netlifyIdentity.currentUser();

    if (!user) return;
    
    fecharModal();
    status.innerText = "⏳ Enviando foto...";

    // Converte o recorte em um arquivo (Blob) para o envio
    canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append('image', blob);

        try {
            // Upload para o ImgBB utilizando sua chave autorizada
            const res = await fetch('https://api.imgbb.com/1/upload?key=aa5bd2aacedeb43b6521a4f45d71b442', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                const novaUrlFoto = data.data.url;

                // 3. Atualiza os metadados no Netlify Identity do usuário
                user.update({ data: { avatar_url: novaUrlFoto } }).then((updatedUser) => {
                    // Atualiza todas as fotos na interface instantaneamente
                    if(document.getElementById('avatarImg')) document.getElementById('avatarImg').src = novaUrlFoto;
                    if(document.getElementById('userAvatarSmall')) document.getElementById('userAvatarSmall').src = novaUrlFoto;
                    if(document.getElementById('userAvatarLarge')) document.getElementById('userAvatarLarge').src = novaUrlFoto;
                    
                    status.innerText = "✅ Foto atualizada com sucesso!";
                });
            }
        } catch (err) {
            status.innerText = "❌ Erro ao subir foto.";
            console.error(err);
        }
    }, 'image/jpeg');
});

function fecharModal() { modal.style.display = 'none'; }