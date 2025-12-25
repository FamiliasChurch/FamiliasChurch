import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { ShieldCheck, AlertTriangle, Scale, RefreshCw } from "lucide-react";

export default function AuditPanel({ totalAtivo }: { totalAtivo: number }) {
  const [ultimoBackup, setUltimoBackup] = useState<any>(null);
  const [diferenca, setDiferenca] = useState(0);

  useEffect(() => {
    // Busca os metadados do último backup realizado
    const q = query(collection(db, "backup_metadata"), orderBy("criadoEm", "desc"), limit(1));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setUltimoBackup(data);
        // Cálculo da discrepância: $D = V_{ativo} - V_{backup}$
        setDiferenca(totalAtivo - data.valorTotalNoMomento);
      }
    });
    return () => unsub();
  }, [totalAtivo]);

  return (
    <div className="glass p-10 rounded-[3rem] border border-white/5 space-y-8 mt-10">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Scale className="text-destaque" size={28} />
          <h2 className="text-3xl font-black uppercase tracking-tighter">Auditoria de Dados</h2>
        </div>
        <div className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${diferenca === 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {diferenca === 0 ? "Integridade Confirmada" : "Discrepância Detectada"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Comparação Visual */}
        <div className="space-y-4">
          <div className="flex justify-between text-[10px] uppercase font-bold text-white/30">
            <span>Valor em Backup ({ultimoBackup?.dataBackup})</span>
            <span className="text-white">R$ {ultimoBackup?.valorTotalNoMomento.toLocaleString('pt-BR')}</span>
          </div>
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
            <div className="bg-destaque h-full transition-all" style={{ width: '100%' }} />
          </div>
          
          <div className="flex justify-between text-[10px] uppercase font-bold text-white/30">
            <span>Valor em Tempo Real (Sede FRG)</span>
            <span className="text-destaque">R$ {totalAtivo.toLocaleString('pt-BR')}</span>
          </div>
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
            <div className={`h-full transition-all ${diferenca === 0 ? 'bg-destaque' : 'bg-red-500'}`} 
                 style={{ width: `${(totalAtivo / (ultimoBackup?.valorTotalNoMomento || 1)) * 100}%` }} />
          </div>
        </div>

        {/* Status de Auditoria */}
        <div className="glass bg-white/5 p-6 rounded-[2rem] border border-white/5 flex flex-col justify-center items-center text-center space-y-4">
          {diferenca === 0 ? (
            <>
              <ShieldCheck className="text-green-400" size={48} />
              <p className="text-xs text-white/60 leading-relaxed italic">
                Os dados ativos em **Fazenda Rio Grande** estão sincronizados com o backup oficial.
              </p>
            </>
          ) : (
            <>
              <AlertTriangle className="text-red-500" size={48} />
              <p className="text-xs text-red-400 font-bold uppercase tracking-tighter">
                Atenção: Diferença de R$ {diferenca.toLocaleString('pt-BR')} detectada!
              </p>
              <button className="text-[9px] font-black uppercase text-destaque hover:underline flex items-center gap-2">
                <RefreshCw size={12} /> Solicitar Reconciliação
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}