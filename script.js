/* ==========================================================
    1. CONFIGURAÇÕES E INICIALIZAÇÃO
========================================================== */
const prefixo = window.location.pathname.includes('/admin/') ? '../' : './';
const CONFIG = {
    basePath: `${prefixo}content`,
    repo: "FamiliasChurch/FamiliasChurch",
    avatarFallback: "https://www.w3schools.com/howto/img_avatar.png"
};

// Funções de inicialização obrigatórias (Evita o erro de 'not defined')
function initMenuMobile() {
    console.log("Menu mobile inicializado");
}

let cacheConteudo = [];
let cropper;

document.addEventListener('DOMContentLoaded', () => {
    carregarComponentes();
    initMenuMobile();

    // Inicialização do Netlify Identity
    if (window.netlifyIdentity) {
        netlifyIdentity.init({ API_URL: 'https://familiaschurch.netlify.app/.netlify/identity' });

        netlifyIdentity.on("init", user => { if (user) atualizarInterfaceUsuario(user); });

        netlifyIdentity.on("login", user => {
            const meta = user.user_metadata;
            atualizarInterfaceUsuario(user);
            netlifyIdentity.close();

            // Lógica de Redirecionamento e Savepoint
            if (!meta.nascimento || !meta.whatsapp) {
                window.location.href = prefixo + 'completar-perfil.html';
            } else {
                const cargo = (meta.cargo || "").toLowerCase();
                const roles = user.app_metadata?.roles || [];
                if (["financeiro", "apóstolo", "apostolo"].includes(cargo) || roles.includes("mod")) {
                    window.location.href = prefixo + 'admin/index.html';
                } else {
                    window.location.href = prefixo + 'perfil.html';
                }
            }
        });

        netlifyIdentity.on("logout", () => {
            localStorage.clear();
            window.location.href = prefixo + 'index.html';
        });
    }

    // Rotas de Inicialização baseadas em IDs presentes na página
    const rotas = {
        'lista-proximos': typeof carregarEventos === 'function' ? carregarEventos : null,
        'evento-principal': typeof carregarDestaquesHome === 'function' ? carregarDestaquesHome : null,
        'mural-testemunhos': carregarMuralTestemunhos,
        'lista-publicacoes': typeof carregarFeed === 'function' ? carregarFeed : null,
        'ministerios-tabs': typeof initTabsMinisterios === 'function' ? initTabsMinisterios : null,
        'formCompletarPerfil': initCompletarPerfil,
        'fotoInput': initUploadAvatar
    };

    Object.keys(rotas).forEach(id => {
        if (document.getElementById(id) && rotas[id]) setTimeout(rotas[id], 0);
    });
});

/* ==========================================================
    2. INTERFACE E PERMISSÕES
========================================================== */
function atualizarInterfaceUsuario(user) {
    if (!user) return;
    const meta = user.user_metadata;
    const roles = user.app_metadata?.roles || [];
    const fotoFinal = meta.avatar_url || CONFIG.avatarFallback;

    // Sincroniza Avatares
    ['userAvatarSmall', 'userAvatarLarge', 'avatarImg'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.src = fotoFinal; el.classList.remove('skeleton'); }
    });

    // Sincroniza Textos do Perfil
    const campos = {
        'userName': `Olá, ${meta.full_name || 'Membro'}!`,
        'userRole': meta.cargo || "Membro",
        'userEmail': user.email,
        'nomeUsuario': meta.full_name || "Membro da Família",
        'cargoUsuario': meta.cargo || "Membro",
        'userAge': meta.nascimento ? calcularIdade(meta.nascimento) : "--"
    };

    Object.keys(campos).forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.innerText = campos[id]; el.classList.remove('skeleton'); }
    });

    // Botões de Administração dinâmicos
    const containerAcoes = document.getElementById('admin-actions-container');
    if (containerAcoes) {
        containerAcoes.innerHTML = '';
        if (roles.includes("mod") || ["apóstolo", "apostolo", "financeiro"].includes(meta.cargo?.toLowerCase())) {
            containerAcoes.innerHTML += `<button class="action-btn-secondary" onclick="window.location.href='${prefixo}admin/index.html'">🛡️ Dashboard Admin</button>`;
        }
    }
}

function initCompletarPerfil() {
    const form = document.getElementById('formCompletarPerfil');
    if (!form) return;
    form.onsubmit = async (e) => {
        e.preventDefault();
        const user = netlifyIdentity.currentUser();
        const btn = form.querySelector('button');
        btn.innerText = "Salvando...";

        const novosDados = {
            full_name: document.getElementById('regNome').value,
            nascimento: document.getElementById('regNascimento').value,
            whatsapp: document.getElementById('regWhatsapp').value,
            cargo: "Membro"
        };

        try {
            await user.update({ data: novosDados });
            alert("Perfil atualizado com sucesso!");
            window.location.href = "perfil.html";
        } catch (err) {
            alert("Erro ao salvar dados.");
            btn.innerText = "Tentar novamente";
        }
    };
}

/* ==========================================================
    3. INTERFACE E UX (MENUS E DROPDOWNS)
========================================================== */
function toggleMenu() {
    const card = document.getElementById('profileCard');
    const noti = document.getElementById('noti-dropdown');
    if (noti) noti.classList.remove('active');
    card?.classList.toggle('active');
}

function toggleNotifications() {
    const noti = document.getElementById('noti-dropdown');
    const card = document.getElementById('profileCard');
    if (card) card.classList.remove('active');
    noti?.classList.toggle('active');
}

window.onclick = (e) => {
    if (!e.target.closest('.user-menu-container') && !e.target.closest('.notification-wrapper')) {
        document.getElementById('profileCard')?.classList.remove('active');
        document.getElementById('noti-dropdown')?.classList.remove('active');
    }
};

/* ==========================================================
    4. GESTÃO DE DADOS (API & CACHE)
========================================================== */
async function fetchConteudo(subpasta) {
    const cacheKey = `church_cache_${subpasta.replace('/', '_')}`;
    const expiraEm = 10 * 60 * 1000; // 10 minutos
    const cacheSalvo = localStorage.getItem(cacheKey);

    if (cacheSalvo) {
        const { timestamp, data } = JSON.parse(cacheSalvo);
        if (Date.now() - timestamp < expiraEm) return data;
    }

    const url = `${CONFIG.basePath}/${subpasta.includes('/') ? subpasta.split('/').pop() : subpasta}_all.json`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Arquivo não encontrado");
        const dataFinal = await res.json();
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: dataFinal }));
        return dataFinal;
    } catch (e) {
        console.error(`Erro ao carregar ${subpasta}:`, e);
        return [];
    }
}

/* ==========================================================
    5. COMPONENTES E UTILITÁRIOS
========================================================== */
async function carregarComponentes() {
    const itens = [{ id: 'header', file: 'header' }, { id: 'footer', file: 'footer' }];
    await Promise.all(itens.map(async item => {
        const el = document.getElementById(item.id);
        if (el) {
            try {
                const res = await fetch(`${prefixo}components/${item.file}.html`);
                el.innerHTML = await res.text();
            } catch (e) { console.error(`Erro: ${item.file}`); }
        }
    }));
}

function calcularIdade(dataNascimento) {
    if (!dataNascimento) return "--";
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
    return idade;
}

/* ==========================================================
    6. FIREBASE (TESTEMUNHOS, DÍZIMOS E ORAÇÕES)
========================================================== */

const firebaseConfig = {
    apiKey: "AIzaSyBvFM13K0XadCnAHdHE0C5GtA2TH5DaqLg",
    authDomain: "familias-church.firebaseapp.com",
    projectId: "familias-church",
    storageBucket: "familias-church.firebasestorage.app",
    messagingSenderId: "764183777206",
    appId: "1:764183777206:web:758e4f04ee24b86229bb17",
    measurementId: "G-VHWLCPM3FR"
};

// Inicialização compatível com a arquitetura híbrida
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// MURAL DE TESTEMUNHOS (Firestore Real-time)
async function carregarMuralTestemunhos() {
    const container = document.getElementById('mural-testemunhos');
    if (!container) return;

    try {
        const snapshot = await db.collection("testemunhos")
            .where("status", "==", "Aprovado")
            .orderBy("data", "desc")
            .limit(6)
            .get();

        container.innerHTML = snapshot.docs.map(doc => {
            const t = doc.data();
            return `
                <div class="card-testemunho">
                    <p class="texto-testemunho">${t.texto}</p>
                    <div class="autor-testemunho"><strong>— ${t.autor}</strong></div>
                </div>`;
        }).join('');
    } catch (err) {
        console.error("Erro ao carregar mural:", err);
    }
}

// TROCA DE OFERTA/DÍZIMO (Interface Doações)
function mostrarOpcao(tipo) {
    const boxOferta = document.getElementById('box-oferta');
    const boxDizimo = document.getElementById('box-dizimo');
    const btns = document.querySelectorAll('.btn-toggle');

    btns.forEach(btn => btn.classList.remove('active'));

    if (tipo === 'oferta') {
        boxOferta.classList.remove('hidden');
        boxDizimo.classList.add('hidden');
        document.querySelector('button[onclick*="oferta"]').classList.add('active');
    } else {
        boxOferta.classList.add('hidden');
        boxDizimo.classList.remove('hidden');
        document.querySelector('button[onclick*="dizimo"]').classList.add('active');
    }
}

// REGISTRO DE DÍZIMOS (Firestore + ImgBB)
async function registrarDizimo(e) {
    e.preventDefault();
    const status = document.getElementById('statusDizimo');
    const file = document.getElementById('comprovanteFile').files[0];
    const valor = document.getElementById('valorDizimo').value;
    const user = netlifyIdentity.currentUser();

    if (!user) { alert("Faça login para registrar."); return; }

    status.innerText = "⏳ Enviando comprovante...";

    try {
        const formData = new FormData();
        formData.append('image', file);
        const resImg = await fetch('https://api.imgbb.com/1/upload?key=aa5bd2aacedeb43b6521a4f45d71b442', {
            method: 'POST', body: formData
        });
        const dataImg = await resImg.json();

        await db.collection("contribuicoes").add({
            email: user.email,
            nome: user.user_metadata.full_name || "Membro",
            valor: parseFloat(valor),
            comprovante: dataImg.data.url,
            data: firebase.firestore.FieldValue.serverTimestamp(),
            status: "Pendente"
        });

        alert("✅ Dízimo registrado com sucesso!");
        location.reload();
    } catch (err) { status.innerText = "❌ Erro no registro."; }
    const telFinanceiro = "55419XXXXXXXX"; // Coloque o número real aqui
    const msg = `Olá! Acabei de enviar o dízimo no valor de R$ ${valor}. O comprovante já está no sistema para aprovação.`;
    const urlWa = `https://wa.me/${telFinanceiro}?text=${encodeURIComponent(msg)}`;

    alert("✅ Dízimo registrado! Clique em OK para enviar o aviso no WhatsApp do Financeiro.");
    window.open(urlWa, '_blank');
    location.reload();
}

document.getElementById('formDizimoReal')?.addEventListener('submit', registrarDizimo);

// ENVIAR ORAÇÃO E LOGS
async function enviarOracao(e) {
    e.preventDefault();
    const user = netlifyIdentity.currentUser();
    const texto = document.getElementById('textoOracao').value;

    await db.collection("oracoes").add({
        email: user.email,
        texto: texto,
        data: firebase.firestore.FieldValue.serverTimestamp(),
        status: "Pendente"
    });
    alert("Pedido de oração enviado!");
}

async function registrarAcessoFirebase(user) {
    if (sessionStorage.getItem('acesso_firebase_ok')) return;
    try {
        await db.collection("logs").add({
            nome: user.user_metadata.full_name || "Admin",
            email: user.email,
            cargo: user.user_metadata.cargo || "Moderador",
            data: firebase.firestore.FieldValue.serverTimestamp(),
            ip: "Acesso Web"
        });
        sessionStorage.setItem('acesso_firebase_ok', 'true');
    } catch (err) { console.error("Erro log:", err); }
}

/* ==========================================================
    7. FUNCIONALIDADES DE PERFIL (UPLOAD)
========================================================== */
function initUploadAvatar() {
    const input = document.getElementById('fotoInput');
    if (!input) return;

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = document.getElementById('imageToCrop');
            if (img) {
                img.src = event.target.result;
                document.getElementById('modalCrop').style.display = 'flex';
                if (cropper) cropper.destroy();
                cropper = new Cropper(img, { aspectRatio: 1, viewMode: 1 });
            }
        };
        reader.readAsDataURL(file);
    });

    const btnSalvar = document.getElementById('btnSalvarCrop');
    if (btnSalvar) {
        btnSalvar.onclick = () => {
            const canvas = cropper.getCroppedCanvas({ width: 400, height: 400 });
            const user = netlifyIdentity.currentUser();
            const status = document.getElementById('statusUpload');

            document.getElementById('modalCrop').style.display = 'none';
            if (status) status.innerText = "⏳ Enviando...";

            canvas.toBlob(async (blob) => {
                const formData = new FormData();
                formData.append('image', blob);
                try {
                    const res = await fetch('https://api.imgbb.com/1/upload?key=aa5bd2aacedeb43b6521a4f45d71b442', {
                        method: 'POST', body: formData
                    });
                    const data = await res.json();
                    if (data.success) {
                        await user.update({ data: { avatar_url: data.data.url } });
                        if (status) status.innerText = "✅ Atualizado!";
                        location.reload();
                    }
                } catch (err) { if (status) status.innerText = "❌ Erro"; }
            }, 'image/jpeg');
        };
    }
}