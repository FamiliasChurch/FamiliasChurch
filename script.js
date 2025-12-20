/* ==========================================================
   1. CONFIGURAÇÕES E ESTADO GLOBAL
========================================================== */
const prefixo = window.location.pathname.includes('/admin/') ? '../' : './';
const CONFIG = {
    basePath: `${prefixo}content`,
    repo: "FamiliasChurch/FamiliasChurch",
    avatarFallback: "https://www.w3schools.com/howto/img_avatar.png"
};

let cacheConteudo = [];
let cropper; // Para edição de imagem

/* ==========================================================
   2. ORQUESTRADOR DE INICIALIZAÇÃO (O CÉREBRO)
========================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // A. Carregamento Estrutural (Sem travar a UI)
    carregarComponentes(); 
    initMenuMobile();

    // B. Inicialização do Netlify Identity
    if (window.netlifyIdentity) {
        netlifyIdentity.init({
            API_URL: 'https://familiaschurch.netlify.app/.netlify/identity'
        });

        // Eventos do Identity centralizados
        netlifyIdentity.on("init", user => { if (user) atualizarInterfaceUsuario(user); });
        netlifyIdentity.on("login", user => {
            atualizarInterfaceUsuario(user);
            netlifyIdentity.close();
            // Pequeno delay para garantir persistência antes de ações automáticas
            setTimeout(() => { 
                if (window.location.pathname.includes('perfil')) carregarHistoricoReal(user.email);
            }, 500);
        });
        netlifyIdentity.on("logout", () => {
            localStorage.clear();
            window.location.href = prefixo + 'index.html';
        });
    }

    // C. Roteamento de Funções por Elemento Presente na Página
    const rotas = {
        'lista-proximos': carregarEventos,
        'evento-principal': carregarDestaquesHome,
        'mural-testemunhos': carregarMuralTestemunhos,
        'lista-publicacoes': carregarFeed,
        'ministerios-tabs': initTabsMinisterios,
        'formOracaoPerfil': initFormOracaoInterno, // Form dentro do perfil
        'formOracao': initFormOracaoPublico,     // Form na home
        'secaoFinanceira': carregarEstatisticasFinanceiras,
        'fotoInput': initUploadAvatar
    };

    Object.keys(rotas).forEach(id => {
        if (document.getElementById(id)) setTimeout(rotas[id], 0);
    });
});

/* ==========================================================
   3. INTERFACE E UX (SKELETONS, MENUS, PERFIL)
========================================================== */

function atualizarInterfaceUsuario(user) {
    if (!user) return;
    const meta = user.user_metadata;
    const fotoFinal = meta.avatar_url || CONFIG.avatarFallback;

    // A. Sincroniza Fotos e Remove Skeletons
    ['userAvatarSmall', 'userAvatarLarge', 'avatarImg'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.src = fotoFinal;
            el.classList.remove('skeleton');
            el.style.opacity = "1";
        }
    });

    // B. Sincroniza Textos (Header e Perfil)
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
        if (el) {
            el.innerText = campos[id];
            el.classList.remove('skeleton');
        }
    });

    // C. Permissões de Admin (Pastor, Mídia, etc)
    const cargo = (meta.cargo || "membro").toLowerCase();
    const containerAcoes = document.getElementById('admin-actions-container');
    const btnAdminFinanceiro = document.getElementById('adminFinanceiro');
    const roles = user.app_metadata?.roles || [];

    if (containerAcoes) {
        if (["pastor", "apóstolo", "apostolo"].includes(cargo)) {
            containerAcoes.innerHTML = `<button class="action-btn" onclick="window.location.href='publicar.html'">📢 Painel de Publicação</button>`;
        } else if (["mídia", "midia"].includes(cargo)) {
            containerAcoes.innerHTML = `<button class="action-btn" onclick="window.location.href='publicar.html?tab=eventos'">📅 Publicar Eventos</button>`;
        }
    }
    if (containerAcoes) {
    // 2. Se for Moderador (role 'mod'), adiciona o botão com o escudo
        if (roles.includes("mod")) {
            // Criar um divisor visual se já houver botões de Pastor/Mídia
            if (containerAcoes.innerHTML !== '') {
                containerAcoes.innerHTML += '<hr style="margin: 10px 0; border: 0; border-top: 1px solid #eee;">';
            }
            
            containerAcoes.innerHTML += `
                <button class="action-btn-secondary" 
                        onclick="window.location.href='${prefixo}admin/moderacao.html'" 
                        style="width: 100%; border-color: #d4a373; color: #163a30; font-weight: bold; margin-top: 5px;">
                    🛡️ Painel de Moderação
                </button>
            `;
        }
    }



    if (btnAdminFinanceiro && ["admin", "financeiro", "pastor"].includes(cargo)) {
        btnAdminFinanceiro.classList.remove('hidden');
    }

    // Inicia checagem de notificações
    checarNotificacoes();
}

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
    const expiraEm = 10 * 60 * 1000;
    const cacheSalvo = localStorage.getItem(cacheKey);

    if (cacheSalvo) {
        const { timestamp, data } = JSON.parse(cacheSalvo);
        if (Date.now() - timestamp < expiraEm) return data;
    }

    const nomeBase = subpasta.includes('/') ? subpasta.split('/').pop() : subpasta;
    const url = `${CONFIG.basePath}/${nomeBase}_all.json`;

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

// ... (carregarEventos, carregarFeed, carregarMuralTestemunhos seguem a mesma lógica anterior) ...

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
   6. FUNCIONALIDADES DE PERFIL (UPLOAD & ORAÇÃO)
========================================================== */

function initUploadAvatar() {
    const input = document.getElementById('fotoInput');
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = document.getElementById('imageToCrop');
            img.src = event.target.result;
            document.getElementById('modalCrop').style.display = 'flex';
            if (cropper) cropper.destroy();
            cropper = new Cropper(img, { aspectRatio: 1, viewMode: 1 });
        };
        reader.readAsDataURL(file);
    });

    document.getElementById('btnSalvarCrop').onclick = () => {
        const canvas = cropper.getCroppedCanvas({ width: 400, height: 400 });
        const user = netlifyIdentity.currentUser();
        const status = document.getElementById('statusUpload');
        
        document.getElementById('modalCrop').style.display = 'none';
        status.innerText = "⏳ Enviando...";

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
                    status.innerText = "✅ Atualizado!";
                    location.reload();
                }
            } catch (err) { status.innerText = "❌ Erro no upload"; }
        }, 'image/jpeg');
    };
}