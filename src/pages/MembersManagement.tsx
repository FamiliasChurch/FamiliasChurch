import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, doc, updateDoc, query, orderBy, deleteDoc } from "firebase/firestore";
import { 
  Users, Search, Mail, Phone, Trash2, ChevronDown, 
  FileSpreadsheet, UserMinus, UserCheck, Circle, Shield, Lock, CreditCard, X
} from "lucide-react";
import { useConfirm } from "../context/ConfirmContext";
// Importe o componente da Carteirinha
import MembershipCard from "../pages/MembershipCard"; 

interface MembersProps {
  currentUserRole: string;
}

export default function MembersManagement({ currentUserRole }: MembersProps) {
  const [membros, setMembros] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("");
  const [membroSelecionado, setMembroSelecionado] = useState<any>(null); 
  
  // 1. CARGOS ECLESIÁSTICOS
  const cargosEclesiasticos = [
    "Apóstolo", "Pastor", "Evangelista", "Presbítero", 
    "Diácono", "Obreiro", "Servo", "Membro"
  ];

  // 2. CARGOS DE SISTEMA
  const cargosSistema = [
    "Dev", "Admin", "Gerenciador", "Moderador", "Publicador"
  ];

  const { confirm } = useConfirm();
  
  // --- REGRAS DE PERMISSÃO ---
  const normalizedRole = currentUserRole?.toLowerCase() || "";
  const isDevOrAdmin = ["dev", "admin"].includes(normalizedRole);
  const isGerenciador = normalizedRole === "gerenciador";
  
  const podeEditar = isDevOrAdmin || isGerenciador;
  const podeGerenciarPermissoes = isDevOrAdmin || isGerenciador;

  const cargosProtegidos = ["dev", "admin", "pastor", "apóstolo"];

  const isTargetProtected = (targetCargo: string, targetPermissao: string) => {
      const c = (targetCargo || "").toLowerCase();
      const p = (targetPermissao || "").toLowerCase();
      return cargosProtegidos.some(role => c.includes(role) || p.includes(role));
  };

  useEffect(() => {
    const q = query(collection(db, "contas_acesso"), orderBy("nome", "asc"));
    return onSnapshot(q, (snap) => {
      setMembros(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const filtrados = membros.filter(m => 
    m.nome?.toLowerCase().includes(filtro.toLowerCase()) || 
    m.email?.toLowerCase().includes(filtro.toLowerCase())
  );

  const handleExport = () => {
    if (filtrados.length === 0) return;
    const headers = ["Nome", "Email", "Telefone", "Cargo Eclesiastico", "Permissao Sistema", "Status", "ID"];
    const rows = filtrados.map(m => [
      `"${m.nome || ""}"`, `"${m.email || ""}"`, `"${m.telefone || ""}"`,
      `"${m.cargo || ""}"`, `"${m.permissao || ""}"`, `"${m.status || "Ativo"}"`, `"${m.id}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `membros_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const adaptarCargoAoGenero = (cargoBase: string, genero: string) => {
      if (genero !== "Feminino") return cargoBase;
      if (cargoBase === "Apóstolo") return "Apóstola";
      if (cargoBase === "Pastor") return "Pastora";
      if (cargoBase === "Evangelista") return "Evangelista"; 
      if (cargoBase === "Presbítero") return "Presbítera"; 
      if (cargoBase === "Diácono") return "Diaconisa";
      if (cargoBase === "Obreiro") return "Obreira";
      if (cargoBase === "Servo") return "Serva";
      if (cargoBase === "Discípulo") return "Discípula";
      return cargoBase;
  };

  const handleAlterarCargo = async (id: string, novoCargo: string, cargoAtualMembro: string, permissaoAtual: string) => {
    if (!podeEditar) return;

    if (isGerenciador) {
        if (isTargetProtected(cargoAtualMembro, permissaoAtual)) {
            await confirm({ title: "Ação Restrita", message: "Gerenciadores não podem alterar cargos da Liderança.", variant: "danger", confirmText: "Entendi" });
            return;
        }
        if (isTargetProtected(novoCargo, "")) {
             await confirm({ title: "Ação Restrita", message: "Gerenciadores não podem promover membros para Pastor ou Apóstolo.", variant: "danger", confirmText: "Entendi" });
            return;
        }
    }

    const confirmou = await confirm({
        title: "Alterar Título",
        message: `Mudar título eclesiástico para ${novoCargo}?`,
        variant: "info",
        confirmText: "Confirmar",
        cancelText: "Cancelar"
    });

    if (confirmou) {
        try { await updateDoc(doc(db, "contas_acesso", id), { cargo: novoCargo }); } catch (e) { console.error(e); }
    }
  };

  const handleAlterarPermissao = async (id: string, novaPermissao: string) => {
    if (!podeGerenciarPermissoes) return;

    const confirmou = await confirm({
        title: "Alterar Nível de Acesso",
        message: novaPermissao 
            ? `ATENÇÃO: Definir permissão do sistema como ${novaPermissao}? Isso dará acesso a áreas restritas.`
            : `Remover permissão administrativa deste usuário?`,
        variant: "danger",
        confirmText: "Salvar",
        cancelText: "Cancelar"
    });

    if (confirmou) {
        try { await updateDoc(doc(db, "contas_acesso", id), { permissao: novaPermissao }); } catch (e) { console.error(e); }
    }
  };

  const handleToggleStatus = async (membro: any) => {
    if (!podeEditar) return;
    
    if (isGerenciador && isTargetProtected(membro.cargo, membro.permissao)) {
        await confirm({ title: "Ação Proibida", message: "Você não pode desligar um membro da Liderança.", variant: "danger", confirmText: "Entendi" });
        return;
    }

    const isDesligado = membro.status === "Desligado";
    const novoStatus = isDesligado ? "Ativo" : "Desligado";

    const confirmou = await confirm({
        title: isDesligado ? "Reativar Membro?" : "Desligar Membro?",
        message: isDesligado ? `Reativar o acesso de ${membro.nome}?` : `Desligar ${membro.nome}? O acesso ao sistema será revogado imediatamente.`,
        variant: isDesligado ? "success" : "danger",
        confirmText: isDesligado ? "Sim, Reativar" : "Sim, Desligar"
    });

    if (confirmou) {
        try { await updateDoc(doc(db, "contas_acesso", membro.id), { status: novoStatus }); } catch (e) { console.error(e); }
    }
  };

  const excluirMembro = async (id: string, nome: string, cargoAtualMembro: string, permissaoAtual: string) => {
    if (!podeEditar) return;

    if (isGerenciador && isTargetProtected(cargoAtualMembro, permissaoAtual)) {
        await confirm({ title: "Proibido", message: "Você não pode excluir um líder do sistema.", variant: "danger", confirmText: "Ok" });
        return;
    }

    const confirmou = await confirm({
        title: "Excluir Permanentemente?",
        message: `Remover ${nome} do banco de dados? Todo o histórico financeiro e de atividades será perdido.`,
        variant: "danger",
        confirmText: "Excluir Definitivamente"
    });
    if (confirmou) await deleteDoc(doc(db, "contas_acesso", id));
  };

  const formatarNomeCurto = (nomeCompleto: string) => {
    if (!nomeCompleto) return "";
    const partes = nomeCompleto.trim().split(/\s+/);
    if (partes.length <= 2) return nomeCompleto;
    return `${partes[0]} ${partes[partes.length - 1]}`;
  };

  const getCargoColor = (c: string) => {
    const cargo = (c || "").toLowerCase();
    
    if (cargo.includes('dev') || cargo.includes('admin') || cargo.includes('apóstolo') || cargo.includes('apostolo')) 
        return "text-amber-600 bg-amber-50 border-amber-100 ring-amber-50"; 
    
    if (cargo.includes('pastor')) 
        return "text-blue-600 bg-blue-50 border-blue-100 ring-blue-50"; 
    
    if (cargo.includes('evangelista') || cargo.includes('presbítero') || cargo.includes('presbitero')) 
        return "text-indigo-600 bg-indigo-50 border-indigo-100 ring-indigo-50"; 
    
    if (cargo.includes('diácono') || cargo.includes('diacono') || cargo.includes('obreiro')) 
        return "text-cyan-600 bg-cyan-50 border-cyan-100 ring-cyan-50"; 
    
    if (cargo.includes('secretaria') || cargo.includes('midia') || cargo.includes('mídia')) 
        return "text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100 ring-fuchsia-50"; 
        
    return "text-emerald-600 bg-emerald-50 border-emerald-100 ring-emerald-50"; 
  };
  
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 mt-6 animate-in fade-in duration-500 font-sans">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-violet-50 text-violet-600 rounded-xl"><Users size={24} /></div>
        <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Gestão de Membresia</h2>
            <p className="text-sm text-slate-500 font-medium">Controle de acesso e cargos eclesiásticos</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={18} />
          <input 
            placeholder="Procurar por nome ou email..."
            className="w-full bg-white pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-violet-50 focus:border-violet-300 transition-all text-sm text-slate-700 font-medium placeholder:text-slate-400"
            onChange={e => setFiltro(e.target.value)}
          />
        </div>
        <button onClick={handleExport} className="w-full md:w-auto bg-white border border-slate-200 text-slate-600 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 px-5 py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider">
            <FileSpreadsheet size={16} /> Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filtrados.map(m => {
            const isDesligado = m.status === "Desligado";
            const cardClasses = isDesligado ? "bg-slate-50 border-slate-200 opacity-80" : "bg-white border-slate-100 hover:shadow-md hover:border-violet-100";
            const protegidoDoGerenciador = isGerenciador && isTargetProtected(m.cargo, m.permissao);

            return (
          <div key={m.id} className={`p-4 md:p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-center gap-6 group ${cardClasses}`}>
            <div className="relative flex-shrink-0">
                <img src={m.foto || "https://www.w3schools.com/howto/img_avatar.png"} className={`w-14 h-14 rounded-full object-cover border-2 ${isDesligado ? 'border-slate-200 grayscale' : 'border-white shadow-sm'}`} />
                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${isDesligado ? 'bg-slate-400' : 'bg-emerald-500'}`}></div>
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-1 w-full min-w-0">
              <div className="flex items-center justify-center md:justify-start gap-2">
                  <h3 className={`font-bold text-base truncate ${isDesligado ? 'text-slate-500 line-through decoration-slate-400' : 'text-slate-800'}`}>{formatarNomeCurto(m.nome)}</h3>
                  {isDesligado && <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">Desligado</span>}
                  
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${getCargoColor(m.cargo)}`}>
                      {m.cargo}
                  </span>
                  
                  {m.permissao && podeGerenciarPermissoes && <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1"><Shield size={8}/> {m.permissao}</span>}
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-2 md:gap-4 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5"><Mail size={12} className="text-slate-400"/> {m.email}</span>
                <span className="flex items-center gap-1.5"><Phone size={12} className="text-slate-400"/> {m.telefone || "N/A"}</span>
              </div>
            </div>

            {podeEditar && (
                <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto animate-in slide-in-from-right-4">
                
                <div className="relative w-full md:w-40 group/select">
                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none`}>
                        <Circle size={8} fill="currentColor" className={getCargoColor(m.cargo).split(' ')[0]} />
                    </div>
                    <select 
                        value={m.cargo}
                        disabled={isDesligado || protegidoDoGerenciador}
                        onChange={(e) => handleAlterarCargo(m.id, e.target.value, m.cargo, m.permissao)}
                        className={`w-full appearance-none pl-8 pr-8 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider outline-none border transition-all cursor-pointer shadow-sm ${isDesligado || protegidoDoGerenciador ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : `${getCargoColor(m.cargo)} hover:brightness-95`}`}
                    >
                        {cargosEclesiasticos.map(c => {
                            const cargoAdaptado = adaptarCargoAoGenero(c, m.genero); 
                            return <option key={c} value={cargoAdaptado} className="text-slate-700 bg-white py-1">{cargoAdaptado}</option>
                        })}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-current opacity-50"><ChevronDown size={14} /></div>
                </div>

                {podeGerenciarPermissoes && (
                    <div className="relative w-full md:w-40 group/select-perm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-500">
                            <Shield size={12} fill="currentColor" />
                        </div>
                        <select 
                            value={m.permissao || ""}
                            disabled={isDesligado}
                            onChange={(e) => handleAlterarPermissao(m.id, e.target.value)}
                            className={`w-full appearance-none pl-8 pr-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider outline-none border transition-all cursor-pointer shadow-sm ${m.permissao ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-amber-200'}`}
                        >
                            <option value="">Acesso Padrão</option>
                            {cargosSistema.map(c => <option key={c} value={c} className="text-slate-800 font-bold bg-white py-1">{c}</option>)}
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400"><Lock size={12} /></div>
                    </div>
                )}

                <div className="w-px h-8 bg-slate-100 hidden md:block"></div>

                <div className="flex gap-1">
                    {/* BOTÃO CARTEIRINHA ADICIONADO */}
                    <button 
                        onClick={() => setMembroSelecionado(m)} 
                        className="p-2.5 rounded-xl border border-transparent transition-all text-blue-500 hover:bg-blue-50 hover:border-blue-100"
                        title="Ver Carteirinha"
                    >
                        <CreditCard size={18} />
                    </button>

                    <button 
                        onClick={() => handleToggleStatus(m)} 
                        disabled={protegidoDoGerenciador}
                        className={`p-2.5 rounded-xl border border-transparent transition-all ${isDesligado ? 'text-emerald-500 hover:bg-emerald-50 hover:border-emerald-100' : 'text-amber-500 hover:bg-amber-50 hover:border-amber-100'} ${protegidoDoGerenciador ? 'opacity-30 cursor-not-allowed' : ''}`} 
                        title={isDesligado ? "Reativar Membro" : "Desligar Membro"}
                    >
                        {isDesligado ? <UserCheck size={18} /> : <UserMinus size={18} />}
                    </button>
                    <button 
                        onClick={() => excluirMembro(m.id, m.nome, m.cargo, m.permissao)} 
                        disabled={protegidoDoGerenciador}
                        className={`p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all ${protegidoDoGerenciador ? 'opacity-30 cursor-not-allowed' : ''}`} 
                        title="Excluir Permanentemente"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
                </div>
            )}
            
            {!podeEditar && (
                <div className="hidden md:flex items-center gap-2 opacity-50">
                    <Shield size={14} className="text-slate-300" />
                    <span className="text-[10px] uppercase font-bold text-slate-300">Modo Leitura</span>
                </div>
            )}

          </div>
        )})}
      </div>

      {/* MODAL DA CARTEIRINHA - CORRIGIDO O TAMANHO */}
      {membroSelecionado && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setMembroSelecionado(null)}>
            
            {/* CORREÇÃO: 
                1. Removido 'max-w-sm' que limitava a largura.
                2. Adicionado 'w-full max-w-[420px]' para garantir largura ideal.
                3. Adicionado 'flex flex-col' para organização.
            */}
            <div className="relative w-full max-w-[420px] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                
                {/* Botão Fechar - Reposicionado para cima e direita */}
                <button 
                    onClick={() => setMembroSelecionado(null)} 
                    className="absolute -top-12 right-0 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all border border-white/10"
                >
                    <X size={24} />
                </button>

                {/* Renderiza a Carteirinha com largura total do container */}
                <div className="w-full">
                    <MembershipCard user={membroSelecionado} />
                </div>
            </div>
        </div>
      )}

    </div>
  );
}