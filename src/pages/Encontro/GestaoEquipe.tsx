import { useState, useEffect } from "react";
import { db, auth } from "../../lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import { 
    Shield, Search, User, Loader2, Save, 
    Stethoscope, Wallet, Crown, MapPin, Check, X
} from "lucide-react";

export default function GestaoEquipe() {
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState("");
    const [currentUserEmail, setCurrentUserEmail] = useState("");

    // Lista de cargos disponíveis para o Encontro
    const CARGOS_ENCONTRO = [
        { id: "Coordenador", label: "Coordenação", icon: Crown, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
        { id: "Financeiro", label: "Financeiro", icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
        { id: "Saude", label: "Saúde", icon: Stethoscope, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
        { id: "Recepcao", label: "Recepção", icon: MapPin, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
    ];

    useEffect(() => {
        const unsub = auth.onAuthStateChanged(u => {
            if (u) setCurrentUserEmail(u.email || "");
        });
        return () => unsub();
    }, []);

    // Busca todos os usuários do sistema em tempo real
    useEffect(() => {
        const q = query(collection(db, "contas_acesso"), orderBy("nome"));
        const unsub = onSnapshot(q, (snap) => {
            setUsuarios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // Função para alternar cargo (Adiciona ou Remove do Array)
    const toggleCargo = async (userId: string, cargo: string, permissoesAtuais: string[]) => {
        // Proteção: Não permite remover o próprio cargo de Admin/Dev para não se trancar fora
        if (userId === currentUserEmail && cargo === "Coordenador") {
            alert("Você não pode remover sua própria permissão de Coordenador por aqui.");
            return;
        }

        const ref = doc(db, "contas_acesso", userId);
        let novasPermissoes;

        if (permissoesAtuais.includes(cargo)) {
            // Remove
            novasPermissoes = permissoesAtuais.filter(p => p !== cargo);
        } else {
            // Adiciona
            novasPermissoes = [...permissoesAtuais, cargo];
        }

        try {
            await updateDoc(ref, { permissaoEncontro: novasPermissoes });
        } catch (error) {
            console.error("Erro ao atualizar permissão:", error);
            alert("Erro ao atualizar permissão. Verifique se você é Admin.");
        }
    };

    const listaFiltrada = usuarios.filter(u => 
        u.nome?.toLowerCase().includes(filtro.toLowerCase()) || 
        u.email?.toLowerCase().includes(filtro.toLowerCase())
    );

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8 font-sans">
            
            {/* Header */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <Shield className="text-blue-600" /> Gestão da Equipe
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Defina quem acessa o painel do Encontro.</p>
                </div>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input 
                        type="text" 
                        placeholder="Buscar membro..." 
                        value={filtro}
                        onChange={e => setFiltro(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 p-4 pl-12 rounded-2xl outline-none focus:border-blue-400 text-sm font-bold text-slate-700 transition-all" 
                    />
                </div>
            </div>

            {/* Lista de Usuários */}
            <div className="grid grid-cols-1 gap-4">
                {listaFiltrada.map(user => {
                    // Garante que é sempre um array
                    const userPerms = Array.isArray(user.permissaoEncontro) ? user.permissaoEncontro : [];
                    
                    return (
                        <div key={user.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row items-center justify-between gap-6">
                            
                            {/* Info do Usuário */}
                            <div className="flex items-center gap-4 w-full lg:w-1/3">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-lg uppercase border-2 border-white shadow-sm">
                                    {user.foto ? <img src={user.foto} className="w-full h-full rounded-full object-cover"/> : user.nome?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">{user.nome}</h3>
                                    <p className="text-[10px] font-mono text-slate-400">{user.email}</p>
                                    <span className="inline-block mt-1 px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-black uppercase rounded border border-slate-200">
                                        {user.cargo || "Membro"}
                                    </span>
                                </div>
                            </div>

                            {/* Botões de Cargos (Toggle) */}
                            <div className="flex flex-wrap gap-2 justify-end w-full lg:w-2/3">
                                {CARGOS_ENCONTRO.map((cargo) => {
                                    const ativo = userPerms.includes(cargo.id);
                                    return (
                                        <button
                                            key={cargo.id}
                                            onClick={() => toggleCargo(user.id, cargo.id, userPerms)}
                                            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all duration-200 
                                                ${ativo 
                                                    ? `${cargo.bg} ${cargo.border} ${cargo.color} shadow-sm scale-105` 
                                                    : 'bg-white border-slate-100 text-slate-300 hover:border-slate-200 grayscale'
                                                }`}
                                        >
                                            <cargo.icon size={14} />
                                            {cargo.label}
                                            {ativo ? <Check size={12} className="ml-1"/> : <span className="w-3"/>}
                                        </button>
                                    );
                                })}
                            </div>

                        </div>
                    );
                })}
                
                {listaFiltrada.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        <User size={48} className="mx-auto mb-2 opacity-20" />
                        <p>Nenhum usuário encontrado.</p>
                    </div>
                )}
            </div>
        </div>
    );
}