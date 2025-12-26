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
        // Cálculo da discrepância: D = V_ativo - V_backup
        setDiferenca(totalAtivo - data.valorTotalNoMomento);
      }
    });
    return () => unsub();
  }, [totalAtivo]);

  return (
    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8 mt-10 transition-all">
      {/* HEADER DO PAINEL */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <Scale className="text-primaria" size={28} />
          <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
            Auditoria de Dados
          </h2>
        </div>
        <div className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
          diferenca === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {diferenca === 0 ? "Integridade Confirmada" : "Discrepância Detectada"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* COMPARAÇÃO VISUAL - Cores de alto contraste */}
        <div className="space-y-4">
          <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500">
            <span>Valor em Backup ({ultimoBackup?.dataBackup || '--/--'})</span>
            <span className="text-gray-900 font-black">
              R$ {ultimoBackup?.valorTotalNoMomento.toLocaleString('pt-BR') || '0,00'}
            </span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div className="bg-gray-400 h-full transition-all" style={{ width: '100%' }} />
          </div>
          
          <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500">
            <span>Valor em Tempo Real (Sede FRG)</span>
            <span className="text-primaria font-black">
              R$ {totalAtivo.toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${diferenca === 0 ? 'bg-primaria' : 'bg-red-600'}`} 
              style={{ width: `${Math.min((totalAtivo / (ultimoBackup?.valorTotalNoMomento || 1)) * 100, 100)}%` }} 
            />
          </div>
        </div>

        {/* STATUS DE AUDITORIA - Box Neutro */}
        <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 flex flex-col justify-center items-center text-center space-y-4">
          {diferenca === 0 ? (
            <>
              <ShieldCheck className="text-green-600" size={48} />
              <p className="text-xs text-gray-600 leading-relaxed italic">
                Os dados ativos em **Fazenda Rio Grande** estão sincronizados com o backup oficial.
              </p>
            </>
          ) : (
            <>
              <AlertTriangle className="text-red-600" size={48} />
              <p className="text-xs text-red-600 font-bold uppercase tracking-tighter">
                Atenção: Diferença de R$ {diferenca.toLocaleString('pt-BR')} detectada!
              </p>
              <button className="text-[9px] font-black uppercase text-primaria hover:underline flex items-center gap-2 transition-all">
                <RefreshCw size={12} /> Solicitar Reconciliação
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}