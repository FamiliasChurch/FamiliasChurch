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
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle, X, CheckCircle } from "lucide-react"; // Se não tiver lucide-react, pode remover os ícones ou usar SVG

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Estado para o checkbox de consentimento
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // --- ESTADO DA NOTIFICAÇÃO (TOAST) ---
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'error' | 'success';
  }>({ show: false, message: "", type: 'error' });

  // Função auxiliar para mostrar notificação
  const showNotification = (message: string, type: 'error' | 'success' = 'error') => {
    setNotification({ show: true, message, type });
    // Esconde automaticamente após 4 segundos
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  // --- BLOQUEIO: Se já estiver logado, manda para a Home ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // --- LÓGICA DO GOOGLE ---
  const handleGoogleLogin = async () => {
    setLoading(true); // Trava botões
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "contas_acesso", user.email!);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          nome: user.displayName,
          email: user.email,
          foto: user.photoURL,
          telefone: "",
          nascimento: "",
          sexo: "",
          uid_auth: user.uid,
          cargo: "Membro",
          criado_em: new Date().toISOString(),
          aceitou_termos: true,
        });
      }
      navigate("/");

    } catch (err: any) {
      console.error("Erro Google:", err);
      // Tratamento específico se o usuário fechou a janela
      if (err.code === 'auth/popup-closed-by-user') {
        showNotification("Login cancelado pelo usuário.", "error");
      } else {
        showNotification("Erro ao conectar com Google. Tente novamente.", "error");
      }
    } finally {
      // O finally roda SEMPRE, dando erro ou sucesso. Isso destrava o botão.
      setLoading(false); 
    }
  };

  // --- LÓGICA DE EMAIL/SENHA ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;

    try {
      if (isLogin) {
        // --- LOGIN ---
        await signInWithEmailAndPassword(auth, email, password);
        // Não precisa setLoading(false) aqui pois vai navegar e desmontar
        navigate("/");
      } else {
        // --- CADASTRO ---
        if (!acceptedTerms) {
          showNotification("Você precisa aceitar os termos para criar a conta.", "error");
          setLoading(false);
          return;
        }

        const nome = fd.get("nome") as string;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: nome });

        await setDoc(doc(db, "contas_acesso", email), {
          nome: nome,
          email: email,
          foto: "https://www.w3schools.com/howto/img_avatar.png",
          telefone: "",
          nascimento: "",
          sexo: "",
          uid_auth: user.uid,
          cargo: "Membro",
          criado_em: new Date().toISOString(),
          aceitou_termos: true,
        });

        navigate("/");
      }
    } catch (err: any) {
      console.error(err);
      // Mensagens de erro amigáveis
      let msg = "Ocorreu um erro. Tente novamente.";
      if (err.code === 'auth/email-already-in-use') msg = "Este e-mail já está cadastrado.";
      else if (err.code === 'auth/invalid-credential') msg = "E-mail ou senha incorretos.";
      else if (err.code === 'auth/wrong-password') msg = "Senha incorreta.";
      else if (err.code === 'auth/user-not-found') msg = "Usuário não encontrado.";
      else if (err.code === 'auth/weak-password') msg = "A senha deve ter pelo menos 6 caracteres.";
      
      showNotification(msg, "error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24 bg-slate-50 text-slate-900 relative overflow-hidden">

      {/* --- COMPONENTE DE NOTIFICAÇÃO (TOAST) --- */}
      <div 
        className={`fixed top-5 right-5 z-50 transform transition-all duration-500 ease-out ${
          notification.show ? "translate-x-0 opacity-100" : "translate-x-20 opacity-0 pointer-events-none"
        }`}
      >
        <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${
          notification.type === 'error' 
            ? "bg-white border-red-100 text-red-600" 
            : "bg-white border-emerald-100 text-emerald-600"
        }`}>
          {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <div className="flex flex-col">
            <span className="font-bold text-sm uppercase tracking-wide">
              {notification.type === 'error' ? 'Atenção' : 'Sucesso'}
            </span>
            <span className="text-slate-600 text-sm">{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            className="ml-4 text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="mb-8 text-center">
        <h1 className="font-display text-4xl font-bold text-slate-800 tracking-tight">FAÇA SEU LOGIN</h1>
        <p className="text-slate-500 text-sm tracking-widest mt-2 uppercase">Autenticação</p>
      </div>

      <div className="glass w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white">

        {/* ABAS */}
        <div className="flex text-center font-bold text-sm tracking-widest uppercase cursor-pointer border-b border-slate-100">
          <div
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-5 transition-colors ${isLogin ? "bg-white text-emerald-900 border-b-4 border-emerald-600" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
          >
            Entrar
          </div>
          <div
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-5 transition-colors ${!isLogin ? "bg-white text-emerald-900 border-b-4 border-emerald-600" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
          >
            Criar Conta
          </div>
        </div>

        <div className="p-8">
          {/* BOTÃO GOOGLE */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="text-sm">Conectando...</span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                <span>{isLogin ? "Entrar com Google" : "Cadastrar com Google"}</span>
              </>
            )}
          </button>

          {!isLogin && (
            <p className="text-[10px] text-center text-slate-400 mb-6 px-4 leading-tight">
              Ao continuar com Google, você concorda com nossos Termos.
            </p>
          )}

          <div className="relative flex py-2 items-center mb-6 mt-4">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-300 text-xs font-bold uppercase">Ou via e-mail</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {!isLogin && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                <input name="nome" required placeholder="Nome Completo" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:border-emerald-500 focus:bg-white transition-all" />
              </div>
            )}

            <div className="space-y-1">
              <input name="email" type="email" required placeholder="E-mail" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:border-emerald-500 focus:bg-white transition-all" />
            </div>

            <div className="space-y-1">
              <input name="password" type="password" required placeholder="Senha" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:border-emerald-500 focus:bg-white transition-all" />
            </div>

            {!isLogin && (
              <div className="flex items-start gap-3 mt-4 pt-2 animate-in fade-in duration-500">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                />
                <label htmlFor="terms" className="text-xs text-slate-500 leading-snug cursor-pointer select-none">
                  Li e aceito a{' '}
                  <Link to="/politica" target="_blank" className="text-emerald-600 font-bold hover:underline relative z-10">
                    Política de Privacidade
                  </Link>.
                </label>
              </div>
            )}

            <button disabled={loading} className="w-full bg-emerald-900 text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-emerald-800 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-emerald-900/20 mt-4 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? "Processando..." : (isLogin ? "Acessar Painel" : "Confirmar Cadastro")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}