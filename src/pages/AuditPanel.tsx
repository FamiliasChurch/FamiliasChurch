import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { ShieldCheck, AlertTriangle, Scale, RefreshCw, Download, FileSpreadsheet } from "lucide-react";

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
        setDiferenca(totalAtivo - Number(data.valorTotalNoMomento || 0));
      }
    });
    return () => unsub();
  }, [totalAtivo]);

  // --- FUNÇÃO DE EXPORTAÇÃO (Mantida Original) ---
  const exportarRelatorio = () => {
    if (!ultimoBackup) return alert("Aguarde o carregamento dos dados de backup.");

    const dataAtual = new Date().toLocaleString("pt-BR");
    const status = diferenca === 0 ? "INTEGRO" : "DIVERGENTE";

    const headers = ["METRICA;VALOR;DETALHES;DATA_VERIFICACAO"];
    const rows = [
      `STATUS_GERAL;${status};${diferenca === 0 ? "Sincronizado" : "Requer Atencao"};${dataAtual}`,
      `VALOR_BACKUP;${ultimoBackup.valorTotalNoMomento};Referencia Backup: ${ultimoBackup.dataBackup || 'N/A'};${dataAtual}`,
      `VALOR_REALTIME;${totalAtivo};Origem: Banco de Dados Ativo;${dataAtual}`,
      `DISCREPANCIA;${diferenca};${diferenca === 0 ? "Zero" : "Valor Pendente"};${dataAtual}`
    ];

    const csvContent = "\uFEFF" + headers.concat(rows).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `auditoria_financeira_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
      
      {/* HEADER DO PAINEL */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-100 pb-6 mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
             <Scale size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                Auditoria de Dados
            </h2>
            <p className="text-sm text-slate-500 font-medium">
                Painel de Integridade Financeira
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
            {/* BOTÃO DE EXPORTAR */}
            <button 
                onClick={exportarRelatorio}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wide hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                title="Baixar CSV para Excel"
            >
                <Download size={14} /> Exportar CSV
            </button>

            <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide flex items-center gap-2 border ${
              diferenca === 0 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                : 'bg-amber-50 text-amber-700 border-amber-100'
            }`}>
              {diferenca === 0 ? (
                  <><ShieldCheck size={14} /> Integridade Confirmada</>
              ) : (
                  <><AlertTriangle size={14} /> Discrepância Detectada</>
              )}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* COMPARAÇÃO VISUAL */}
        <div className="space-y-6">
          {/* Barra Backup */}
          <div className="space-y-2 group">
            <div className="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <span className="flex items-center gap-1"><FileSpreadsheet size={12}/> Valores Estáticos ({ultimoBackup?.dataBackup || '--/--'})</span>
                <span className="text-slate-700 font-bold">
                R$ {Number(ultimoBackup?.valorTotalNoMomento || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-slate-400 h-full rounded-full transition-all duration-1000 w-full" />
            </div>
          </div>
          
          {/* Barra Real-Time */}
          <div className="space-y-2 group">
            <div className="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <span className="flex items-center gap-1"><RefreshCw size={12} className={diferenca !== 0 ? "animate-spin" : ""}/> Valores Atualizados (Ao Vivo)</span>
                <span className="text-blue-600 font-bold">
                R$ {totalAtivo.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                {/* Background bar */}
                <div className="absolute top-0 left-0 h-full bg-slate-200 w-full"></div>
                {/* Active bar */}
                <div 
                  className={`h-full rounded-full transition-all duration-1000 relative z-10 ${diferenca === 0 ? 'bg-blue-600' : 'bg-amber-500'}`} 
                  style={{ width: `${ultimoBackup ? Math.min((totalAtivo / (ultimoBackup.valorTotalNoMomento || 1)) * 100, 100) : 0}%` }} 
                />
            </div>
          </div>
        </div>

        {/* STATUS DE AUDITORIA (Card Direito) */}
        <div className={`p-6 rounded-2xl border flex flex-col justify-center items-center text-center space-y-3 transition-colors ${
            diferenca === 0 ? 'bg-slate-50 border-slate-100' : 'bg-amber-50 border-amber-100'
        }`}>
          {diferenca === 0 ? (
            <>
              <div className="p-3 bg-white rounded-full shadow-sm text-emerald-500 mb-1">
                 <ShieldCheck size={32} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Sincronização Perfeita</p>
                <p className="text-xs text-slate-500 leading-relaxed mt-1 max-w-[250px]">
                    O valor ativo em caixa corresponde exatamente ao último ponto de verificação seguro.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 bg-white rounded-full shadow-sm text-amber-500 mb-1">
                <AlertTriangle size={32} />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Atenção Necessária</p>
                <p className="text-3xl font-bold text-slate-800 my-1 tracking-tight">
                    {diferenca > 0 ? "+" : ""}{diferenca.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <p className="text-xs text-slate-500">Diferença entre backup e valor atual.</p>
              </div>
              <button className="text-xs font-bold uppercase text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-all mt-2 bg-white px-3 py-1.5 rounded-lg border border-blue-100 hover:border-blue-300 shadow-sm">
                <RefreshCw size={12} /> Reconciliar Sistema
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}