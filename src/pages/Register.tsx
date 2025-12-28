import { useState } from "react";
import { auth, db } from "../lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- LÓGICA DO GOOGLE (LOGIN & CADASTRO JUNTOS) ---
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Verifica se esse usuário já tem registro no Firestore
      const userDocRef = doc(db, "contas_acesso", user.email!);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // SE NÃO EXISTE: Cria o registro (equivale ao Cadastro)
        await setDoc(userDocRef, {
          nome: user.displayName,
          email: user.email,
          telefone: "", // Google não fornece telefone por padrão
          uid_auth: user.uid,
          cargo: "Membro", // Regra de segurança
          criado_em: new Date().toISOString(),
          foto: user.photoURL || "https://www.w3schools.com/howto/img_avatar.png"
        });
      }

      // Se já existe ou acabou de criar, manda pro painel
      navigate("/admin");

    } catch (err: any) {
      console.error(err);
      setError("Erro ao conectar com Google. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE EMAIL/SENHA (ANTIGA) ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/admin");
      } else {
        const nome = fd.get("nome") as string;
        const telefone = fd.get("telefone") as string;

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: nome });

        await setDoc(doc(db, "contas_acesso", email), {
          nome: nome,
          email: email,
          telefone: telefone,
          uid_auth: user.uid,
          cargo: "Membro",
          criado_em: new Date().toISOString(),
          foto: "https://www.w3schools.com/howto/img_avatar.png"
        });

        navigate("/admin");
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setError("Este e-mail já está cadastrado.");
      else if (err.code === 'auth/wrong-password') setError("Senha incorreta.");
      else if (err.code === 'auth/user-not-found') setError("Usuário não encontrado.");
      else if (err.code === 'auth/weak-password') setError("A senha deve ser mais forte.");
      else setError("Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-900">
      <div className="glass w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
        
        {/* ABAS */}
        <div className="flex text-center font-bold text-sm tracking-widest uppercase cursor-pointer">
          <div 
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-6 transition-colors ${
              isLogin 
                ? "bg-white text-emerald-900 border-b-4 border-emerald-600" 
                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
            }`}
          >
            Entrar
          </div>
          <div 
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-6 transition-colors ${
              !isLogin 
                ? "bg-white text-emerald-900 border-b-4 border-emerald-600" 
                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
            }`}
          >
            Cadastrar
          </div>
        </div>

        <div className="p-10 bg-white/60 backdrop-blur-md">
          
          <div className="text-center mb-6">
            <h2 className="font-display text-3xl font-bold text-slate-800">
              {isLogin ? "Bem-vindo de volta" : "Crie sua conta"}
            </h2>
          </div>

          {/* BOTÃO GOOGLE */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm mb-6"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            <span>Continuar com Google</span>
          </button>

          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-slate-300"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase">Ou use e-mail</span>
            <div className="flex-grow border-t border-slate-300"></div>
          </div>

          {/* FORMULÁRIO EMAIL/SENHA */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-1">NOME</label>
                  <input name="nome" required placeholder="Seu nome" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-emerald-500 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-1">TELEFONE</label>
                  <input name="telefone" required placeholder="(00) 00000-0000" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-emerald-500 transition-all" />
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">E-MAIL</label>
              <input name="email" type="email" required placeholder="email@exemplo.com" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-emerald-500 transition-all" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">SENHA</label>
              <input name="password" type="password" required placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-emerald-500 transition-all" />
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center border border-red-100">{error}</div>}

            <button disabled={loading} className="w-full bg-emerald-900 text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-emerald-800 transition-all shadow-lg mt-4 disabled:opacity-70">
              {loading ? "Processando..." : (isLogin ? "Entrar" : "Cadastrar")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}