import { useEffect, useState, useRef } from "react";
import { db } from "../lib/firebase";
import {
  collection, onSnapshot, doc, updateDoc,
  arrayUnion, arrayRemove, query, orderBy, addDoc, serverTimestamp, deleteDoc
} from "firebase/firestore";
import {
  Shield, X, Briefcase, MessageCircle, Cake, PartyPopper, Plus, Crown, Store, ChevronRight,
  Calendar, Search, CheckCircle, Mail, Trash2, Mic, User, Clock, Eye, Download, ClipboardList, Edit, Loader2
} from "lucide-react";
import { useConfirm } from "../context/ConfirmContext";
import { sendNotification, logNotificationBatch, notifyRoles, GROUPS } from "../lib/notificationService";

// --- TIPOS ---
interface Servo {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  telefone?: string;
}

interface Oportunidade {
    servo: Servo;
    tipo: "Saudação" | "Louvor" | "Testemunho";
}

export default function MinistriesAndScales({ userRole, userEmail }: { userRole: string, userEmail?: string }) {
  
  // --- CONFIGURAÇÕES ---
  const cargosInternos = ["Líder", "Membro"];
  
  // --- PERMISSÕES (Lógica Reforçada) ---
  const roleLower = userRole?.toLowerCase() || "";
  
  // Helper simples para checar permissão (case insensitive)
  const hasRole = (roles: string[]) => roles.some(r => roleLower.includes(r.toLowerCase()));

  const isDev = hasRole(["Dev"]);
  const isAdmin = hasRole(["Admin"]);
  const isGerenciador = hasRole(["Gerenciador"]);
  const isModerador = hasRole(["Moderador"]);
  const isPublicador = hasRole(["Publicador"]);

  // QUEM PODE MEXER NAS ESCALAS: Dev, Admin, Gerenciador, Moderador
  const canManageScales = isDev || isAdmin || isGerenciador || isModerador;

  // QUEM VÊ OBREIROS: Dev, Admin, Gerenciador, Publicador
  const canViewObreiros = isDev || isAdmin || isGerenciador || isPublicador;

  // --- ESTADOS GERAIS ---
  const [activeView, setActiveView] = useState<'obreiros' | 'ministerios' | 'escalas'>('escalas');
  const [loading, setLoading] = useState(true); // Estado de carregamento global
  const [ministerios, setMinisterios] = useState<any[]>([]);
  const [todosMembros, setTodosMembros] = useState<any[]>([]);
  const [aniversariantesMes, setAniversariantesMes] = useState<any[]>([]);
  const [escalas, setEscalas] = useState<any[]>([]);

  // --- ESTADOS DE MINISTÉRIOS/OBREIROS ---
  const [minSelecionadoId, setMinSelecionadoId] = useState<string>("Louvor");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [buscaAdicionar, setBuscaAdicionar] = useState("");
  const addMenuRef = useRef<HTMLDivElement>(null);

  // --- ESTADOS DE ESCALA ---
  const [showEscalaForm, setShowEscalaForm] = useState(false);
  const [escalaEmEdicaoId, setEscalaEmEdicaoId] = useState<string | null>(null);
  const [dataCulto, setDataCulto] = useState("");
  
  // Listas da Escala
  const [equipeApoio, setEquipeApoio] = useState<Servo[]>([]);
  const [portaria, setPortaria] = useState<Servo[]>([]);
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  
  // Liderança da Escala
  const [funcoesLideranca, setFuncoesLideranca] = useState({
      ministrante: "", dirigente: "", palavraInicial: "", oracaoOfertas: ""
  });

  const [buscaServoEscala, setBuscaServoEscala] = useState("");
  const [abaEscalaAtiva, setAbaEscalaAtiva] = useState<'apoio' | 'portaria' | 'oportunidades'>('apoio');

  const { confirm } = useConfirm();

  // --- DATA FETCHING ---
  useEffect(() => {
    // 1. Busca Membros
    const unsubMembros = onSnapshot(collection(db, "contas_acesso"), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTodosMembros(data);

      const hoje = new Date();
      const mesAtual = hoje.getMonth() + 1;
      const diaHoje = hoje.getDate();
      const nivers = data.filter((m: any) => {
          if (!m.nascimento) return false;
          const [, mes] = m.nascimento.split("-");
          return parseInt(mes) === mesAtual;
        }).map((m: any) => {
          const [, , dia] = m.nascimento.split("-");
          return { ...m, dia: parseInt(dia), eHoje: parseInt(dia) === diaHoje };
        }).sort((a: any, b: any) => a.dia - b.dia);
      setAniversariantesMes(nivers);
    });

    // 2. Busca Ministérios
    const unsubMinisterios = onSnapshot(collection(db, "ministerios_info"), (snap) => {
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filtro para Moderador (vê apenas onde é membro)
      if (isModerador && !isDev && !isAdmin && !isGerenciador && userEmail) {
         data = data.filter((min: any) => min.equipe?.some((membro: any) => membro.id === userEmail));
         if(data.length > 0 && !data.find((m: any) => m.id === minSelecionadoId)) setMinSelecionadoId(data[0].id);
      }
      setMinisterios(data);
    });

    // 3. Busca Escalas
    const qEscalas = query(collection(db, "escalas_servos"), orderBy("dataCulto", "asc"));
    const unsubEscalas = onSnapshot(qEscalas, (snap) => {
        setEscalas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false); // <--- IMPORTANTE: Desativa o loading assim que as escalas chegarem
    }, (error) => {
        console.error("Erro ao buscar escalas:", error);
        setLoading(false); // Desativa mesmo com erro para não travar
    });

    // Click Outside
    function handleClickOutside(event: any) {
        if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
          setShowAddMenu(false); setBuscaAdicionar("");
        }
    }
    document.addEventListener("mousedown", handleClickOutside);

    return () => { 
        unsubMembros(); 
        unsubMinisterios(); 
        unsubEscalas(); 
        document.removeEventListener("mousedown", handleClickOutside); 
    };
  }, [userRole, userEmail]); // Dependências simplificadas

  const formatarNomeCurto = (nomeCompleto: string) => {
    if (!nomeCompleto) return "";
    const partes = nomeCompleto.trim().split(" ");
    if (partes.length <= 2) return nomeCompleto;
    return `${partes[0]} ${partes[partes.length - 1]}`;
  };

  // ====================== LÓGICA MINISTÉRIOS ======================
  const corpoObreiros = ministerios.find(m => m.id === "Corpo de Obreiros");
  const listaMinisteriosRender = ministerios.map((m: any) => m.id).filter((id: string) => id !== "Corpo de Obreiros");
  const ministerioAtual = ministerios.find(m => m.id === minSelecionadoId);
  const membrosParaAdicionar = todosMembros.filter(m => m.nome.toLowerCase().includes(buscaAdicionar.toLowerCase()));

  const souLiderDesteMinisterio = ministerioAtual?.equipe?.some((m: any) => m.id === userEmail && m.cargoInterno === "Líder");
  const podeEditarEsteMinisterio = isDev || isAdmin || isGerenciador || (isModerador && souLiderDesteMinisterio);
  const podeGerenciarCargosInternos = isDev || isAdmin || isGerenciador;

  const adicionarMembro = async (minId: string, user: any) => {
    if (!podeEditarEsteMinisterio) return;
    try {
        await updateDoc(doc(db, "ministerios_info", minId), {
            equipe: arrayUnion({
                id: user.id, nome: user.nome, cargoInterno: "Membro", 
                cargoEclesia: user.cargo, telefone: user.telefone || ""
            })
        });
        setShowAddMenu(false); setBuscaAdicionar("");
        logNotificationBatch(`Adicionado ${user.nome} em ${minId}`, 1, "Sucesso");
    } catch (e) { alert("Erro ao adicionar."); }
  };

  const removerMembro = async (minId: string, membroObj: any) => {
    if (!podeEditarEsteMinisterio) return;
    const confirmou = await confirm({ title: "Desligar Integrante?", message: `Remover ${membroObj.nome} de ${minId}?`, variant: "danger", confirmText: "Sim, Desligar" });
    if (!confirmou) return;
    try { await updateDoc(doc(db, "ministerios_info", minId), { equipe: arrayRemove(membroObj) }); } catch (e) { alert("Erro ao remover."); }
  };

  const mudarCargoInterno = async (minId: string, equipeAtual: any[], index: number, novoCargo: string) => {
    if (!podeGerenciarCargosInternos) return; 
    const novaEquipe = [...equipeAtual];
    novaEquipe[index].cargoInterno = novoCargo;
    await updateDoc(doc(db, "ministerios_info", minId), { equipe: novaEquipe });
  };

  const handleExportMinisterio = () => {
      if (!ministerioAtual || !ministerioAtual.equipe) return;
      const headers = ["Nome", "Cargo", "Funcao", "Telefone", "Email"];
      const rows = ministerioAtual.equipe.map((m: any) => [`"${m.nome}"`, `"${m.cargoEclesia}"`, `"${m.cargoInterno}"`, `"${m.telefone || ""}"`, `"${m.id}"`]);
      const csvContent = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${ministerioAtual.titulo}_membros.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // ====================== LÓGICA ESCALAS ======================

  const getServosFromNames = (nomes: string[]) => {
      if(!nomes) return [];
      return nomes.map(nome => todosMembros.find((m:any) => m.nome === nome)).filter(Boolean) as Servo[];
  };

  const carregarEscalaParaEdicao = (escala: any) => {
      setEscalaEmEdicaoId(escala.id);
      setDataCulto(escala.dataCulto);
      setFuncoesLideranca({
          ministrante: escala.ministrante || "",
          dirigente: escala.dirigente || "",
          palavraInicial: escala.palavraInicial || "",
          oracaoOfertas: escala.oracaoOfertas || ""
      });
      setEquipeApoio(getServosFromNames(escala.equipeApoio));
      setPortaria(getServosFromNames(escala.portaria));
      if (escala.oportunidades) {
          const opsRecuperadas = escala.oportunidades.map((op: any) => {
              const servo = todosMembros.find((m:any) => m.nome === op.nome);
              return servo ? { servo, tipo: op.tipo } : null;
          }).filter(Boolean) as Oportunidade[];
          setOportunidades(opsRecuperadas);
      } else {
          setOportunidades([]);
      }
      setShowEscalaForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleApoio = (servo: Servo) => {
    setEquipeApoio(prev => prev.find(s => s.id === servo.id) ? prev.filter(s => s.id !== servo.id) : [...prev, servo]);
  };

  const togglePortaria = (servo: Servo) => {
      if (portaria.find(s => s.id === servo.id)) {
          setPortaria(prev => prev.filter(s => s.id !== servo.id));
      } else {
          if (portaria.length < 3) setPortaria(prev => [...prev, servo]);
      }
  };

  const addOportunidade = (servo: Servo) => {
      if (oportunidades.length >= 4) return; 
      if (oportunidades.find(op => op.servo.id === servo.id)) return;
      setOportunidades(prev => [...prev, { servo, tipo: "Saudação" }]);
  };

  const removeOportunidade = (id: string) => {
      setOportunidades(prev => prev.filter(op => op.servo.id !== id));
  };

  const updateTipoOportunidade = (id: string, novoTipo: "Saudação" | "Louvor" | "Testemunho") => {
      setOportunidades(prev => prev.map(op => op.servo.id === id ? { ...op, tipo: novoTipo } : op));
  };

  const salvarEscala = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageScales) return;
    if (!dataCulto) return alert("Selecione uma data.");
    
    // Validação
    const temGente = equipeApoio.length > 0 || portaria.length > 0 || oportunidades.length > 0 || Object.values(funcoesLideranca).some(v => v);
    if (!temGente) return alert("Preencha pelo menos uma função.");

    const isEdit = !!escalaEmEdicaoId;
    const dataVisual = new Date(dataCulto + "T12:00:00").toLocaleDateString('pt-BR');

    const confirmou = await confirm({
        title: isEdit ? "Atualizar Escala?" : "Publicar Escala?",
        message: isEdit ? "Os envolvidos serão notificados da alteração." : `Confirmar escala para ${dataVisual}?`,
        confirmText: isEdit ? "Salvar Alterações" : "Publicar",
        cancelText: "Cancelar"
    });
    if (!confirmou) return;

    // Recuperar e-mails da liderança
    const emailsLideranca = Object.values(funcoesLideranca)
        .map(nome => todosMembros.find((m: any) => m.nome === nome)?.email)
        .filter(Boolean);

    const payload = {
        dataCulto, // String YYYY-MM-DD
        ministerio: "Culto Geral",
        equipeApoio: equipeApoio.map(s => s.nome),
        portaria: portaria.map(s => s.nome),
        oportunidades: oportunidades.map(op => ({ nome: op.servo.nome, tipo: op.tipo })),
        ...funcoesLideranca,
        servosEmails: [
            ...emailsLideranca,
            ...equipeApoio.map(s => s.email), 
            ...portaria.map(s => s.email), 
            ...oportunidades.map(op => op.servo.email)
        ].filter(Boolean),
        criadoEm: serverTimestamp()
    };

    try {
        let docId = escalaEmEdicaoId;
        if (isEdit) {
            await updateDoc(doc(db, "escalas_servos", escalaEmEdicaoId!), payload);
        } else {
            const docRef = await addDoc(collection(db, "escalas_servos"), payload);
            docId = docRef.id;
        }

        // Notificações
        try {
             for (const email of payload.servosEmails) {
                if (email) await sendNotification(
                    email, 
                    isEdit ? "Escala Modificada" : "Nova Escala", 
                    isEdit 
                        ? `A escala do dia ${dataVisual} foi alterada. Clique para ver suas funções atualizadas.` 
                        : `Você foi escalado para ${dataVisual}. Clique para ver detalhes.`, 
                    `/escala/${docId}`, // Link (4º argumento)
                    "escala"            // Tipo (5º argumento)
                );
            }
            if(!isEdit) await notifyRoles(GROUPS.MINISTERIOS, "Nova Escala", `Escala definida para ${dataVisual}.`, "admin", "/admin?tab=ministerios");
        } catch (error) { console.log("Erro notif:", error); }
        
        limparFormularioEscala();
        alert(isEdit ? "Escala atualizada!" : "Escala publicada!");
    } catch (error) { alert("Erro ao salvar."); }
  };

  const limparFormularioEscala = () => {
        setEquipeApoio([]); setPortaria([]); setOportunidades([]);
        setFuncoesLideranca({ ministrante: "", dirigente: "", palavraInicial: "", oracaoOfertas: "" });
        setDataCulto(""); 
        setShowEscalaForm(false);
        setEscalaEmEdicaoId(null);
  }

  const deletarEscala = async (id: string) => {
      if (!canManageScales) return;
      const confirmou = await confirm({ title: "Excluir Escala?", message: "Ação irreversível.", variant: "danger", confirmText: "Excluir" });
      if (confirmou) await deleteDoc(doc(db, "escalas_servos", id));
  }

  // --- RENDERIZAÇÃO ---

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando dados...</p>
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 font-sans animate-in fade-in duration-500 mt-6">
      
      {/* TABS DE NAVEGAÇÃO - REORDENADAS: ESCALAS PRIMEIRO */}
      <div className="flex justify-center md:justify-start">
        <div className="bg-slate-100 p-1.5 rounded-2xl inline-flex w-full md:w-auto shadow-inner overflow-hidden">
            <button onClick={() => setActiveView('escalas')} className={`flex-1 md:flex-none px-6 md:px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeView === 'escalas' ? 'bg-white text-indigo-600 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}>
                <Calendar size={16} /> <span className="hidden sm:inline">Escalas</span>
            </button>
            {canViewObreiros && (
                <button onClick={() => setActiveView('obreiros')} className={`flex-1 md:flex-none px-6 md:px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeView === 'obreiros' ? 'bg-white text-violet-600 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}>
                    <Shield size={16} /> <span className="hidden sm:inline">Obreiros</span>
                </button>
            )}
            <button onClick={() => setActiveView('ministerios')} className={`flex-1 md:flex-none px-6 md:px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeView === 'ministerios' ? 'bg-white text-emerald-600 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}>
                <Briefcase size={16} /> <span className="hidden sm:inline">Ministérios</span>
            </button>
        </div>
      </div>

      {/* ======================= VIEW: ESCALAS ======================= */}
      {activeView === 'escalas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* ESQUERDA: FORMULÁRIO */}
            {canManageScales && (
            <div className="lg:col-span-1">
                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-indigo-100/50 sticky top-6">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-4 mb-6">
                        <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                            <ClipboardList size={20} className="text-indigo-500" /> {escalaEmEdicaoId ? "Editar Escala" : "Nova Escala"}
                        </h2>
                        {escalaEmEdicaoId && <button onClick={limparFormularioEscala} className="text-xs text-rose-500 font-bold hover:underline">Cancelar Edição</button>}
                    </div>
                    
                    <form onSubmit={salvarEscala} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Data do Culto</label>
                            <input type="date" value={dataCulto} onChange={e => setDataCulto(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-700 p-3 rounded-xl outline-none focus:border-indigo-400 font-bold text-sm" />
                        </div>
                        
                        {/* LIDERANÇA COM MINI CAMPO DE PESQUISA */}
                        <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Mic size={10}/> Liderança</p>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.keys(funcoesLideranca).map(key => (
                                    <div key={key} className="space-y-1">
                                        <label className="text-[8px] font-bold text-slate-400 uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                        <SearchableMemberInput 
                                            value={(funcoesLideranca as any)[key]} 
                                            onChange={(val) => setFuncoesLideranca({...funcoesLideranca, [key]: val})}
                                            membros={todosMembros}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex bg-slate-100 p-1 rounded-xl mb-3">
                                <button type="button" onClick={() => setAbaEscalaAtiva('apoio')} className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase transition-all ${abaEscalaAtiva === 'apoio' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Apoio ({equipeApoio.length})</button>
                                <button type="button" onClick={() => setAbaEscalaAtiva('portaria')} className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase transition-all ${abaEscalaAtiva === 'portaria' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Portaria ({portaria.length}/3)</button>
                                <button type="button" onClick={() => setAbaEscalaAtiva('oportunidades')} className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase transition-all ${abaEscalaAtiva === 'oportunidades' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Oport. ({oportunidades.length}/4)</button>
                            </div>
                            <div className="relative mb-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input placeholder="Buscar voluntário..." value={buscaServoEscala} onChange={e => setBuscaServoEscala(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-300 transition-all" />
                            </div>
                            <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl h-48 overflow-y-auto custom-scrollbar space-y-1">
                                {(todosMembros as Servo[]).filter(s => s.nome.toLowerCase().includes(buscaServoEscala.toLowerCase())).map(s => {
                                    let isSelected = false;
                                    if (abaEscalaAtiva === 'apoio') isSelected = !!equipeApoio.find(sel => sel.id === s.id);
                                    if (abaEscalaAtiva === 'portaria') isSelected = !!portaria.find(sel => sel.id === s.id);
                                    if (abaEscalaAtiva === 'oportunidades') isSelected = !!oportunidades.find(sel => sel.servo.id === s.id);

                                    return (
                                        <div key={s.id} onClick={() => {
                                            if (abaEscalaAtiva === 'apoio') toggleApoio(s);
                                            if (abaEscalaAtiva === 'portaria') togglePortaria(s);
                                            if (abaEscalaAtiva === 'oportunidades') isSelected ? removeOportunidade(s.id) : addOportunidade(s);
                                        }} className={`p-2 rounded-lg cursor-pointer transition-all flex justify-between items-center border ${isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200'}`}>
                                            <span className="text-[10px] font-bold truncate pr-2">{s.nome}</span>
                                            {isSelected ? <CheckCircle size={14} /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-200" />}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {oportunidades.length > 0 && (
                            <div className="space-y-2 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Tipos de Oportunidade</p>
                                {oportunidades.map((op) => (
                                    <div key={op.servo.id} className="flex items-center justify-between gap-2 bg-white p-2 rounded-lg border border-slate-100">
                                        <span className="text-[10px] font-bold text-slate-700 truncate flex-1">{op.servo.nome}</span>
                                        <select value={op.tipo} onChange={(e) => updateTipoOportunidade(op.servo.id, e.target.value as any)} className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded p-1 outline-none">
                                            <option>Saudação</option><option>Louvor</option><option>Testemunho</option>
                                        </select>
                                        <button type="button" onClick={() => removeOportunidade(op.servo.id)} className="text-slate-300 hover:text-red-500"><X size={14}/></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
                            {escalaEmEdicaoId ? <><Edit size={16} /> Atualizar Escala</> : <><Mail size={16} /> Publicar Escala</>}
                        </button>
                    </form>
                </div>
            </div>
            )}

            {/* DIREITA: LISTA DE ESCALAS */}
            <div className={`${canManageScales ? 'lg:col-span-2' : 'col-span-full'} space-y-6`}>
                <div className="flex items-center gap-3 mb-2"><Clock className="text-slate-400" size={20} /><h2 className="text-lg font-bold text-slate-700 uppercase tracking-tight">Agenda Confirmada</h2></div>
                <div className={`grid grid-cols-1 ${canManageScales ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-5`}>
                    {escalas.map(escala => {
                        const dataObj = new Date(escala.dataCulto + "T12:00:00");
                        return (
                            <div key={escala.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 hover:shadow-lg transition-all group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
                                <div className="flex justify-between items-start mb-6 pl-2">
                                    <div className="bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{dataObj.toLocaleDateString('pt-BR', { weekday: 'long' })}</p>
                                        <p className="text-2xl font-black text-indigo-900">{dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
                                    </div>
                                    {canManageScales && (
                                        <div className="flex gap-1">
                                            <button onClick={() => carregarEscalaParaEdicao(escala)} className="text-slate-300 hover:text-indigo-500 p-2 transition-colors hover:bg-indigo-50 rounded-lg"><Edit size={18} /></button>
                                            <button onClick={() => deletarEscala(escala.id)} className="text-slate-300 hover:text-rose-500 p-2 transition-colors hover:bg-rose-50 rounded-lg"><Trash2 size={18} /></button>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4 pl-2">
                                    <h4 className="text-xl font-bold uppercase tracking-tight text-slate-800">{escala.ministerio || "Culto Geral"}</h4>
                                    {(escala.ministrante || escala.dirigente) && (
                                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                                            {escala.ministrante && <div><span className="text-[8px] font-bold text-slate-400 uppercase block">Ministrante</span><span className="font-bold text-slate-700">{escala.ministrante}</span></div>}
                                            {escala.dirigente && <div><span className="text-[8px] font-bold text-slate-400 uppercase block">Dirigente</span><span className="font-bold text-slate-700">{escala.dirigente}</span></div>}
                                        </div>
                                    )}
                                    {escala.oportunidades && escala.oportunidades.length > 0 && (
                                        <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                                            <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Mic size={10}/> Oportunidades</p>
                                            <div className="space-y-1">
                                                {escala.oportunidades.map((op: any, i: number) => (
                                                    <div key={i} className="flex justify-between items-center text-[10px]"><span className="font-bold text-slate-700">{op.nome}</span><span className="font-bold text-[8px] text-amber-600 bg-white px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-wide">{op.tipo}</span></div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {escala.portaria && escala.portaria.length > 0 && (<div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Portaria</p><div className="flex flex-wrap gap-1.5">{escala.portaria.map((nome: string, i: number) => (<span key={i} className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-md">{nome.split(' ')[0]}</span>))}</div></div>)}
                                    {escala.equipeApoio && escala.equipeApoio.length > 0 && (<div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Apoio</p><div className="flex flex-wrap gap-1.5">{escala.equipeApoio.map((nome: string, i: number) => (<span key={i} className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-md border border-emerald-100">{nome.split(' ')[0]}</span>))}</div></div>)}
                                </div>
                            </div>
                        )
                    })}
                    {escalas.length === 0 && (<div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50"><Calendar size={64} className="mb-4 opacity-20" /><p className="text-sm font-black uppercase tracking-widest">Nenhuma escala agendada</p></div>)}
                </div>
            </div>
        </div>
      )}

      {/* ======================= VIEW: OBREIROS & MINISTÉRIOS ======================= */}
      {activeView !== 'escalas' && (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[600px] flex flex-col overflow-hidden relative">
                
                {/* CONTEÚDO OBREIROS */}
                {activeView === 'obreiros' && (
                    <>
                        <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-slate-50/30">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Corpo Eclesiástico</h3>
                                <span className="text-xs font-bold bg-violet-50 text-violet-700 px-4 py-2 rounded-xl border border-violet-100 mt-2 inline-block">{corpoObreiros?.equipe?.length || 0} Membros</span>
                            </div>
                            {(isDev || isAdmin || isGerenciador) && (
                                <div className="relative" ref={addMenuRef}>
                                    <button onClick={() => setShowAddMenu(!showAddMenu)} className="flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-violet-700 transition-all shadow-md shadow-violet-200">
                                        <Plus size={14} /> Adicionar
                                    </button>
                                    {showAddMenu && (
                                        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-in zoom-in-95 duration-200">
                                            <input autoFocus placeholder="Buscar membro..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-3 py-2 text-xs outline-none mb-3" value={buscaAdicionar} onChange={(e) => setBuscaAdicionar(e.target.value)} />
                                            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                                                {membrosParaAdicionar.map(membro => {
                                                    if(corpoObreiros?.equipe?.some((m: any) => m.id === membro.id)) return null;
                                                    return (<button key={membro.id} onClick={() => adicionarMembro("Corpo de Obreiros", membro)} className="w-full text-left p-2 hover:bg-violet-50 rounded-lg text-xs font-bold text-slate-700 truncate">{membro.nome}</button>);
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 max-h-[600px]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {corpoObreiros?.equipe?.map((mem: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-violet-200 hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 text-sm font-black uppercase border border-slate-100">{mem.nome.charAt(0)}</div>
                                        <div className="flex flex-col"><span className="text-sm font-bold text-slate-700">{formatarNomeCurto(mem.nome)}</span><span className="text-[10px] font-black text-violet-500 uppercase tracking-widest">{mem.cargoEclesia}</span></div>
                                    </div>
                                    {(isDev || isAdmin || isGerenciador) && (<button onClick={() => removerMembro("Corpo de Obreiros", mem)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><X size={18} /></button>)}
                                </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* CONTEÚDO MINISTÉRIOS */}
                {activeView === 'ministerios' && (
                    <div className="flex flex-col lg:flex-row h-full">
                        <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-100 p-6 bg-slate-50/30 flex flex-col gap-3 shrink-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1 ml-1 tracking-widest hidden lg:block">Departamentos</p>
                            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
                                {listaMinisteriosRender.map((id: string) => (
                                    <button key={id} onClick={() => setMinSelecionadoId(id)} className={`flex-shrink-0 flex items-center justify-between px-4 py-2.5 rounded-xl font-bold text-xs uppercase transition-all whitespace-nowrap lg:w-full ${minSelecionadoId === id ? "bg-white text-emerald-600 border border-emerald-100 shadow-sm ring-1 ring-emerald-50" : "bg-transparent border border-transparent text-slate-400 hover:text-slate-600 hover:bg-white/50"}`}>
                                        <span>{id}</span>{minSelecionadoId === id && <ChevronRight size={14} className="hidden lg:block text-emerald-400" />}
                                    </button>
                                ))}
                            </div>
                        </aside>
                        <div className="flex-1 flex flex-col min-h-[500px]">
                            {ministerioAtual ? (
                                <>
                                    <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative">
                                        <div><h3 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">{ministerioAtual.titulo}</h3></div>
                                        <div className="flex gap-2">
                                            {(isDev || isAdmin || isGerenciador || isModerador) && <button onClick={handleExportMinisterio} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm"><Download size={14} /> CSV</button>}
                                            {podeEditarEsteMinisterio && (
                                                <div className="relative" ref={addMenuRef}>
                                                    <button onClick={() => setShowAddMenu(!showAddMenu)} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200"><Plus size={14} /> Adicionar</button>
                                                    {showAddMenu && (
                                                        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-in zoom-in-95 duration-200">
                                                            <input autoFocus placeholder="Buscar..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-3 py-2 text-xs outline-none mb-3" value={buscaAdicionar} onChange={(e) => setBuscaAdicionar(e.target.value)} />
                                                            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                                                                {membrosParaAdicionar.map(membro => {
                                                                    if(ministerioAtual.equipe?.some((m: any) => m.id === membro.id)) return null;
                                                                    return (<button key={membro.id} onClick={() => adicionarMembro(minSelecionadoId, membro)} className="w-full text-left p-2 hover:bg-emerald-50 rounded-lg text-xs font-bold text-slate-700 truncate">{membro.nome}</button>);
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-8 grid grid-cols-1 gap-4 overflow-y-auto custom-scrollbar flex-1">
                                        {ministerioAtual.equipe?.map((mem: any, idx: number) => (
                                            <div key={idx} className="p-5 bg-white border border-slate-100 rounded-2xl hover:border-emerald-200 transition-all shadow-sm group hover:shadow-md">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-black border border-slate-100 uppercase text-sm">{mem.nome.charAt(0)}</div>
                                                        <div><p className="font-bold text-slate-800 text-sm">{formatarNomeCurto(mem.nome)}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{mem.cargoEclesia}</p></div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {mem.telefone && <a href={`https://wa.me/55${mem.telefone.replace(/\D/g, '')}`} target="_blank" className="p-2 bg-slate-50 text-emerald-500 rounded-xl hover:bg-emerald-50 transition-colors"><MessageCircle size={16} /></a>}
                                                        {podeEditarEsteMinisterio && <button onClick={() => removerMembro(minSelecionadoId, mem)} className="p-2 bg-slate-50 text-rose-400 rounded-xl hover:bg-rose-50 transition-colors"><X size={16} /></button>}
                                                    </div>
                                                </div>
                                                <div className="flex bg-slate-50 p-1.5 rounded-xl">
                                                    {cargosInternos.map((cargo: string) => {
                                                        const isActive = mem.cargoInterno === cargo;
                                                        return (
                                                          <button key={cargo} disabled={!podeGerenciarCargosInternos} onClick={() => mudarCargoInterno(minSelecionadoId, ministerioAtual.equipe, idx, cargo)} className={`flex-1 py-2 rounded-lg text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${isActive ? (cargo==='Líder' ? "bg-white shadow-sm text-amber-600 font-black border border-amber-100" : "bg-white shadow-sm text-emerald-600 font-black") : "text-slate-400 hover:text-slate-600 font-medium"} ${!podeGerenciarCargosInternos && 'cursor-not-allowed opacity-70'}`}>
                                                            {cargo === "Líder" && isActive && <Crown size={12} />}{cargo}
                                                          </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                        {(!ministerioAtual.equipe || ministerioAtual.equipe.length === 0) && (<div className="py-20 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl"><Store size={48} className="mx-auto mb-4 opacity-20"/><p className="text-xs font-black uppercase tracking-widest">Lista Vazia</p></div>)}
                                    </div>
                                </>
                            ) : (<div className="flex-1 flex flex-col items-center justify-center text-slate-300"><Store size={64} className="opacity-10 mb-4" /><p className="text-xs font-black uppercase tracking-widest">Selecione um departamento</p></div>)}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* LATERAL: ANIVERSARIANTES */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[600px] sticky top-6">
            <div className="p-8 border-b border-slate-50 flex items-center gap-5 bg-white z-10">
                <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Cake size={28} /></div>
                <div><h2 className="text-xl font-bold text-slate-800 tracking-tight">Aniversariantes</h2><p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-1">Mês Atual</p></div>
            </div>
            <div className="p-6 space-y-3 overflow-y-auto custom-scrollbar flex-1">
                {aniversariantesMes.length > 0 ? (aniversariantesMes.map((niver: any) => (
                    <div key={niver.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${niver.eHoje ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-sm ${niver.eHoje ? 'bg-white text-amber-600 border border-amber-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>{niver.dia}</div>
                            <div><p className={`text-sm font-bold ${niver.eHoje ? 'text-amber-900' : 'text-slate-700'}`}>{formatarNomeCurto(niver.nome)}</p>{niver.eHoje ? (<span className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 uppercase tracking-wide mt-0.5"><PartyPopper size={12} /> É HOJE!</span>) : (<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Aniversário</span>)}</div>
                        </div>
                        {niver.telefone && (<a href={`https://wa.me/55${niver.telefone.replace(/\D/g, '')}`} target="_blank" className={`p-2.5 rounded-xl transition-colors ${niver.eHoje ? 'bg-white text-amber-600 hover:bg-amber-100 shadow-sm' : 'bg-slate-50 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'}`}><MessageCircle size={18} /></a>)}
                    </div>
                ))) : (<div className="h-full flex flex-col items-center justify-center text-slate-300"><Cake size={64} className="mb-4 opacity-10" /><p className="text-xs font-black uppercase tracking-widest">Nenhum aniver. este mês</p></div>)}
            </div>
        </div>
      </div>
      )}
    </div>
  );
}

// --- NOVO COMPONENTE: INPUT DE PESQUISA PARA LIDERANÇA ---
// Substitui o input simples por uma caixa de busca que filtra membros
function SearchableMemberInput({ value, onChange, membros }: { value: string, onChange: (val: string) => void, membros: any[] }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: any) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Se já tiver valor selecionado, mostra ele. Se o usuário clicar, limpa pra pesquisar.
    const handleFocus = () => {
        setSearch("");
        setOpen(true);
    };

    const handleSelect = (nome: string) => {
        onChange(nome);
        setOpen(false);
        setSearch("");
    };

    const filtered = membros.filter(m => m.nome.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <input 
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-300 truncate pr-8"
                    value={open ? search : value} // Se aberto, mostra o que digita. Se fechado, o valor salvo.
                    onChange={e => { setSearch(e.target.value); if(!open) setOpen(true); }}
                    onFocus={handleFocus}
                    placeholder={value || "Pesquisar..."}
                />
                {value && !open && <button onClick={() => onChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-400"><X size={12}/></button>}
            </div>
            
            {open && (
                <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1 z-50 max-h-40 overflow-y-auto custom-scrollbar">
                    {filtered.length > 0 ? filtered.map(m => (
                        <button key={m.id} onClick={() => handleSelect(m.nome)} className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 text-slate-700 truncate">
                            {m.nome}
                        </button>
                    )) : (
                        <div className="px-3 py-2 text-[10px] text-slate-400 text-center">Nenhum membro encontrado</div>
                    )}
                </div>
            )}
        </div>
    );
}