import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { CheckCircle2, XCircle, MessageSquare, ShieldAlert, HeartHandshake, LockKeyhole, Trash2 } from "lucide-react";
import { useConfirm } from "../context/ConfirmContext";
import { notifyRoles, GROUPS, logNotificationBatch } from "../lib/notificationService";

export default function PrayerManagement() {
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [notaEdicao, setNotaEdicao] = useState<{ [key: string]: string }>({});
    
    const { confirm } = useConfirm();

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
            message: "Ao aprovar, este pedido aparecerá na página inicial. Apenas a nota pública será visível.",
            confirmText: "Sim, Aprovar",
            cancelText: "Cancelar"
        });

        if (!confirmou) return;

        try {
            await updateDoc(doc(db, "pedidos_oracao", id), {
                status: "aprovado",
                notaPublica: nota
            });

            // Notifica
            await notifyRoles(GROUPS.ORACAO, "Pedido de Oração Aprovado", "Um pedido foi moderado e está visível.", "devocional", "/admin");
            logNotificationBatch("Pedido Oração Aprovado", 1, "Sucesso");
            
        } catch (e) { console.error(e); }
    };

    const handleArquivar = async (id: string) => {
        const confirmou = await confirm({
            title: "Excluir Pedido?",
            message: "Tem certeza que deseja apagar este pedido permanentemente?",
            variant: "danger",
            confirmText: "Sim, Excluir",
            cancelText: "Cancelar"
        });

        if(confirmou) await deleteDoc(doc(db, "pedidos_oracao", id));
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><HeartHandshake size={24} /></div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Gestão de Intercessão</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Pedidos no Altar: {pedidos.length}</p>
                </div>
            </div>

            <div className="grid gap-4">
                {pedidos.map(p => {
                    const isAprovado = p.status === 'aprovado';
                    return (
                        <div key={p.id} className={`bg-white p-6 rounded-3xl border shadow-sm transition-all flex flex-col lg:flex-row gap-6 ${isAprovado ? 'border-emerald-100' : 'border-slate-100'}`}>
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-slate-800 text-base">{p.nome}</h3>
                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${isAprovado ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{p.status}</span>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><LockKeyhole size={12}/> Conteúdo Privado</p>
                                    <p className="text-slate-600 text-sm italic leading-relaxed">"{p.conteudo}"</p>
                                </div>
                            </div>

                            <div className="w-full lg:w-[350px] flex flex-col gap-3 pt-4 lg:pt-0 lg:border-l lg:border-slate-50 lg:pl-6">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nota Pública</p>
                                <textarea 
                                    placeholder="Ex: Pela saúde da família... (Obrigatório para aprovar)"
                                    className="w-full bg-white p-3 rounded-xl text-sm text-slate-700 border border-slate-200 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all resize-none h-24 placeholder:text-slate-300"
                                    value={notaEdicao[p.id] !== undefined ? notaEdicao[p.id] : (p.notaPublica || "")}
                                    onChange={(e) => setNotaEdicao({...notaEdicao, [p.id]: e.target.value})}
                                />
                                <div className="flex gap-2 mt-auto">
                                    <button onClick={() => handleArquivar(p.id)} className="px-3 py-2 rounded-xl border border-rose-100 text-rose-500 hover:bg-rose-50 transition-colors"><Trash2 size={20} /></button>
                                    <button 
                                        onClick={() => handleAprovar(p.id, notaEdicao[p.id] || p.notaPublica)}
                                        className={`flex-1 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-2 py-2.5 ${isAprovado ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                    >
                                        {isAprovado ? <><MessageSquare size={16}/> Atualizar Nota</> : <><CheckCircle2 size={16}/> Aprovar</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
                {pedidos.length === 0 && <div className="text-center py-10 text-slate-400">Nenhum pedido de oração.</div>}
            </div>
        </div>
    );
}