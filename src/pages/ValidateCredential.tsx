import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ShieldCheck, Loader2, ArrowLeft, CalendarX, Lock, UserX, UserMinus, CheckCircle, Fingerprint } from "lucide-react";
import logoIgreja from "../assets/logo.webp";

export default function ValidateCredential() {
  const { ra } = useParams();
  const navigate = useNavigate();
  
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "expired" | "dismissed">("loading");
  const [memberData, setMemberData] = useState<any>(null);

  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return "Indeterminado";
    try {
      return timestamp.toDate().toLocaleDateString('pt-BR');
    } catch (e) {
      return "Data Inválida";
    }
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) { navigate("/login"); return; }

      try {
        const docRef = doc(db, "contas_acesso", user.email!);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data();
          const cargo = (data.cargo || "").toUpperCase(); 
          const permissao = (data.permissao || "").toUpperCase();
          const allowedSystem = ["DEV", "ADMIN", "GERENCIADOR", "MODERADOR"];
          const temPermissaoSistema = allowedSystem.some(role => permissao.includes(role) || cargo.includes(role));

          if (temPermissaoSistema) setIsAuthorized(true);
          else setIsAuthorized(false);
        } else setIsAuthorized(false);
      } catch (error) { setIsAuthorized(false); } 
      finally { setCheckingAuth(false); }
    });
    return () => unsubAuth();
  }, [navigate]);

  useEffect(() => {
    if (!isAuthorized || !ra || checkingAuth) return;

    const checkRA = async () => {
      try {
        const q = query(collection(db, "contas_acesso"), where("ra", "==", ra));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const data = snap.docs[0].data();
          setMemberData(data);

          if (data.status === "Desligado" || data.status === "Inativo") {
            setStatus("dismissed");
            return;
          }
          
          let isExpired = false;
          if (data.validadeCarteirinha && data.validadeCarteirinha.toDate) {
             const validade = data.validadeCarteirinha.toDate();
             const hoje = new Date();
             hoje.setHours(0,0,0,0);
             validade.setHours(0,0,0,0);
             if (validade < hoje) isExpired = true;
          }
          setStatus(isExpired ? "expired" : "valid");
        } else {
          setStatus("invalid");
        }
      } catch (error) { setStatus("invalid"); }
    };
    checkRA();
  }, [ra, isAuthorized, checkingAuth]);

  if (checkingAuth) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  if (!isAuthorized) return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans pt-32">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200 max-w-sm w-full">
          <div className="w-20 h-20 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-6"><Lock size={32} /></div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Acesso Restrito</h1>
          <p className="text-slate-500 text-sm mb-6">Apenas a equipe administrativa pode validar credenciais.</p>
          <button onClick={() => navigate("/")} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold uppercase tracking-widest text-xs">Voltar</button>
        </div>
      </div>
  );

  if (status === "loading") return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  if (status === "invalid") {
    return (
      <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-6 text-center font-sans pt-32">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-red-100 max-w-sm w-full animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><UserX size={40} /></div>
          <h1 className="text-3xl font-black text-red-600 uppercase tracking-tighter mb-2 leading-none">Inválido</h1>
          <p className="text-slate-400 text-sm font-medium mb-8">Código RA não encontrado no sistema.</p>
          <Link to="/admin" className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"><ArrowLeft size={16} /> Voltar</Link>
        </div>
      </div>
    );
  }

  if (status === "dismissed") {
    return (
        <div className="min-h-screen bg-slate-200 flex flex-col items-center justify-center p-6 text-center font-sans pt-32">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-300 max-w-sm w-full relative overflow-hidden animate-in zoom-in duration-300 grayscale">
            <div className="absolute top-0 left-0 right-0 h-2 bg-slate-500" />
            <div className="w-20 h-20 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><UserMinus size={40} /></div>
            <h1 className="text-3xl font-black text-slate-600 uppercase tracking-tighter mb-2 leading-none">Desligado</h1>
            <p className="text-slate-400 text-sm font-medium mb-6">Membro desligado do quadro.</p>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-8 opacity-70">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Registro Anterior</p>
                <p className="text-lg font-black text-slate-400 line-through decoration-slate-400">{memberData?.nome}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{memberData?.cargo}</p>
            </div>
            <Link to="/admin" className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors"><ArrowLeft size={16} /> Voltar ao Painel</Link>
          </div>
        </div>
      );
  }

  if (status === "expired") {
    return (
        <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6 text-center font-sans pt-32">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-orange-100 max-w-sm w-full relative overflow-hidden animate-in zoom-in duration-300">
            <div className="absolute top-0 left-0 right-0 h-2 bg-orange-500" />
            <div className="w-20 h-20 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><CalendarX size={40} /></div>
            <h1 className="text-3xl font-black text-orange-500 uppercase tracking-tighter mb-2 leading-none">Expirado</h1>
            <p className="text-slate-400 text-sm font-medium mb-6">A validade desta credencial expirou.</p>
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 mb-8">
                <p className="text-xs font-bold text-orange-800 uppercase tracking-wide mb-1">Membro</p>
                <p className="text-lg font-black text-slate-700">{memberData?.nome}</p>
            </div>
            <Link to="/admin" className="w-full py-4 bg-white border-2 border-orange-100 text-orange-500 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors"><ArrowLeft size={16} /> Voltar</Link>
          </div>
        </div>
      );
  }

  // TELA: VÁLIDO (SUCESSO - ESTILO PREMIUM)
  const getTheme = (cargo: string) => {
      const c = (cargo || "").toUpperCase();
      if (["APÓSTOLO", "APOSTOLO", "PASTOR", "PASTORA", "BISPO"].some(role => c.includes(role))) {
          return "from-amber-100 to-amber-50 border-amber-200 text-amber-900";
      }
      if (["EVANGELISTA", "PRESBÍTERO", "PRESBITERO", "DIÁCONO", "DIACONO"].some(role => c.includes(role))) {
          return "from-slate-100 to-slate-50 border-slate-300 text-slate-800";
      }
      return "from-emerald-50 to-white border-emerald-100 text-emerald-900";
  };

  const themeClass = getTheme(memberData?.cargo);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans pt-32 pb-20 animate-in fade-in duration-700">
      
      <div className={`relative bg-gradient-to-b ${themeClass} p-8 md:p-12 rounded-[3rem] shadow-2xl border max-w-md w-full overflow-hidden`}>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald-600" />
        
        <div className="mb-8 flex flex-col items-center">
            <div className="w-20 h-20 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl flex items-center justify-center mb-6 border border-white/50">
                {logoIgreja ? <img src={logoIgreja} alt="Logo" className="w-12 h-12 object-contain" /> : <ShieldCheck size={32} className="text-emerald-600"/>}
            </div>
            
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/50 shadow-sm mb-2">
                <CheckCircle size={16} className="text-emerald-600" />
                <span className="text-xs font-black uppercase tracking-widest text-emerald-800">Credencial Oficial</span>
            </div>
            
            <h1 className="font-serif font-black text-2xl text-slate-800 mt-2">FAMÍLIAS CHURCH</h1>
        </div>

        <div className="bg-white/60 backdrop-blur-lg rounded-3xl p-6 border border-white/50 shadow-inner relative overflow-hidden">
            <Fingerprint className="absolute -right-6 -bottom-6 text-black/5 w-32 h-32 rotate-12 pointer-events-none" />
            
            <div className="flex flex-col items-center relative z-10">
                <div className="w-32 h-32 rounded-full p-1 bg-white shadow-lg mb-4">
                    <img src={memberData?.foto || "https://www.w3schools.com/howto/img_avatar.png"} className="w-full h-full rounded-full object-cover" alt="Membro" />
                </div>
                
                <h2 className="text-xl font-black text-slate-800 uppercase leading-tight mb-1">{memberData?.nome}</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-6">{memberData?.cargo}</p>

                <div className="w-full grid grid-cols-2 gap-4 border-t border-slate-200/50 pt-4">
                    <div className="text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Registro (RA)</p>
                        <p className="font-mono text-sm font-bold text-slate-700">{memberData?.ra}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Validade</p>
                        <p className="font-mono text-sm font-bold text-slate-700">{formatDate(memberData?.validadeCarteirinha)}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50/80 px-4 py-2 rounded-xl">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                <span className="text-[10px] font-black uppercase tracking-widest">Status: Ativo</span>
            </div>
            
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-medium">
                Verificado em {new Date().toLocaleDateString()} às {new Date().toLocaleTimeString().slice(0, 5)}
            </p>
        </div>

      </div>
      
      <div className="mt-8">
        <Link to="/admin" className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
            <ArrowLeft size={14} /> Voltar ao Painel
        </Link>
      </div>
    </div>
  );
}