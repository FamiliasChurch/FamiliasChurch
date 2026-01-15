import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { CreditCard, Check, Clock, Trash2, ShieldCheck, User, Search, X } from "lucide-react";
import { useConfirm } from "../context/ConfirmContext";
// Importar para enviar notificação ao membro
import { sendNotification } from "../lib/notificationService";

// Recebe userRole para validação de segurança interna
export default function CardRequests({ userRole }: { userRole: string }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { confirm } = useConfirm();

  // Regra de Permissão: Apenas Dev, Admin e Gerenciador
  const isAllowed = ["dev", "admin", "gerenciador"].includes(userRole?.toLowerCase());

  useEffect(() => {
    if (!isAllowed) {
        setLoading(false);
        return;
    }

    const q = query(collection(db, "solicitacoes_carteirinha"), orderBy("dataSolicitacao", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [isAllowed]);

  const updateStatus = async (req: any, newStatus: string) => {
    try {
        await updateDoc(doc(db, "solicitacoes_carteirinha", req.id), { status: newStatus });

        // SE FICOU PRONTO (APROVADO), AVISA O MEMBRO
        if (newStatus === "Pronto" && req.email) {
            // CORREÇÃO AQUI: A ordem dos argumentos mudou no notificationService
            // Agora é: (email, titulo, mensagem, LINK, tipo)
            await sendNotification(
                req.email,
                "Carteirinha Aprovada!",
                `Olá ${req.nome}, sua solicitação de credencial foi aprovada.`,
                "/perfil", // Link agora vem antes
                "aviso"    // Tipo agora é o último
            );
        }

    } catch (e) { console.error(e); }
  };

  const handleDelete = async (req: any) => {
    const confirmou = await confirm({
      title: "Excluir Solicitação",
      message: `Deseja remover o pedido de ${req.nome}?`,
      variant: "danger",
      confirmText: "Excluir",
      cancelText: "Cancelar"
    });

    if (confirmou) {
      await deleteDoc(doc(db, "solicitacoes_carteirinha", req.id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pendente": return "bg-slate-100 text-slate-600 border-slate-200";
      case "Em Produção": return "bg-blue-50 text-blue-600 border-blue-100"; 
      case "Pronto": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      default: return "bg-slate-50 text-slate-400 border-slate-100";
    }
  };

  // Filtragem local
  const filteredRequests = requests.filter(req => 
    req.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAllowed) return null;

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin w-8 h-8 border-b-2 border-blue-600 rounded-full"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans mt-6">
      
      {/* HEADER + PESQUISA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Solicitações de Validação</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Gerencie a aprovação das credenciais digitais.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative group w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                    placeholder="Buscar por nome..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-300 transition-all text-sm font-medium"
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X size={14} />
                    </button>
                )}
            </div>
            <div className="hidden md:flex px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-black uppercase tracking-widest items-center gap-2 whitespace-nowrap">
                <CreditCard size={16} />
                <span>{requests.length} Total</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredRequests.map((req) => (
          <div key={req.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            
            <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[9px] font-black uppercase tracking-widest border-l border-b ${getStatusColor(req.status)}`}>
                {req.status === 'Pronto' ? 'APROVADO' : req.status.toUpperCase()}
            </div>

            <div className="flex items-center gap-3 mb-4 mt-2">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 font-bold text-xs uppercase shrink-0">
                  <User size={18} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-800 text-sm truncate">{req.nome}</h4>
                  <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest">{req.cargo}</p>
                </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400 font-bold uppercase tracking-wider">RA</span>
                <span className="font-mono font-bold text-slate-600">{req.ra}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Data</span>
                <span className="text-slate-600 font-medium">
                    {req.dataSolicitacao?.toDate().toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
            
            <div className="pt-4 flex gap-2">
                
                {/* Botão Aprovar (Só se não estiver pronto) */}
                {req.status !== 'Pronto' && (
                    <button 
                        onClick={() => updateStatus(req, "Pronto")}
                        className="flex-1 py-2.5 rounded-xl flex items-center justify-center transition-colors bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold text-[10px] uppercase"
                    >
                        <Check size={14} className="mr-1"/> Aprovar
                    </button>
                )}

                <button 
                    onClick={() => handleDelete(req)} 
                    className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100"
                    title="Excluir Pedido"
                >
                    <Trash2 size={16} />
                </button>
            </div>

          </div>
        ))}

        {filteredRequests.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
            <ShieldCheck size={48} className="mb-4 opacity-20" />
            <p className="text-xs font-black uppercase tracking-widest">
                {searchTerm ? "Nenhum resultado encontrado" : "Nenhuma solicitação pendente"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}