import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { doc, updateDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { ShieldCheck, Loader2, UserCheck, Lock, Fingerprint, ScanLine, CheckCircle, AlertTriangle } from "lucide-react";
import QRCode from "react-qr-code";
import { notifyRoles, GROUPS } from "../lib/notificationService";
import { useConfirm } from "../context/ConfirmContext"; // Importando o modal bonito

interface UserData {
  email: string;
  nome: string;
  cargo: string;
  cpf?: string;
  foto?: string;
  ra?: string; 
}

export default function MembershipCard({ user }: { user: UserData }) {
  if (!user) return null;
  const [loadingRA, setLoadingRA] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [statusValidacao, setStatusValidacao] = useState<"NaoSolicitado" | "Pendente" | "Aprovado">("NaoSolicitado");
  
  // Hook para substituir o alert feio
  const { confirm } = useConfirm();

  // Validade de 2 anos
  const validade = new Date();
  validade.setFullYear(validade.getFullYear() + 2);
  const validadeString = validade.toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' });

  // URL para validação do QR Code
  const validationUrl = user.ra ? `${window.location.origin}/validar/${user.ra}` : "";

  // --- VERIFICA STATUS DA SOLICITAÇÃO ---
  useEffect(() => {
      const checkStatus = async () => {
          if (!user.email) return;
          try {
            const q = query(collection(db, "solicitacoes_carteirinha"), where("email", "==", user.email));
            const snap = await getDocs(q);
            
            if (!snap.empty) {
                const data = snap.docs[0].data();
                if (data.status === "Pronto") {
                    setStatusValidacao("Aprovado");
                } else {
                    setStatusValidacao("Pendente");
                }
            }
          } catch (error) {
            console.log("Aguardando permissão de leitura...", error);
            // O erro do console vai sumir assim que você atualizar as regras no Firebase
          }
      };
      checkStatus();
  }, [user.email]);

  // --- FUNÇÃO PARA DEFINIR O CÓDIGO DO CARGO ---
  const getRoleParams = (cargo: string) => {
    const c = cargo?.toUpperCase() || "";
    
    if (c === 'DEV') return { code: 'DV', level: 0 };
    if (c.includes('APÓSTOLO') || c.includes('APOSTOLO')) return { code: 'AP', level: 1 };
    if (c.includes('PASTOR')) return { code: 'PR', level: 2 };
    if (c.includes('SECRETARIA')) return { code: 'SE', level: 3 };
    if (c.includes('EVANGELISTA')) return { code: 'EV', level: 4 };
    if (c.includes('PRESBÍTERO') || c.includes('PRESBITERO')) return { code: 'PB', level: 5 };
    if (c.includes('DIÁCONO') || c.includes('DIACONO')) return { code: 'DC', level: 6 };
    if (c.includes('OBREIRO')) return { code: 'OB', level: 7 };
    if (c.includes('SERVO')) return { code: 'SV', level: 8 };
    
    return { code: 'ME', level: 9 }; 
  };

  useEffect(() => {
    const verificarEAtualizarRA = async () => {
      if (!user.email || loadingRA) return;

      const { code, level } = getRoleParams(user.cargo);
      const precisaGerar = !user.ra || !user.ra.startsWith(code);

      if (precisaGerar) {
        setLoadingRA(true);
        const randomChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const randomNums = Math.floor(1000 + Math.random() * 9000);
        const novoRA = `${code}${level}${randomChar}${randomNums}`;

        try {
          await updateDoc(doc(db, "contas_acesso", user.email), {
            ra: novoRA,
            validadeCarteirinha: validade 
          });
        } catch (error) {
          console.error("Erro ao atualizar ID", error);
        } finally {
          setLoadingRA(false);
        }
      }
    };

    verificarEAtualizarRA();
  }, [user.cargo, user.ra, user.email]); 

  // --- DESIGN PREMIUM POR CARGO ---
  const getCardTheme = (cargo: string) => {
    const c = cargo?.toUpperCase() || "";

    // OURO (Alta Liderança)
    if (["APÓSTOLO", "APOSTOLO", "PASTOR", "PASTORA", "BISPO"].some(role => c.includes(role))) {
      return {
        bg: "bg-gradient-to-br from-[#BF953F] via-[#FCF6BA] to-[#B38728]",
        text: "text-amber-950",
        border: "border-yellow-200/50",
        overlay: "bg-black/5",
        accent: "border-amber-900/20"
      };
    }

    // PRATA/PLATINA (Liderança/Staff)
    if (["EVANGELISTA", "PRESBÍTERO", "PRESBITERO", "DIÁCONO", "DIACONO", "SECRETARIA", "MÍDIA", "MIDIA"].some(role => c.includes(role))) {
      return {
        bg: "bg-gradient-to-br from-slate-300 via-slate-100 to-slate-400",
        text: "text-slate-900",
        border: "border-white/60",
        overlay: "bg-white/10",
        accent: "border-slate-500/20"
      };
    }

    // BLACK/ROYAL (Membros/Dev/Base)
    return {
      bg: "bg-gradient-to-br from-slate-900 via-slate-800 to-black",
      text: "text-white",
      border: "border-white/10",
      overlay: "bg-white/5",
      accent: "border-white/20"
    };
  };

  const theme = getCardTheme(user.cargo);

  // --- SOLICITAR VALIDAÇÃO ---
  const handleSolicitacao = async () => {
    if (!user.cpf) {
        // Modal Bonito ao invés de alert
        await confirm({
            title: "CPF Necessário",
            message: "Para sua segurança, adicione seu CPF no perfil antes de solicitar a validação.",
            variant: "danger",
            confirmText: "Entendi"
        });
        return;
    }
    
    setRequesting(true);
    try {
      await addDoc(collection(db, "solicitacoes_carteirinha"), {
        email: user.email,
        nome: user.nome,
        cargo: user.cargo,
        ra: user.ra,
        dataSolicitacao: serverTimestamp(),
        status: "Pendente"
      });

      // NOTIFICAR ADMINS
      await notifyRoles(
        GROUPS.CARTEIRINHAS,
        "Nova Validação Necessária",
        `${user.nome} (${user.cargo}) solicitou ativação da credencial digital.`,
        "admin",
        "/admin?tab=carteirinhas"
      );

      setStatusValidacao("Pendente");
      
      // Feedback de sucesso
      await confirm({
          title: "Solicitação Enviada",
          message: "A secretaria recebeu seu pedido. Você será notificado assim que for aprovado.",
          variant: "success",
          confirmText: "Ok"
      });

    } catch (error) {
      // Feedback de erro
      await confirm({
          title: "Erro no Envio",
          message: "Não foi possível enviar a solicitação. Verifique sua conexão.",
          variant: "danger",
          confirmText: "Fechar"
      });
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto font-sans animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* --- O CARTÃO PREMIUM --- */}
      <div className={`w-full aspect-[1.586/1] rounded-[2rem] p-6 shadow-2xl relative overflow-hidden transition-transform hover:scale-[1.02] duration-500 group ${theme.bg}`}>
        
        {/* TEXTURAS E EFEITOS DE FUNDO */}
        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-white/20 rounded-full blur-[80px]" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-black/10 rounded-full blur-[80px]" />
        
        {/* Borda Brilhante */}
        <div className={`absolute inset-0 rounded-[2rem] border-[1px] ${theme.border} pointer-events-none`}></div>

        <div className="relative z-10 flex flex-col h-full justify-between">
          
          {/* TOPO: LOGO E TÍTULO */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-0.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 shadow-lg">
                 <img src="/logo.webp" alt="Logo" className="w-10 h-10 rounded-full object-cover" />
              </div>
              <div className="flex flex-col">
                <h3 className={`font-serif font-black tracking-wide text-lg leading-none ${theme.text} drop-shadow-sm`}>
                  FAMÍLIAS CHURCH
                </h3>
                <div className="flex items-center gap-1 mt-0.5 opacity-70">
                    <ShieldCheck size={10} className={theme.text} />
                    <p className={`text-[8px] uppercase tracking-[0.2em] font-sans font-bold ${theme.text}`}>Credencial Oficial</p>
                </div>
              </div>
            </div>

            {/* Ícone Holográfico Decorativo */}
            <div className={`opacity-60 ${theme.text}`}>
                <Fingerprint size={32} strokeWidth={1} />
            </div>
          </div>

          {/* CENTRO: FOTO E DADOS */}
          <div className="flex items-end gap-5 mt-2">
            {/* Foto com Borda Dupla */}
            <div className={`w-24 h-28 rounded-xl p-1 bg-white/10 backdrop-blur-sm border ${theme.accent} shadow-2xl relative`}>
                {user.foto ? (
                    <img src={user.foto} className="w-full h-full object-cover rounded-lg shadow-inner" alt="Membro" />
                ) : (
                    <div className={`w-full h-full flex items-center justify-center rounded-lg bg-black/5 ${theme.text}`}>
                        <UserCheck size={24} className="opacity-50"/>
                    </div>
                )}
                {/* Selo de Status */}
                {statusValidacao === "Aprovado" && (
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-lg">
                        <CheckCircle size={12} fill="currentColor" className="text-emerald-500 bg-white rounded-full"/>
                    </div>
                )}
            </div>

            <div className="flex-1 space-y-3 pb-1">
              <div>
                <p className={`text-[7px] uppercase font-black tracking-widest opacity-60 mb-0.5 ${theme.text}`}>Nome do Membro</p>
                <p className={`font-bold uppercase text-sm leading-tight line-clamp-2 drop-shadow-sm ${theme.text}`}>{user.nome}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className={`text-[7px] uppercase font-black tracking-widest opacity-60 mb-0.5 ${theme.text}`}>Cargo / Função</p>
                  <p className={`font-black uppercase text-xs tracking-wide ${theme.text}`}>{user.cargo}</p>
                </div>
                <div>
                  <p className={`text-[7px] uppercase font-black tracking-widest opacity-60 mb-0.5 ${theme.text}`}>Vencimento</p>
                  <p className={`font-mono font-bold uppercase text-xs ${theme.text}`}>{validadeString}</p>
                </div>
              </div>
            </div>
          </div>

          {/* RODAPÉ: ID E QR CODE */}
          <div className={`flex justify-between items-end pt-2 border-t ${theme.accent} mt-1`}>
             <div>
                <p className={`text-[6px] uppercase font-black tracking-[0.3em] opacity-50 mb-0.5 ${theme.text}`}>Registro Administrativo</p>
                <p className={`font-mono text-sm font-black tracking-widest drop-shadow-md ${theme.text}`}>
                    {loadingRA ? "..." : (user.ra || "PENDENTE")}
                </p>
             </div>

             {/* QR Code com Lógica de Bloqueio */}
             <div className="relative group/qr">
                <div className="bg-white p-1.5 rounded-lg shadow-lg">
                    {statusValidacao === "Aprovado" && user.ra ? (
                        <QRCode 
                            value={validationUrl} 
                            size={42} 
                            level="M"
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        />
                    ) : (
                        <div className="w-[42px] h-[42px] bg-slate-100 rounded flex flex-col items-center justify-center text-center p-0.5 border border-slate-200">
                            <Lock className="text-slate-400 mb-0.5" size={14} />
                        </div>
                    )}
                </div>
                
                {/* Tooltip do QR */}
                {statusValidacao !== "Aprovado" && (
                    <div className="absolute bottom-full right-0 mb-2 w-32 bg-black/80 backdrop-blur text-white text-[9px] font-bold p-2 rounded-lg text-center opacity-0 group-hover/qr:opacity-100 transition-opacity pointer-events-none">
                        Aguardando Validação
                    </div>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* --- ÁREA DE AÇÃO / STATUS --- */}
      <div className="w-full animate-in slide-in-from-bottom-8 duration-1000 delay-100">
        {statusValidacao === "Aprovado" ? (
           <div className="w-full py-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all">
             <div className="p-1 bg-emerald-100 rounded-full"><ShieldCheck size={18} /></div>
             <span className="text-xs font-black uppercase tracking-widest">Credencial Ativa</span>
           </div>
        ) : statusValidacao === "Pendente" ? (
           <div className="w-full py-4 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 flex items-center justify-center gap-3 shadow-sm">
             <Loader2 size={18} className="animate-spin text-amber-600"/> 
             <span className="text-xs font-black uppercase tracking-widest">Aguardando Secretaria</span>
           </div>
        ) : (
          <div className="space-y-3">
              <button 
                onClick={handleSolicitacao}
                disabled={requesting || !user.cpf}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] hover:bg-black hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {requesting ? <Loader2 className="animate-spin" size={18}/> : <ScanLine size={18} />}
                Solicitar Validação
              </button>
              
              {!user.cpf && (
                <div className="flex items-center justify-center gap-2 text-red-500 bg-red-50 py-2 rounded-xl border border-red-100">
                    <AlertTriangle size={12} />
                    <p className="text-[10px] font-bold uppercase tracking-wide">CPF necessário no perfil</p>
                </div>
              )}
          </div>
        )}
        
        {/* Aviso Legal */}
        <p className="text-center text-[9px] text-slate-400 mt-6 max-w-xs mx-auto leading-relaxed">
            Esta credencial é pessoal e intransferível. O uso é restrito para identificação em eventos e atividades oficiais da Famílias Church.
        </p>
      </div>
    </div>
  );
}