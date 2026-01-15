import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle, X, CheckCircle } from "lucide-react";
import { notifyRoles, GROUPS, logNotificationBatch } from "../lib/notificationService";

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'error' | 'success'; }>({ show: false, message: "", type: 'error' });

  const showNotification = (message: string, type: 'error' | 'success' = 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // VERIFICAÇÃO DE LOGIN (Redirecionamento Automático)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // SE JÁ LOGADO, VAI PRA HOME DIRETO
        navigate("/", { replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDocRef = doc(db, "contas_acesso", user.email!);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          nome: user.displayName, email: user.email, foto: user.photoURL, telefone: "", uid_auth: user.uid, cargo: "Membro", criado_em: new Date().toISOString(), aceitou_termos: true,
        });
        await notifyRoles(GROUPS.MEMBROS, "Novo Membro (Google)", `${user.displayName || "Alguém"} acabou de se cadastrar via Google.`, "admin", "/admin?tab=membros");
        await logNotificationBatch("Novo Membro (Google)", 1, "Sucesso");
      }
      showNotification("Login realizado com sucesso!", "success");
      
      // REDIRECIONAR FORÇADO
      window.location.href = "/"; 

    } catch (err: any) {
      console.error("Erro Google:", err);
      showNotification("Erro ao conectar com Google.", "error");
      setLoading(false);
    } 
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        showNotification("Bem-vindo de volta!", "success");
        // REDIRECIONAR FORÇADO
        window.location.href = "/";
      } else {
        if (!acceptedTerms) { showNotification("Aceite os termos para continuar.", "error"); setLoading(false); return; }
        const nome = fd.get("nome") as string;
        const telefone = fd.get("telefone") as string;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: nome });
        await setDoc(doc(db, "contas_acesso", email), {
          nome: nome, email: email, foto: "https://www.w3schools.com/howto/img_avatar.png", telefone: telefone, uid_auth: user.uid, cargo: "Membro", criado_em: new Date().toISOString(), aceitou_termos: true,
        });
        await notifyRoles(GROUPS.MEMBROS, "Novo Membro Cadastrado", `${nome} se registrou via e-mail.`, "admin", "/admin?tab=membros");
        await logNotificationBatch("Novo Membro (Email)", 1, "Sucesso");
        showNotification("Conta criada com sucesso!", "success");
        // REDIRECIONAR FORÇADO
        window.location.href = "/";
      }
    } catch (err: any) {
      console.error(err);
      showNotification("Erro de autenticação. Verifique os dados.", "error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24 bg-slate-50 text-slate-900 relative overflow-hidden font-sans">
      
      {/* Toast Notification */}
      <div className={`fixed top-5 right-5 z-50 transform transition-all duration-500 ease-out ${notification.show ? "translate-x-0 opacity-100" : "translate-x-20 opacity-0 pointer-events-none"}`}>
        <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-md ${notification.type === 'error' ? "bg-white/95 border-red-100 text-red-600" : "bg-white/95 border-emerald-100 text-emerald-600"}`}>
          {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <div className="flex flex-col"><span className="font-bold text-[10px] uppercase tracking-widest">{notification.type === 'error' ? 'Atenção' : 'Sucesso'}</span><span className="text-slate-600 text-xs font-bold">{notification.message}</span></div>
          <button onClick={() => setNotification(prev => ({ ...prev, show: false }))} className="ml-4 text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>
      </div>

      <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="font-display text-4xl font-bold text-slate-800 tracking-tight">FAÇA SEU LOGIN</h1>
        <p className="text-slate-400 text-xs font-bold tracking-[0.3em] mt-2 uppercase">Portal do Membro</p>
      </div>

      <div className="glass w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 bg-white animate-in zoom-in-95 duration-500">
        <div className="flex text-center font-bold text-xs tracking-widest uppercase cursor-pointer border-b border-slate-100">
          <div onClick={() => setIsLogin(true)} className={`flex-1 py-6 transition-colors ${isLogin ? "bg-white text-emerald-900 border-b-4 border-emerald-600" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}>Entrar</div>
          <div onClick={() => setIsLogin(false)} className={`flex-1 py-6 transition-colors ${!isLogin ? "bg-white text-emerald-900 border-b-4 border-emerald-600" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}>Criar Conta</div>
        </div>

        <div className="p-8">
          <button type="button" onClick={handleGoogleLogin} disabled={loading} className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 py-4 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm mb-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">
            {loading ? <span className="text-xs uppercase tracking-widest">Processando...</span> : <><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" /><span className="text-xs uppercase tracking-widest">{isLogin ? "Entrar com Google" : "Cadastrar com Google"}</span></>}
          </button>

          {!isLogin && <p className="text-[9px] font-bold uppercase tracking-wide text-center text-slate-400 mb-6 px-4 leading-tight mt-2">Ao continuar, você concorda com nossos Termos.</p>}

          <div className="relative flex py-2 items-center mb-6 mt-4">
            <div className="flex-grow border-t border-slate-200"></div><span className="flex-shrink mx-4 text-slate-300 text-[10px] font-black uppercase tracking-widest">Ou via e-mail</span><div className="flex-grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-wider">Nome Completo</label><input name="nome" id="nome_cadastro" autoComplete="name" required placeholder="Seu nome" className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all font-bold text-sm text-slate-700" /></div>
                 <div className="space-y-1 pt-2"><label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-wider">WhatsApp</label><input name="telefone" id="telefone_cadastro" autoComplete="tel" required placeholder="(00) 00000-0000" className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all font-bold text-sm text-slate-700" /></div>
              </div>
            )}
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-wider">E-mail</label><input name="email" id="email_login" type="email" autoComplete="email" required placeholder="email@exemplo.com" className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all font-bold text-sm text-slate-700" /></div>
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-wider">Senha</label><input name="password" id="password_login" type="password" autoComplete="current-password" required placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all font-bold text-sm text-slate-700" /></div>

            {!isLogin && (
              <div className="flex items-start gap-3 mt-4 pt-2 animate-in fade-in duration-500">
                <input type="checkbox" id="terms" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1 w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer accent-emerald-600" />
                <label htmlFor="terms" className="text-[10px] font-bold uppercase text-slate-500 leading-snug cursor-pointer select-none tracking-wide">Li e aceito a <Link to="/politica" target="_blank" className="text-emerald-600 hover:underline relative z-10">Política de Privacidade</Link>.</label>
              </div>
            )}

            <button disabled={loading} className="w-full bg-emerald-900 text-white py-4 rounded-xl font-black uppercase text-xs tracking-[0.2em] hover:bg-emerald-800 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-emerald-900/20 mt-4 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? "Processando..." : (isLogin ? "Acessar Painel" : "Confirmar Cadastro")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}