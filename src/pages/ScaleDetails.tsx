import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db, auth } from "../lib/firebase";
import { doc, getDoc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { 
  Calendar, MapPin, User, Mic, Shield, Users, 
  ArrowLeft, Share2, Loader2, CheckCircle, AlertCircle, XCircle, ThumbsUp 
} from "lucide-react";
import { useConfirm } from "../context/ConfirmContext";
import { notifyRoles } from "../lib/notificationService";

export default function ScaleDetails() {
  const { id } = useParams();
  const [escala, setEscala] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false); // Loading específico para ações dos botões
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState(false);
  
  // Estado para Feedback Visual (Substitui o alert feio)
  const [msgFeedback, setMsgFeedback] = useState<{type: 'success'|'error', text: string} | null>(null);

  const { confirm } = useConfirm();

  // 1. Monitora Autenticação
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
        if (user) setCurrentUserEmail(user.email);
        else setCurrentUserEmail(null);
    });
    return () => unsub();
  }, []);

  // 2. Busca Dados da Escala
  const fetchEscala = async () => {
    if (!id) return;
    try {
      const docRef = doc(db, "escalas_servos", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setEscala({ id: snap.id, ...data });
        
        // Verifica se já confirmou (garante array vazio se undefined para não quebrar)
        const listaConfirmados = data.confirmados || [];
        if (currentUserEmail && listaConfirmados.includes(currentUserEmail)) {
            setConfirmado(true);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar escala:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscala();
  }, [id, currentUserEmail]);

  // --- FUNÇÃO DE FEEDBACK VISUAL (TOAST) ---
  const showFeedback = (text: string, type: 'success' | 'error') => {
      setMsgFeedback({ text, type });
      // Remove a mensagem após 4 segundos
      setTimeout(() => setMsgFeedback(null), 4000);
  };

  // --- AÇÕES ---

  const handleConfirmar = async () => {
      if (!id || !currentUserEmail) return;
      
      setActionLoading(true); // Ativa loading do botão
      try {
          // Usa arrayUnion para adicionar sem duplicar. 
          // Se o campo 'confirmados' não existir, o Firestore cria automaticamente.
          await updateDoc(doc(db, "escalas_servos", id), {
              confirmados: arrayUnion(currentUserEmail)
          });
          setConfirmado(true);
          showFeedback("Presença confirmada com sucesso! Obrigado por servir.", "success");
      } catch (e) {
          console.error("Erro ao confirmar:", e);
          showFeedback("Não foi possível confirmar. Verifique sua conexão.", "error");
      } finally {
          setActionLoading(false); // Desativa loading
      }
  };

  const handleRecusar = async () => {
      if (!id || !currentUserEmail || !escala) return;

      // Usa o hook useConfirm (Contexto) ao invés do window.confirm
      const confirmou = await confirm({
          title: "Cancelar Participação?",
          message: "Ao confirmar, você será removido desta escala e a liderança será notificada.",
          variant: "danger",
          confirmText: "Sim, não poderei ir",
          cancelText: "Voltar"
      });

      if (!confirmou) return;

      setActionLoading(true);
      try {
        // 1. Remove da lista de confirmados
        await updateDoc(doc(db, "escalas_servos", id), {
            confirmados: arrayRemove(currentUserEmail)
        });
        
        // 2. Tenta notificar a liderança
        const dataCultoStr = new Date(escala.dataCulto + "T12:00:00").toLocaleDateString('pt-BR');
        
        await notifyRoles(
            ["Admin", "Gerenciador", "Moderador"],
            "Baixa na Escala",
            `O usuário ${currentUserEmail} informou que NÃO poderá comparecer à escala de ${dataCultoStr}.`,
            "aviso", 
            `/admin?tab=ministerios`
        );

        setConfirmado(false);
        showFeedback("Liderança notificada. Obrigado por avisar.", "success");

      } catch (e) {
          console.error(e);
          showFeedback("Erro ao processar sua solicitação.", "error");
      } finally {
          setActionLoading(false);
      }
  };

  const isUserInScale = () => {
      if (!escala || !currentUserEmail) return false;
      const emails = escala.servosEmails || [];
      return emails.includes(currentUserEmail);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 pt-20"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  if (!escala) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-6 text-center pt-20">
        <AlertCircle size={64} className="mb-4 opacity-20" />
        <h2 className="text-xl font-black uppercase tracking-tight text-slate-600">Escala não encontrada</h2>
        <Link to="/" className="mt-8 px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Voltar ao Início</Link>
    </div>
  );

  const dataObj = new Date(escala.dataCulto + "T12:00:00");
  
  const hasLideranca = escala.ministrante || escala.dirigente || escala.palavraInicial || escala.oracaoOfertas;
  const hasApoio = escala.equipeApoio && escala.equipeApoio.length > 0;
  const hasPortaria = escala.portaria && escala.portaria.length > 0;
  const hasOportunidades = escala.oportunidades && escala.oportunidades.length > 0;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-28 px-4 animate-in fade-in duration-500 font-sans flex flex-col items-center relative">
      
      {/* --- COMPONENTE TOAST (FEEDBACK) --- */}
      {msgFeedback && (
          <div className={`fixed top-24 right-4 z-[9999] px-6 py-4 rounded-xl shadow-2xl border animate-in slide-in-from-right duration-300 flex items-center gap-3 max-w-sm backdrop-blur-md ${
              msgFeedback.type === 'success' 
                ? 'bg-white/95 border-emerald-100 text-emerald-700' 
                : 'bg-white/95 border-red-100 text-red-600'
          }`}>
              {msgFeedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <p className="text-xs font-bold leading-tight">{msgFeedback.text}</p>
          </div>
      )}

      <div className="w-full max-w-2xl space-y-6">
        
        {/* HEADER DE NAVEGAÇÃO */}
        <div className="flex items-center justify-between px-2">
            <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-xs font-bold uppercase tracking-widest group">
                <div className="p-2 bg-white border border-slate-200 rounded-full group-hover:border-indigo-200 transition-colors shadow-sm">
                    <ArrowLeft size={16} /> 
                </div>
                <span>Voltar</span>
            </Link>
            <div className="px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                Escala Oficial
            </div>
        </div>

        {/* ÁREA DE CONFIRMAÇÃO (SÓ PARA QUEM ESTÁ NA ESCALA) */}
        {isUserInScale() && (
            <div className={`p-6 rounded-3xl border-2 shadow-lg transition-all relative overflow-hidden ${confirmado ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-indigo-100'}`}>
                
                {/* Loader Overlay durante ação */}
                {actionLoading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                        <Loader2 className="animate-spin text-indigo-600" size={24} />
                    </div>
                )}

                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                        <h3 className={`text-lg font-black uppercase tracking-tight mb-1 ${confirmado ? 'text-emerald-700' : 'text-indigo-900'}`}>
                            {confirmado ? "Presença Confirmada!" : "Você está escalado!"}
                        </h3>
                        <p className="text-xs font-medium text-slate-500 max-w-xs">
                            {confirmado 
                                ? "Obrigado por confirmar. Nos vemos no culto!" 
                                : "Por favor, confirme sua disponibilidade para este dia."}
                        </p>
                    </div>
                    
                    <div className="flex gap-3 w-full md:w-auto">
                        {!confirmado ? (
                            <>
                                <button onClick={handleRecusar} disabled={actionLoading} className="flex-1 md:flex-none py-3 px-6 rounded-xl border border-red-100 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 transition-all disabled:opacity-50">
                                    Não Posso
                                </button>
                                <button onClick={handleConfirmar} disabled={actionLoading} className="flex-1 md:flex-none py-3 px-8 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />} 
                                    Confirmar
                                </button>
                            </>
                        ) : (
                            <div className="flex gap-3 w-full">
                                <div className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-white rounded-xl border border-emerald-200 text-emerald-600 font-bold text-xs uppercase tracking-widest shadow-sm">
                                    <CheckCircle size={18} /> Confirmado
                                </div>
                                <button onClick={handleRecusar} disabled={actionLoading} className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50" title="Cancelar confirmação">
                                    <XCircle size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* CARTÃO PRINCIPAL (Inalterado visualmente) */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 overflow-hidden border border-slate-100 relative">
            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            
            <div className="p-10 text-center border-b border-slate-50 bg-slate-50/30">
                <div className="inline-flex p-5 bg-white text-indigo-600 rounded-3xl mb-6 shadow-md border border-slate-100">
                    <Calendar size={40} />
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-800 uppercase tracking-tight leading-none mb-3">
                    {escala.ministerio || "Culto Geral"}
                </h1>
                <div className="flex justify-center items-center gap-3">
                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-500 uppercase tracking-wider border border-slate-200">
                        {dataObj.toLocaleDateString('pt-BR', { weekday: 'long' })}
                    </span>
                    <span className="text-lg font-black text-indigo-600">
                        {dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                </div>
            </div>

            <div className="p-8 md:p-10 space-y-10">
                {hasLideranca && (
                    <div className="space-y-5">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                            <div className="h-px bg-slate-200 flex-1"></div>
                            <span className="flex items-center gap-2"><Mic size={14} /> Direção do Culto</span>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {escala.ministrante && <LiderancaItem label="Ministrante" value={escala.ministrante} icon={<User size={16} />} />}
                            {escala.dirigente && <LiderancaItem label="Dirigente" value={escala.dirigente} icon={<Mic size={16} />} />}
                            {escala.palavraInicial && <LiderancaItem label="Palavra Inicial" value={escala.palavraInicial} icon={<Mic size={16} />} />}
                            {escala.oracaoOfertas && <LiderancaItem label="Oração Ofertas" value={escala.oracaoOfertas} icon={<User size={16} />} />}
                        </div>
                    </div>
                )}

                {(hasApoio || hasPortaria) && (
                    <div className="space-y-5">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                             <div className="h-px bg-slate-200 flex-1"></div>
                             <span className="flex items-center gap-2"><Shield size={14} /> Equipes de Serviço</span>
                             <div className="h-px bg-slate-200 flex-1"></div>
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {hasPortaria && (
                                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200">
                                    <p className="text-xs font-black text-slate-500 uppercase mb-4 flex items-center gap-2"><MapPin size={16} className="text-slate-400"/> Recepção / Portaria</p>
                                    <div className="flex flex-wrap gap-2">
                                        {escala.portaria.map((nome: string, i: number) => (
                                            <Badge key={i} nome={nome} color="slate" />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {hasApoio && (
                                <div className="bg-emerald-50/60 p-5 rounded-3xl border border-emerald-100">
                                    <p className="text-xs font-black text-emerald-700 uppercase mb-4 flex items-center gap-2"><Users size={16} className="text-emerald-500"/> Apoio Geral</p>
                                    <div className="flex flex-wrap gap-2">
                                        {escala.equipeApoio.map((nome: string, i: number) => (
                                            <Badge key={i} nome={nome} color="emerald" />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {hasOportunidades && (
                    <div className="space-y-5">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                             <div className="h-px bg-slate-200 flex-1"></div>
                             <span className="flex items-center gap-2"><Mic size={14} /> Oportunidades</span>
                             <div className="h-px bg-slate-200 flex-1"></div>
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {escala.oportunidades.map((op: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-amber-600 font-black text-sm shadow-sm border border-amber-100">
                                            {op.nome.charAt(0)}
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">{op.nome}</span>
                                    </div>
                                    <span className="text-[10px] font-black bg-white text-amber-600 px-3 py-1.5 rounded-xl uppercase tracking-wider border border-amber-100 shadow-sm">
                                        {op.tipo}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                    <CheckCircle size={12} /> Escala Confirmada
                </p>
            </div>
        </div>

        {/* BOTÃO DE AÇÃO EXTRA */}
        <button 
            onClick={() => window.print()}
            className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md hover:border-slate-300"
        >
            <Share2 size={18} /> Salvar / Imprimir
        </button>

      </div>
    </div>
  );
}

// COMPONENTES AUXILIARES
function LiderancaItem({ label, value, icon }: { label: string, value: string, icon?: any }) {
    return (
        <div className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-sm transition-all flex items-start gap-3">
            <div className="p-2 bg-slate-50 text-slate-400 rounded-xl mt-0.5">
                {icon || <User size={16} />}
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-sm font-bold text-slate-800 leading-tight">{value}</p>
            </div>
        </div>
    )
}

function Badge({ nome, color }: { nome: string, color: 'slate' | 'emerald' }) {
    const styles = {
        slate: "bg-white text-slate-700 border-slate-200 hover:border-slate-300",
        emerald: "bg-white text-emerald-700 border-emerald-200 hover:border-emerald-300"
    };

    return (
        <span className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 shadow-sm transition-all ${styles[color]}`}>
            <div className={`w-2 h-2 rounded-full ${color === 'emerald' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {nome}
        </span>
    )
}