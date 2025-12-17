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

    // --- CARREGAMENTO DE EVENTOS (SE ESTIVER NA PÁGINA EVENTOS) ---
    if (document.getElementById('lista-proximos')) {
        carregarEventos();
    }
});

/* ==========================================================
   2. LÓGICA DO BLOG/EVENTOS (VIA GITHUB API)
========================================================== */
async function carregarEventos() {
    const repoPath = "FamiliasChurch/FamiliasChurch"; // Baseado no seu repositório
    const folderPath = "content/eventos";
    const listaProximos = document.getElementById('lista-proximos');
    const listaPassados = document.getElementById('lista-passados');
    const agora = new Date();

    try {
        const response = await fetch(`https://api.github.com/repos/${repoPath}/contents/${folderPath}`);
        if (!response.ok) throw new Error("Pasta de eventos não encontrada");
        
        const arquivos = await response.json();
        const arquivosJson = arquivos.filter(arq => arq.name.endsWith('.json'));

        // Busca o conteúdo de cada arquivo JSON
        const promessas = arquivosJson.map(arq => fetch(arq.download_url).then(res => res.json()));
        const eventos = await Promise.all(promessas);

        // Separação e Ordenação
        const proximos = eventos.filter(e => new Date(e.date) >= agora);
        const passados = eventos.filter(e => new Date(e.date) < agora);

        // Regra Especial: Encontro com Deus no topo, depois data próxima
        proximos.sort((a, b) => {
            if (a.is_special && !b.is_special) return -1;
            if (!a.is_special && b.is_special) return 1;
            return new Date(a.date) - new Date(b.date);
        });

        passados.sort((a, b) => new Date(b.date) - new Date(a.date));

        const formatarData = (d) => new Date(d).toLocaleDateString('pt-BR', {day:'2-digit', month:'long', hour:'2-digit', minute:'2-digit'});

        const renderCard = (ev) => `
            <div class="card-evento ${ev.is_special ? 'destaque-especial' : ''}">
                <img src="${ev.image}" alt="${ev.title}" loading="lazy">
                <div class="card-info">
                    <span>${formatarData(ev.date)}</span>
                    <h3>${ev.title}</h3>
                    <div class="card-texto">${ev.body}</div>
                </div>
            </div>
        `;

        listaProximos.innerHTML = proximos.length ? proximos.map(renderCard).join('') : '<p>Nenhum evento próximo.</p>';
        listaPassados.innerHTML = passados.length ? passados.map(renderCard).join('') : '<p>Sem histórico disponível.</p>';

    } catch (err) {
        console.error("Erro no Blog:", err);
    }
}

/* ==========================================================
   3. FUNÇÕES GLOBAIS (CHAMADAS VIA ONCLICK NO HTML)
========================================================== */

// Alternar Unidades (PR/SC) na Home
function trocarUnidade(estado) {    
    const contentPR = document.getElementById('conteudo-pr');
    const contentSC = document.getElementById('conteudo-sc');
    const btnPR = document.getElementById('btn-pr');
    const btnSC = document.getElementById('btn-sc');
    
    if (estado === 'pr') {
        contentPR.classList.remove('hidden');
        contentSC.classList.add('hidden');
        btnPR.classList.add('active');
        btnSC.classList.remove('active');
    } else {
        contentPR.classList.add('hidden');
        contentSC.classList.remove('hidden');
        btnSC.classList.add('active');
        btnPR.classList.remove('active');
    }
}

// Abas de Ministérios
function ativarAba(elemento) {
    const botoes = document.querySelectorAll('.tab-btn');
    botoes.forEach(btn => btn.classList.remove('active'));
    elemento.classList.add('active');

    const displayImg = document.getElementById('tabImg');
    const displayTitulo = document.getElementById('tabTitulo');
    const displayDesc = document.getElementById('tabDesc');

    displayImg.style.opacity = '0';
    setTimeout(() => {
        displayImg.src = elemento.getAttribute('data-img');
        displayTitulo.textContent = elemento.getAttribute('data-titulo');
        displayDesc.textContent = elemento.getAttribute('data-desc');
        displayImg.style.opacity = '1';
    }, 200);
}

// Alternar Oferta/Dízimo
function mostrarOpcao(tipo) {
    const boxOferta = document.getElementById('box-oferta');
    const boxDizimo = document.getElementById('box-dizimo');
    const botoes = document.querySelectorAll('.btn-toggle');

    botoes.forEach(btn => btn.classList.remove('active'));

    if (tipo === 'oferta') {
        if(boxOferta) boxOferta.classList.remove('hidden');
        if(boxDizimo) boxDizimo.classList.add('hidden');
        if(botoes[0]) botoes[0].classList.add('active');
    } else {
        if(boxOferta) boxOferta.classList.add('hidden');
        if(boxDizimo) boxDizimo.classList.remove('hidden');
        if(botoes[1]) botoes[1].classList.add('active');
    }
}

// Copiar Pix e Formatar Moeda
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