import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { CheckCircle, XCircle, Eye, Loader2, DollarSign } from "lucide-react";

export default function AdminAudit() {
  const [pendentes, setPendentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca apenas o que está "Pendente" no Firestore
    const q = query(collection(db, "registros_dizimos"), where("status", "==", "Pendente"));
    
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPendentes(docs);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const aprovarSemente = async (id: string) => {
    const docRef = doc(db, "registros_dizimos", id);
    await updateDoc(docRef, { status: "Aprovado" });
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-destaque" /></div>;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-4">
        <DollarSign className="text-destaque" size={32} />
        <h2 className="text-4xl font-black uppercase tracking-tighter">Auditoria de Sementes</h2>
      </div>

      <div className="grid gap-4">
        {pendentes.length === 0 ? (
          <p className="text-white/40 italic">Nenhum registro pendente para conferência.</p>
        ) : (
          pendentes.map(item => (
            <div key={item.id} className="glass p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-left">
                <p className="text-[10px] uppercase font-black text-destaque mb-1">{item.tipo}</p>
                <h3 className="text-xl font-bold leading-none mb-2">{item.nome}</h3>
                <p className="text-2xl font-mono text-white/80">R$ {item.valor.toFixed(2)}</p>
              </div>

              <div className="flex items-center gap-3">
                {/* Link para o Tesoureiro abrir o arquivo que o membro enviou */}
                <a 
                  href={item.comprovanteUrl} 
                  target="_blank" 
                  className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors flex items-center gap-2 text-[10px] font-bold uppercase"
                >
                  <Eye size={16} /> Ver Comprovante
                </a>

                <button 
                  onClick={() => aprovarSemente(item.id)}
                  className="p-4 bg-destaque text-black rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-[10px] font-bold uppercase"
                >
                  <CheckCircle size={16} /> Aprovar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}