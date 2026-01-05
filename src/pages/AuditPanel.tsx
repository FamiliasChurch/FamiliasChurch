import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { ShieldCheck, AlertTriangle, Scale, RefreshCw, Download, FileSpreadsheet, FileSpreadsheet, Activity } from "lucide-react";

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

  // --- FUNÇÃO DE EXPORTAÇÃO (Melhorada para Excel/Acentos) ---
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
    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8 mt-10 transition-all">
      {/* HEADER DO PAINEL */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-gray-100 pb-6 gap-4">
        <div className="flex items-center gap-4">
          <Scale className="text-primaria" size={28} />
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
                Auditoria de Dados
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Painel de Integridade Financeira
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* BOTÃO DE EXPORTAR */}
            <button 
                onClick={exportarRelatorio}
                className="flex items-center gap-2 px-5 py-2 rounded-full border border-gray-200 text-gray-500 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 hover:text-primaria transition-all"
                title="Baixar CSV para Excel"
            >
                <Download size={14} /> Exportar Relatório
            </button>

            <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${
            diferenca === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
            {diferenca === 0 ? (
                <><ShieldCheck size={14} /> Integridade Confirmada</>
            ) : (
                <><AlertTriangle size={14} /> Discrepância Detectada</>
            )}
            </div>
          </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* COMPARAÇÃO VISUAL */}
        <div className="space-y-6">
          {/* Barra Backup */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500">
                <span>Backup Estático ({ultimoBackup?.dataBackup || '--/--'})</span>
                <span className="text-gray-900 font-black">
                R$ {Number(ultimoBackup?.valorTotalNoMomento || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </span>
            </div>
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div className="bg-gray-400 h-full transition-all" style={{ width: '100%' }} />
            </div>
          </div>
          
          {/* Barra Real-Time */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500">
                <span>Banco de Dados Ativo (Tempo Real)</span>
                <span className="text-primaria font-black">
                R$ {totalAtivo.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </span>
            </div>
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden relative">
                <div className="absolute top-0 left-0 h-full bg-gray-200 w-full"></div>
                <div 
                className={`h-full transition-all relative z-10 ${diferenca === 0 ? 'bg-primaria' : 'bg-red-600'}`} 
                style={{ width: `${ultimoBackup ? Math.min((totalAtivo / (ultimoBackup.valorTotalNoMomento || 1)) * 100, 100) : 0}%` }} 
                />
              </div>
            </div>
          </div>

        {/* STATUS DE AUDITORIA */}
        <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 flex flex-col justify-center items-center text-center space-y-4">
          {diferenca === 0 ? (
            <>
              <ShieldCheck className="text-green-600" size={48} />
              <div>
                <p className="text-sm font-bold text-gray-800">Sincronização Perfeita</p>
                <p className="text-[10px] text-gray-500 leading-relaxed mt-1">
                    O valor ativo em caixa corresponde exatamente ao último ponto de verificação seguro.
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="text-red-600" size={48} />
              <div>
                <p className="text-sm font-bold text-red-600 uppercase">Atenção Necessária</p>
                <p className="text-2xl font-black text-gray-800 my-2">
                    {diferenca > 0 ? "+" : ""}{diferenca.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <p className="text-[10px] text-gray-500">Diferença entre o backup e o valor atual.</p>
              </div>
              <button className="text-[10px] font-black uppercase text-primaria hover:underline flex items-center gap-2 transition-all mt-2">
                <RefreshCw size={12} /> Forçar Reconciliação
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}