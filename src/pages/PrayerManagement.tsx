import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, where } from "firebase/firestore";
import { CheckCircle2, XCircle, MessageSquare, ShieldAlert, HeartHandshake } from "lucide-react";

export default function PrayerManagement() {
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [notaEdicao, setNotaEdicao] = useState<{ [key: string]: string }>({});

    // Busca pedidos pendentes e aprovados
    useEffect(() => {
        const q = query(collection(db, "pedidos_oracao"), orderBy("data", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            setPedidos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    const handleAprovar = async (id: string, nota: string) => {
        try {
            await updateDoc(doc(db, "pedidos_oracao", id), {
                status: "aprovado",
                notaPublica: nota // Salva o detalhe que aparecerá na Home
            });
            alert("Pedido aprovado e visível na Home!");
        } catch (e) {
            alert("Erro ao aprovar.");
        }
    };

    const handleArquivar = async (id: string) => {
        if(confirm("Deseja remover este pedido?")) {
            await deleteDoc(doc(db, "pedidos_oracao", id));
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20 p-6">
            <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
                <div className="p-3 bg-blue-900 text-white rounded-2xl shadow-lg"><HeartHandshake size={24} /></div>
                <div>
                    <h2 className="text-3xl font-display font-bold text-slate-800 uppercase italic">Gestão de Intercessão</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Aprovação de Pedidos Públicos</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {pedidos.map((p) => (
                    <div key={p.id} className={`p-6 rounded-[2rem] border shadow-sm flex flex-col md:flex-row gap-6 ${p.status === 'aprovado' ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                        
                        {/* Conteúdo Privado (Só o pastor vê) */}
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${p.status === 'aprovado' ? 'bg-green-200 text-green-800' : 'bg-amber-100 text-amber-700'}`}>
                                    {p.status === 'aprovado' ? 'Visível na Home' : 'Pendente Aprovação'}
                                </span>
                                <h4 className="font-bold text-slate-800 text-lg">{p.nome}</h4>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <ShieldAlert size={12}/> Conteúdo Íntimo (Não público)
                                </p>
                                <p className="text-slate-600 italic">"{p.conteudo}"</p>
                            </div>
                        </div>

                        {/* Ações de Aprovação */}
                        <div className="w-full md:w-1/3 flex flex-col gap-3 bg-white p-4 rounded-3xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalhe Público (Opcional)</p>
                            
                            <textarea 
                                placeholder="Ex: Pela saúde da família... (Se vazio, aparece genérico)"
                                className="w-full bg-slate-50 p-3 rounded-xl text-xs border border-slate-200 outline-none focus:border-blue-300 resize-none h-20"
                                value={notaEdicao[p.id] || p.notaPublica || ""}
                                onChange={(e) => setNotaEdicao({...notaEdicao, [p.id]: e.target.value})}
                            />

                            <div className="flex gap-2 mt-auto">
                                <button 
                                    onClick={() => handleArquivar(p.id)}
                                    className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                    title="Excluir"
                                >
                                    <XCircle size={20} />
                                </button>
                                
                                {p.status !== 'aprovado' && (
                                    <button 
                                        onClick={() => handleAprovar(p.id, notaEdicao[p.id] || "")}
                                        className="flex-1 bg-blue-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 size={16} /> Aprovar
                                    </button>
                                )}
                                
                                {p.status === 'aprovado' && (
                                    <button 
                                        onClick={() => handleAprovar(p.id, notaEdicao[p.id] || p.notaPublica)}
                                        className="flex-1 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <MessageSquare size={16} /> Atualizar Nota
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}