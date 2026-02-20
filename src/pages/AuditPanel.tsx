import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase"; 
// ✅ CORREÇÃO: Adicionados 'doc' e 'getDoc' que faltavam
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { 
  ShieldCheck, AlertTriangle, Scale, RefreshCw, Download, 
  Info, X, Database, HardDrive, Cpu, Coins, Hand, Loader2, History, User, Lock, Key, Activity
} from "lucide-react";
import { useConfirm } from "../context/ConfirmContext";

interface BackupMetadata {
  id: string;
  valorTotalNoMomento: number;
  dataBackup: string;
  criadoEm: any;
  tipo: string;
  responsavel: string;
}

export default function AuditPanel({ totalAtivo }: { totalAtivo: number }) {
  const { confirm } = useConfirm();
  const [historicoBackups, setHistoricoBackups] = useState<BackupMetadata[]>([]);
  const [estatisticasAtivas, setEstatisticasAtivas] = useState({ dizimos: 0, ofertas: 0, pendentes: 0 });
  const [diferenca, setDiferenca] = useState(0);
  
  // Estados da Trava de Segurança
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [securityError, setSecurityError] = useState("");
  const THRESHOLD = 5000; // Limite de R$ 5.000,00

  const [reconciliando, setReconciliando] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const ultimoBackup = historicoBackups[0] || null;

  useEffect(() => {
    const qBackup = query(collection(db, "backup_metadata"), orderBy("criadoEm", "desc"), limit(5));
    const unsubBackup = onSnapshot(qBackup, (snap) => {
      const docs = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          valorTotalNoMomento: Number(data.valorTotalNoMomento ?? 0),
          dataBackup: data.dataBackup ?? '',
          criadoEm: data.criadoEm ?? null,
          tipo: data.tipo ?? '',
          responsavel: data.responsavel ?? ''
        };
      });
      setHistoricoBackups(docs);
      if (docs.length > 0) setDiferenca(totalAtivo - Number(docs[0].valorTotalNoMomento || 0));
    });

    const qAtivos = query(collection(db, "registros_financeiros_validados"));
    const unsubAtivos = onSnapshot(qAtivos, (snap) => {
      let d = 0, o = 0, p = 0;
      snap.forEach(doc => {
        const data = doc.data();
        if (data.status?.includes("Aprovado")) {
          if (data.tipo === "Dízimo") d += (Number(data.valorLido) || 0);
          else o += (Number(data.valorLido) || 0);
        } else p++;
      });
      setEstatisticasAtivas({ dizimos: d, ofertas: o, pendentes: p });
    });

    return () => { unsubBackup(); unsubAtivos(); };
  }, [totalAtivo]);

  // --- LÓGICA DO GRÁFICO DE VARIÂNCIA (SVG) ---
  const renderLineChart = () => {
    if (historicoBackups.length < 2) return null;

    const data = [...historicoBackups].reverse(); 
    const maxVal = Math.max(...data.map(d => d.valorTotalNoMomento), 100);
    const minVal = Math.min(...data.map(d => d.valorTotalNoMomento), 0);
    const range = maxVal - minVal || 1;

    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((d.valorTotalNoMomento - minVal) / range) * 100;
      return `${x},${y}`;
    }).join(" ");

    return (
      <div className="h-32 w-full mt-4 relative">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.2 }} />
              <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <polyline fill="url(#grad)" stroke="none" points={`0,100 ${points} 100,100`} />
          <polyline fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} className="animate-in fade-in duration-1000" />
          {data.map((d, i) => (
            <circle key={i} cx={(i / (data.length - 1)) * 100} cy={100 - ((d.valorTotalNoMomento - minVal) / range) * 100} r="2" fill="white" stroke="#3b82f6" strokeWidth="1.5" />
          ))}
        </svg>
      </div>
    );
  };

  const handleForcarReconciliacao = async () => {
    if (Math.abs(diferenca) >= THRESHOLD) {
      setIsSecurityOpen(true);
      return;
    }
    const confirmou = await confirm({
      title: "Confirmar Sincronização?",
      message: "Deseja criar um novo checkpoint manual para este valor?",
      confirmText: "Sim, Sincronizar",
      cancelText: "Voltar",
      variant: "info"
    });
    if (confirmou) executarReconciliacao();
  };

  const executarReconciliacao = async () => {
    setReconciliando(true);
    try {
      const responsavel = auth.currentUser?.displayName || auth.currentUser?.email || "Admin";
      await addDoc(collection(db, "backup_metadata"), {
        valorTotalNoMomento: totalAtivo,
        dataBackup: new Date().toLocaleDateString('pt-BR'),
        criadoEm: serverTimestamp(),
        tipo: Math.abs(diferenca) >= THRESHOLD ? "Manual (Alta Discrepância)" : "Manual",
        responsavel: responsavel
      });
      setToastMsg("Checkpoint criado com sucesso!");
      setShowToast(true);
      setIsSecurityOpen(false);
      setPasswordInput("");
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      setToastMsg("Erro ao salvar dados.");
      setShowToast(true);
    } finally {
      setReconciliando(false);
    }
  };

  const [senhaMestreDB, setSenhaMestreDB] = useState<string>("");

  useEffect(() => {
    // Busca a senha mestre configurada pelo Pastor
    const fetchSecurityConfig = async () => {
      try {
        const docSnap = await getDoc(doc(db, "configuracoes", "seguranca"));
        if (docSnap.exists()) {
          setSenhaMestreDB(docSnap.data().senhaMestre);
        }
      } catch (error) {
        console.error("Erro ao carregar configurações de segurança:", error);
      }
    };

    fetchSecurityConfig();
  }, []);

  const handleValidarSeguranca = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === senhaMestreDB) {
      executarReconciliacao();
    } else {
      setSecurityError("Senha de autorização incorreta.");
    }
  };

  return (
    <div className="space-y-8 mt-10 animate-in fade-in duration-700 text-left">
      
      {/* MODAL DE SEGURANÇA */}
      {isSecurityOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-red-100 space-y-6 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-red-50 p-5 rounded-full text-red-500"><Lock size={40} className="animate-bounce" /></div>
              <div><h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800">Trava de Segurança</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 px-4 leading-relaxed">Discrepância superior a R$ 5.000,00 detectada. Autorização necessária.</p></div>
            </div>
            <form onSubmit={handleValidarSeguranca} className="space-y-4">
               <div className="relative"><Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} /><input type="password" value={passwordInput} onChange={(e) => {setPasswordInput(e.target.value); setSecurityError("");}} placeholder="Senha de Autorização" className="w-full bg-slate-50 border border-slate-100 p-5 pl-12 rounded-2xl outline-none focus:border-red-400 transition-all font-bold" autoFocus /></div>
               {securityError && <p className="text-[10px] font-black uppercase text-red-500 animate-in shake">{securityError}</p>}
               <div className="flex gap-3"><button type="button" onClick={() => {setIsSecurityOpen(false); setPasswordInput("");}} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400">Cancelar</button><button type="submit" disabled={reconciliando} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-red-200">Autorizar</button></div>
            </form>
          </div>
        </div>
      )}

      {/* PAINEL DE STATUS */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-10 relative overflow-hidden">
        {showToast && (
            <div className="absolute top-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-right-4 flex items-center gap-3 shadow-2xl z-50">
                <Cpu size={14} className="text-blue-400 animate-pulse"/> {toastMsg}
            </div>
        )}

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between border-b border-gray-50 pb-8 gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-emerald-50 p-4 rounded-[1.5rem] text-emerald-500 shadow-inner"><Scale size={32} /></div>
            <div><h2 className="text-4xl font-black uppercase tracking-tighter text-gray-900">Auditoria Ativa</h2><p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-2">Fazenda Rio Grande • Integridade de Caixa</p></div>
          </div>
        </div>

        {/* MÉTRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100">
                <div className="flex items-center gap-2 text-blue-600 mb-2"><Hand size={16} /> <span className="text-[9px] font-black uppercase tracking-widest">Dízimos</span></div>
                <p className="text-2xl font-black text-blue-900">R$ {estatisticasAtivas.dizimos.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100">
                <div className="flex items-center gap-2 text-amber-600 mb-2"><Coins size={16} /> <span className="text-[9px] font-black uppercase tracking-widest">Ofertas</span></div>
                <p className="text-2xl font-black text-amber-900">R$ {estatisticasAtivas.ofertas.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                <div className="flex items-center gap-2 text-slate-500 mb-2"><RefreshCw size={16} /> <span className="text-[9px] font-black uppercase tracking-widest">Em Aberto</span></div>
                <p className="text-2xl font-black text-slate-700">{estatisticasAtivas.pendentes}</p>
            </div>
        </div>

        {/* RECONCILIAÇÃO E GRÁFICO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-4 bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100">
             <div className="flex items-center justify-between">
                <div><p className="text-[10px] font-black uppercase text-gray-400 mb-1">Tendência de Caixa (Checkpoints)</p><p className="text-xl font-black text-gray-800">R$ {Number(ultimoBackup?.valorTotalNoMomento || 0).toLocaleString('pt-BR')}</p></div>
                <Activity size={24} className="text-blue-500 opacity-50" />
             </div>
             {renderLineChart()}
             <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest text-center mt-4 italic">Linha de flutuação dos últimos 5 checkpoints manuais</p>
          </div>

          <div className="flex flex-col justify-center items-center text-center p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-xl relative overflow-hidden">
            {diferenca !== 0 ? (
              <>
                <div className={`p-4 rounded-full mb-4 ${Math.abs(diferenca) >= THRESHOLD ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-amber-100 text-amber-600'}`}>
                  {Math.abs(diferenca) >= THRESHOLD ? <Lock size={32} /> : <AlertTriangle size={32} />}
                </div>
                <p className="text-3xl font-black text-gray-900 mb-4">{diferenca > 0 ? "+" : ""}{diferenca.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <button onClick={handleForcarReconciliacao} disabled={reconciliando} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-lg ${Math.abs(diferenca) >= THRESHOLD ? 'bg-red-600 hover:bg-red-700 shadow-red-100' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'} text-white`}>
                  {Math.abs(diferenca) >= THRESHOLD ? <Lock size={16} /> : <RefreshCw size={16} />}
                  {Math.abs(diferenca) >= THRESHOLD ? "Liberar com Senha" : "Sincronizar Caixa"}
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center"><div className="bg-emerald-50 p-4 rounded-full text-emerald-500 mb-4"><ShieldCheck size={32} /></div><p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Caixa Íntegro</p></div>
            )}
          </div>
        </div>
      </div>

      {/* TABELA DE LOGS */}
      <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden text-left">
        <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-6"><History size={20} className="text-slate-400" /><div><h3 className="font-display text-xl font-bold uppercase text-slate-800 leading-none">Log de Auditoria</h3><p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Histórico de Checkpoints</p></div></div>
        <div className="overflow-x-auto"><table className="w-full border-separate border-spacing-y-3">
            <thead><tr className="text-[9px] font-black uppercase text-slate-300 tracking-widest"><th className="px-6 text-left">Responsável</th><th className="px-6 text-left">Data</th><th className="px-6 text-left">Valor Sincronizado</th><th className="px-6 text-right">Tipo</th></tr></thead>
            <tbody>{historicoBackups.map((log) => (
                <tr key={log.id} className="group bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-100 transition-all rounded-2xl"><td className="px-6 py-4 rounded-l-2xl"><div className="flex items-center gap-3"><div className="p-2 bg-white rounded-lg text-slate-400 group-hover:text-blue-500 shadow-sm"><User size={14} /></div><span className="text-xs font-bold text-slate-700">{log.responsavel}</span></div></td><td className="px-6 py-4"><span className="text-xs font-bold text-slate-600">{log.dataBackup}</span></td><td className="px-6 py-4"><span className="text-sm font-black text-slate-800">R$ {Number(log.valorTotalNoMomento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></td><td className="px-6 py-4 text-right rounded-r-2xl"><span className={`px-3 py-1 border text-[8px] font-black uppercase rounded-full shadow-sm ${log.tipo?.includes('Alta') ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-slate-200 text-slate-400'}`}>{log.tipo}</span></td></tr>
            ))}</tbody></table></div>
      </div>
    </div>
  );
}