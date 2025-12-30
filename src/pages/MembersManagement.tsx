import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, doc, updateDoc, query, orderBy, deleteDoc } from "firebase/firestore";
import { Users, Search, Mail, Phone, Trash2, Shield, ChevronDown, Download } from "lucide-react"; // Adicionei Download
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

    // 1. Cabeçalho do CSV
    const headers = ["Nome", "Email", "Telefone", "Cargo", "Sexo", "Nascimento", "ID"];

    // 2. Mapear os dados (usamos 'filtrados' para respeitar a busca atual)
    const rows = filtrados.map(m => [
      `"${m.nome || ""}"`, // Aspas evitam quebra se tiver vírgula no nome
      `"${m.email || ""}"`,
      `"${m.telefone || ""}"`,
      `"${m.cargo || ""}"`,
      `"${m.sexo || ""}"`,
      `"${m.nascimento || ""}"`,
      `"${m.id}"`
    ]);

    // 3. Juntar tudo numa string CSV
    const csvContent = [
      headers.join(","), 
      ...rows.map(r => r.join(","))
    ].join("\n");

    // 4. Criar o Blob e link de download
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
    // --- Lógica de Proteção da Secretaria ---
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-display font-bold text-slate-800 uppercase flex items-center gap-3">
            <Users className="text-blue-600" /> Gestão de Membresia
        </h2>
        
        <div className="flex gap-2 w-full md:w-auto">
            {/* INPUT DE BUSCA */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                placeholder="Procurar por nome ou email..."
                className="w-full bg-white border border-slate-200 p-3 pl-12 rounded-xl outline-none focus:border-blue-500 shadow-sm transition-all"
                onChange={e => setFiltro(e.target.value)}
              />
            </div>

            {/* BOTÃO DE EXPORTAR */}
            <button 
                onClick={handleExport}
                className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 p-3 rounded-xl shadow-sm transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-wider"
                title="Exportar dados para Excel/CSV"
            >
                <Download size={18} />
                <span className="hidden md:inline">Exportar</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtrados.map(m => (
          <div key={m.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row items-center gap-6 group">
            
            <div className="relative">
                <img src={m.foto || "https://www.w3schools.com/howto/img_avatar.png"} className="w-16 h-16 rounded-full object-cover border-4 border-blue-50" />
                <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${m.cargo === 'Dev' || m.cargo === 'Apóstolo' ? 'bg-purple-500' : 'bg-green-500'}`}></div>
            </div>
            
            <div className="flex-1 text-center lg:text-left space-y-1">
              <h3 className="font-bold text-lg text-slate-800">{formatarNomeCurto(m.nome)}</h3>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1"><Mail size={12}/> {m.email}</span>
                <span className="flex items-center gap-1"><Phone size={12}/> {m.telefone || "Sem Tel"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto justify-center">
              
              <div className="relative group/select">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                    <Shield size={14} />
                </div>
                <select 
                    value={m.cargo}
                    onChange={(e) => handleAlterarCargo(m.id, e.target.value, m.cargo)}
                    className={`
                        appearance-none pl-9 pr-10 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider outline-none border transition-all cursor-pointer
                        ${m.cargo === 'Dev' || m.cargo === 'Apóstolo' ? 'bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-400' : ''}
                        ${m.cargo === 'Pastor' || m.cargo === 'Secretaria' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400' : ''}
                        ${!['Dev', 'Apóstolo', 'Pastor', 'Secretaria'].includes(m.cargo) ? 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400' : ''}
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

              <div className="w-px h-8 bg-slate-100 mx-2"></div>

              <button 
                onClick={() => excluirMembro(m.id, m.nome, m.cargo)}
                className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="Excluir Membro"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}