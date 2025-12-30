import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, doc, updateDoc, query, orderBy, deleteDoc } from "firebase/firestore";
import { Users, Search, Mail, Phone, Trash2, Shield, ChevronDown, Download, FileSpreadsheet } from "lucide-react";
import { useConfirm } from "../context/ConfirmContext";

interface MembersProps {
  currentUserRole: string;
}

export default function MembersManagement({ currentUserRole }: MembersProps) {
  const [membros, setMembros] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("");
  
  const cargos = [
    "Dev", "Apóstolo", "Pastor", "Evangelista", "Presbítero", 
    "Diácono", "Obreiro", "Servo", "Secretaria", "Mídia", "Membro"
  ];

  const { confirm } = useConfirm();
  const altoEscalao = ["Dev", "Apóstolo", "Pastor"];

  useEffect(() => {
    const q = query(collection(db, "contas_acesso"), orderBy("nome", "asc"));
    return onSnapshot(q, (snap) => {
      setMembros(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // --- FUNÇÃO DE EXPORTAÇÃO ---
  const handleExport = () => {
    if (filtrados.length === 0) {
      alert("Nenhum dado para exportar.");
      return;
    }

    const headers = ["Nome", "Email", "Telefone", "Cargo", "Sexo", "Nascimento", "ID"];
    const rows = filtrados.map(m => [
      `"${m.nome || ""}"`,
      `"${m.email || ""}"`,
      `"${m.telefone || ""}"`,
      `"${m.cargo || ""}"`,
      `"${m.sexo || ""}"`,
      `"${m.nascimento || ""}"`,
      `"${m.id}"`
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

  const handleAlterarCargo = async (id: string, novoCargo: string, cargoAtualMembro: string) => {
    // Lógica de Proteção da Secretaria
    if (currentUserRole === "Secretaria") {
        if (altoEscalao.includes(cargoAtualMembro)) {
            await confirm({
                title: "Acesso Negado",
                message: `A Secretaria não tem permissão para alterar o cargo de um ${cargoAtualMembro}. Contate o Apóstolo ou Dev.`,
                variant: "danger",
                confirmText: "Entendi",
                cancelText: "Fechar"
            });
            return;
        }
        if (altoEscalao.includes(novoCargo)) {
            await confirm({
                title: "Promoção Não Permitida",
                message: `A Secretaria não pode promover membros para o cargo de ${novoCargo}.`,
                variant: "danger",
                confirmText: "Entendi",
                cancelText: "Fechar"
            });
            return;
        }
    }

    const confirmou = await confirm({
        title: "Alterar Cargo",
        message: `Deseja realmente alterar o cargo deste membro para ${novoCargo}?`,
        variant: "info",
        confirmText: "Sim, Alterar",
        cancelText: "Cancelar"
    });

    if (!confirmou) return;
    
    try {
        await updateDoc(doc(db, "contas_acesso", id), { cargo: novoCargo });
    } catch (error) {
        await confirm({
            title: "Erro",
            message: "Não foi possível atualizar o cargo.",
            variant: "danger",
            confirmText: "Ok"
        });
    }
  };

  const excluirMembro = async (id: string, nome: string, cargoAtualMembro: string) => {
    if (currentUserRole === "Secretaria" && altoEscalao.includes(cargoAtualMembro)) {
        await confirm({
            title: "Exclusão Proibida",
            message: `A Secretaria não pode excluir um ${cargoAtualMembro} do sistema.`,
            variant: "danger",
            confirmText: "Entendi",
            cancelText: "Fechar"
        });
        return;
    }

    const confirmou = await confirm({
        title: "Excluir Membro?",
        message: `Tem certeza que deseja remover ${nome} permanentemente? Essa ação é irreversível.`,
        variant: "danger",
        confirmText: "Sim, Excluir",
        cancelText: "Manter Membro"
    });

    if (!confirmou) return;

    try {
      await deleteDoc(doc(db, "contas_acesso", id));
    } catch (e) {
       await confirm({
            title: "Erro",
            message: "Erro ao excluir membro. Tente novamente.",
            variant: "danger",
            confirmText: "Ok"
        });
    }
  };

  const formatarNomeCurto = (nomeCompleto: string) => {
    if (!nomeCompleto) return "";
    const partes = nomeCompleto.trim().split(/\s+/);
    if (partes.length <= 2) return nomeCompleto;
    return `${partes[0]} ${partes[partes.length - 1]}`;
  };
  
  const filtrados = membros.filter(m => m.nome?.toLowerCase().includes(filtro.toLowerCase()) || m.email?.toLowerCase().includes(filtro.toLowerCase()));

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 mt-6 animate-in fade-in duration-500 font-sans">
      
      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
            <Users size={24} />
        </div>
        <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Gestão de Membresia</h2>
            <p className="text-sm text-slate-500 font-medium">Controle de acesso e cargos eclesiásticos</p>
        </div>
      </div>

      {/* TOOLBAR (BUSCA & EXPORT) */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        {/* INPUT DE BUSCA */}
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={18} />
          <input 
            placeholder="Procurar por nome ou email..."
            className="w-full bg-white pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-violet-50 focus:border-violet-300 transition-all text-sm text-slate-700 font-medium placeholder:text-slate-400"
            onChange={e => setFiltro(e.target.value)}
          />
        </div>

        {/* BOTÃO DE EXPORTAR */}
        <button 
            onClick={handleExport}
            className="w-full md:w-auto bg-white border border-slate-200 text-slate-600 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 px-5 py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider"
            title="Exportar dados para Excel/CSV"
        >
            <FileSpreadsheet size={16} />
            Exportar CSV
        </button>
      </div>

      {/* LISTA DE MEMBROS */}
      <div className="grid grid-cols-1 gap-3">
        {filtrados.map(m => (
          <div key={m.id} className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-6 group">
            
            {/* Avatar & Status */}
            <div className="relative flex-shrink-0">
                <img src={m.foto || "https://www.w3schools.com/howto/img_avatar.png"} className="w-14 h-14 rounded-full object-cover border border-slate-100 bg-slate-50" />
                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${['Dev', 'Apóstolo', 'Pastor'].includes(m.cargo) ? 'bg-violet-500' : 'bg-emerald-500'}`}></div>
            </div>
            
            {/* Info Texto */}
            <div className="flex-1 text-center md:text-left space-y-1 w-full min-w-0">
              <h3 className="font-bold text-base text-slate-800 truncate">{formatarNomeCurto(m.nome)}</h3>
              <div className="flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-2 md:gap-4 text-xs text-slate-500 font-medium">
                <span className="flex items-center justify-center md:justify-start gap-1.5"><Mail size={12} className="text-slate-400"/> {m.email}</span>
                <span className="flex items-center justify-center md:justify-start gap-1.5"><Phone size={12} className="text-slate-400"/> {m.telefone || "N/A"}</span>
              </div>
            </div>

            {/* Ações (Cargo & Delete) */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-center">
              
              <div className="relative group/select w-full md:w-48">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                    <Shield size={14} />
                </div>
                <select 
                    value={m.cargo}
                    onChange={(e) => handleAlterarCargo(m.id, e.target.value, m.cargo)}
                    className={`
                        w-full appearance-none pl-9 pr-8 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider outline-none border transition-all cursor-pointer
                        ${['Dev', 'Apóstolo'].includes(m.cargo) ? 'bg-violet-50 text-violet-700 border-violet-100 hover:border-violet-300' : ''}
                        ${['Pastor', 'Secretaria'].includes(m.cargo) ? 'bg-blue-50 text-blue-700 border-blue-100 hover:border-blue-300' : ''}
                        ${!['Dev', 'Apóstolo', 'Pastor', 'Secretaria'].includes(m.cargo) ? 'bg-white text-slate-600 border-slate-200 hover:border-slate-300' : ''}
                    `}
                >
                    {cargos.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 group-hover/select:text-slate-600">
                    <ChevronDown size={14} />
                </div>
              </div>

              <div className="w-px h-8 bg-slate-100 hidden md:block"></div>

              <button 
                onClick={() => excluirMembro(m.id, m.nome, m.cargo)}
                className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all"
                title="Excluir Membro"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {filtrados.length === 0 && (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 border-dashed">
                <Users className="mx-auto text-slate-200 mb-3" size={40} />
                <p className="text-slate-400 text-sm font-medium">Nenhum membro encontrado.</p>
            </div>
        )}
      </div>
    </div>
  );
}