import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { CheckCircle2, XCircle, MessageSquare, ShieldAlert, HeartHandshake, LockKeyhole } from "lucide-react";
// Import do Modal
import { useConfirm } from "../context/ConfirmContext";

export default function PrayerManagement() {
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [notaEdicao, setNotaEdicao] = useState<{ [key: string]: string }>({});
    
    // Instância do Modal
    const { confirm } = useConfirm();

    // Busca pedidos pendentes e aprovados
    useEffect(() => {
        const q = query(collection(db, "pedidos_oracao"), orderBy("data", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            setPedidos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    const handleAprovar = async (id: string, nota: string) => {
        const confirmou = await confirm({
            title: "Tornar Público?",
            message: "Ao aprovar, este pedido aparecerá na página inicial do site. A nota pública será o único detalhe visível.",
            variant: "info",
            confirmText: "Sim, Aprovar",
            cancelText: "Cancelar"
        });

        if (!confirmou) return;

        try {
            await updateDoc(doc(db, "pedidos_oracao", id), {
                status: "aprovado",
                notaPublica: nota
            });
            
            await confirm({
                title: "Sucesso!",
                message: "Pedido aprovado e visível na Home.",
                variant: "success",
                confirmText: "Ok"
            });
        } catch (e) {
            alert("Erro ao aprovar.");
        }
    };

    const handleArquivar = async (id: string) => {
        const confirmou = await confirm({
            title: "Excluir Pedido?",
            message: "Tem certeza que deseja apagar este pedido de oração permanentemente?",
            variant: "danger",
            confirmText: "Sim, Excluir",
            cancelText: "Manter"
        });

        if(confirmou) {
            await deleteDoc(doc(db, "pedidos_oracao", id));
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500 mt-6">
            
            {/* HEADER DO MÓDULO */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                    <HeartHandshake size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Gestão de Intercessão</h2>
                    <p className="text-sm text-slate-500 font-medium">Aprovação e moderação de pedidos de oração</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {pedidos.map((p) => {
                    const isAprovado = p.status === 'aprovado';
                    
                    return (
                        <div key={p.id} className={`p-6 rounded-2xl border transition-all duration-200 hover:shadow-md flex flex-col lg:flex-row gap-6 ${isAprovado ? 'bg-white border-emerald-100 shadow-sm' : 'bg-white border-slate-100 shadow-sm'}`}>
                            
                            {/* COLUNA ESQUERDA: Conteúdo Privado */}
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg border ${isAprovado ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                        {isAprovado ? 'Visível na Home' : 'Pendente Aprovação'}
                                    </span>
                                    <h4 className="font-bold text-slate-800 text-base">{p.nome}</h4>
                                    <span className="text-xs text-slate-400 font-medium ml-auto">
                                        {p.data?.toDate ? new Date(p.data.toDate()).toLocaleDateString('pt-BR') : 'Data N/A'}
                                    </span>
                                </div>
                                
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <LockKeyhole size={12} className="text-slate-400"/> Conteúdo Íntimo (Privado)
                                    </p>
                                    <p className="text-slate-600 text-sm italic leading-relaxed">"{p.conteudo}"</p>
                                </div>
                            </div>

                            {/* COLUNA DIREITA: Ações de Moderação */}
                            <div className="w-full lg:w-[350px] flex flex-col gap-3 pt-4 lg:pt-0 lg:border-l lg:border-slate-50 lg:pl-6">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nota Pública (Opcional)</p>
                                    
                                    {/* CORREÇÃO DO ERRO AQUI: Envolver ShieldAlert num span */}
                                    {isAprovado && (
                                        <span title="Ativo no site" className="cursor-help">
                                            <ShieldAlert size={14} className="text-emerald-500" />
                                        </span>
                                    )}
                                </div>
                                
                                <textarea 
                                    placeholder="Ex: Pela saúde da família... (Se vazio, aparece genérico no site)"
                                    className="w-full bg-white p-3 rounded-xl text-sm text-slate-700 border border-slate-200 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all resize-none h-24 placeholder:text-slate-300"
                                    value={notaEdicao[p.id] !== undefined ? notaEdicao[p.id] : (p.notaPublica || "")}
                                    onChange={(e) => setNotaEdicao({...notaEdicao, [p.id]: e.target.value})}
                                />

                                <div className="flex gap-2 mt-auto">
                                    <button 
                                        onClick={() => handleArquivar(p.id)}
                                        className="px-3 py-2 rounded-xl border border-rose-100 text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                                        title="Excluir Permanentemente"
                                    >
                                        <XCircle size={20} />
                                    </button>
                                    
                                    {!isAprovado && (
                                        <button 
                                            onClick={() => handleAprovar(p.id, notaEdicao[p.id] || "")}
                                            className="flex-1 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 py-2.5 shadow-sm shadow-blue-200"
                                        >
                                            <CheckCircle2 size={16} /> Aprovar Publicação
                                        </button>
                                    )}
                                    
                                    {isAprovado && (
                                        <button 
                                            onClick={() => handleAprovar(p.id, notaEdicao[p.id] || p.notaPublica)}
                                            className="flex-1 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 py-2.5 shadow-sm shadow-emerald-200"
                                        >
                                            <MessageSquare size={16} /> Atualizar Nota
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {pedidos.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 border-dashed">
                        <HeartHandshake className="mx-auto text-slate-200 mb-4" size={48} />
                        <p className="text-slate-400 font-medium">Nenhum pedido de oração registrado.</p>
                    </div>
                )}
            </div>
        </div>
    );
}