import { useState, useEffect } from "react";
import { db, auth } from "../lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { 
  Lock, Key, Save, ShieldAlert, Clock, UserCheck, Eye, EyeOff, Loader2, CheckCircle 
} from "lucide-react";

export default function ConfiguracoesPastor() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPass, setShowPass] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);
  const [msg, setMsg] = useState({ text: "", type: "" });

  // 1. Carregar metadados da última alteração
  useEffect(() => {
    const fetchMetadata = async () => {
      const docSnap = await getDoc(doc(db, "configuracoes", "seguranca"));
      if (docSnap.exists()) {
        setMetadata(docSnap.data());
      }
    };
    fetchMetadata();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ text: "", type: "" });

    // Validações de Engenharia
    if (novaSenha.length < 6) {
      return setMsg({ text: "A senha deve ter pelo menos 6 caracteres.", type: "error" });
    }
    if (novaSenha !== confirmarSenha) {
      return setMsg({ text: "As senhas não coincidem.", type: "error" });
    }

    setLoading(true);
    try {
      const segurancaRef = doc(db, "configuracoes", "seguranca");
      await updateDoc(segurancaRef, {
        senhaMestre: novaSenha,
        alteradoPor: auth.currentUser?.displayName || auth.currentUser?.email,
        dataAlteracao: serverTimestamp()
      });

      setMsg({ text: "Senha Mestre atualizada com sucesso!", type: "success" });
      setNovaSenha("");
      setConfirmarSenha("");
      
      // Atualiza metadados localmente
      setMetadata({
        ...metadata,
        alteradoPor: auth.currentUser?.displayName || auth.currentUser?.email,
        dataAlteracao: { toDate: () => new Date() }
      });
    } catch (error) {
      setMsg({ text: "Erro ao atualizar. Verifique suas permissões de Admin.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-10 animate-in fade-in duration-700 text-left">
      
      {/* HEADER */}
      <div className="flex items-center gap-5 border-b border-gray-100 pb-8">
        <div className="bg-blue-600 p-4 rounded-[1.5rem] text-white shadow-lg shadow-blue-100">
          <Lock size={32} />
        </div>
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-gray-900">Configurações Mestre</h2>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-2">Segurança de Alto Nível • Famílias Church</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* FORMULÁRIO DE ALTERAÇÃO */}
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-slate-800">
            <Key size={20} className="text-blue-500" />
            <h3 className="font-bold uppercase text-sm tracking-widest">Alterar Senha de Auditoria</h3>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="relative">
              <input 
                type={showPass ? "text" : "password"} 
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Nova Senha Mestre"
                className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl outline-none focus:border-blue-400 transition-all font-bold text-sm"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <input 
              type={showPass ? "text" : "password"} 
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Confirmar Nova Senha"
              className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl outline-none focus:border-blue-400 transition-all font-bold text-sm"
            />

            {msg.text && (
              <div className={`p-4 rounded-xl flex items-center gap-3 text-[10px] font-black uppercase ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                {msg.type === 'success' ? <CheckCircle size={16}/> : <ShieldAlert size={16}/>}
                {msg.text}
              </div>
            )}

            <button 
              disabled={loading || !novaSenha}
              className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Salvar Nova Configuração
            </button>
          </form>
        </div>

        {/* LOG DE SEGURANÇA (AUDIT TRAIL) */}
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldAlert size={120} /></div>
          
          <div className="relative z-10 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">Última Modificação</h3>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-3 rounded-xl"><UserCheck size={20} className="text-emerald-400" /></div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400">Responsável</p>
                  <p className="text-sm font-bold">{metadata?.alteradoPor || "Não registrado"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-3 rounded-xl"><Clock size={20} className="text-blue-400" /></div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400">Data e Hora</p>
                  <p className="text-sm font-bold">
                    {metadata?.dataAlteracao?.toDate ? metadata.dataAlteracao.toDate().toLocaleString('pt-BR') : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <p className="text-[9px] leading-relaxed text-slate-400 italic">
                * Esta senha é necessária para reconciliações manuais superiores a R$ 5.000,00. Mantenha-a em sigilo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}