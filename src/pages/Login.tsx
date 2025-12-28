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
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- BLOQUEIO: Se já estiver logado, manda para a Home ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/"); // Redireciona para Home se já estiver autenticado
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // --- LÓGICA DO GOOGLE ---
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDocRef = doc(db, "contas_acesso", user.email!);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // CADASTRO AUTOMÁTICO VIA GOOGLE
        // Google não fornece nascimento/sexo por padrão, deixamos vazio para editar no perfil
        await setDoc(userDocRef, {
          nome: user.displayName,
          email: user.email,
          foto: user.photoURL, // Pega a foto do Gmail
          telefone: "",
          nascimento: "", 
          sexo: "", 
          uid_auth: user.uid,
          cargo: "Membro",
          criado_em: new Date().toISOString(),
        });
      }
      
      // O useEffect lá em cima vai perceber o login e redirecionar, 
      // mas garantimos aqui também:
      navigate("/");

    } catch (err: any) {
      console.error(err);
      setError("Erro ao conectar com Google.");
      setLoading(false);
    }
  };

  // --- LÓGICA DE EMAIL/SENHA ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;

    try {
      if (isLogin) {
        // --- LOGIN ---
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/"); // Vai para Home
      } else {
        // --- CADASTRO SIMPLIFICADO ---
        const nome = fd.get("nome") as string;
        // Não pedimos telefone, sexo ou nascimento aqui.
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: nome });

        // Cria no banco com dados básicos
        await setDoc(doc(db, "contas_acesso", email), {
          nome: nome,
          email: email,
          foto: "https://www.w3schools.com/howto/img_avatar.png", // Foto padrão
          telefone: "",
          nascimento: "",
          sexo: "",
          uid_auth: user.uid,
          cargo: "Membro",
          criado_em: new Date().toISOString(),
        });

        navigate("/"); // Vai para Home
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setError("E-mail já cadastrado.");
      else if (err.code === 'auth/wrong-password') setError("Senha incorreta.");
      else if (err.code === 'auth/weak-password') setError("A senha deve ter 6+ caracteres.");
      else setError("Verifique seus dados.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-900">
      <div className="mb-8 text-center">
        <h1 className="font-display text-4xl font-bold text-slate-800 tracking-tight">PORTAL SEDE</h1>
        <p className="text-slate-500 text-sm tracking-widest mt-2 uppercase">Autenticação Famílias Church</p>
      </div>

      <div className="glass w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
        
        {/* ABAS */}
        <div className="flex text-center font-bold text-sm tracking-widest uppercase cursor-pointer border-b border-slate-100">
          <div 
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-5 transition-colors ${
              isLogin ? "bg-white text-emerald-900 border-b-4 border-emerald-600" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
            }`}
          >
            Entrar
          </div>
          <div 
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-5 transition-colors ${
              !isLogin ? "bg-white text-emerald-900 border-b-4 border-emerald-600" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
            }`}
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
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm mb-6"
          >
             <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            <span>{isLogin ? "Entrar com Google" : "Cadastrar com Google"}</span>
          </button>

          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-300 text-xs font-bold uppercase">Ou via e-mail</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* NO CADASTRO: Apenas Nome é pedido agora */}
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

            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center border border-red-100">{error}</div>}

            <button disabled={loading} className="w-full bg-emerald-900 text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-emerald-800 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-emerald-900/20 mt-4">
              {loading ? "Carregando..." : (isLogin ? "Acessar Painel" : "Criar Conta Rápida")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}