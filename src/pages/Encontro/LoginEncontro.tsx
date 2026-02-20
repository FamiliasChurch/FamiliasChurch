import { useState } from "react";
import { db } from "../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { LogIn, Loader2, ShieldCheck, Mail, Lock } from "lucide-react";

export default function LoginEncontro() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro("");

    try {
      const colecoes = ["encontro_inscritos", "encontro_servos"];
      let usuarioEncontrado = null;
      let tipo = "";

      for (const col of colecoes) {
        const q = query(collection(db, col), where("email", "==", email), where("senha", "==", senha));
        const snap = await getDocs(q);
        if (!snap.empty) {
          usuarioEncontrado = { id: snap.docs[0].id, ...snap.docs[0].data() };
          tipo = col === "encontro_inscritos" ? "encontrista" : "servo";
          break;
        }
      }

      if (usuarioEncontrado) {
        localStorage.setItem("sessao_encontro", JSON.stringify({ ...usuarioEncontrado, tipo }));
        navigate("/encontro/dashboard"); 
      } else {
        setErro("E-mail ou senha incorretos para este encontro.");
      }
    } catch (err) {
      setErro("Falha na conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50/30 flex items-center justify-center p-6 font-body">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-10 md:p-12 border border-blue-100 shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-600/10 rounded-2xl text-blue-600 mb-2">
            <LogIn size={32} />
          </div>
          <h1 className="font-display text-4xl font-bold text-slate-900 uppercase tracking-tighter text-left">Área do <span className="text-blue-600">Encontrista</span></h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest text-left">Acesse seus dados e QR Code</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="email" placeholder="Seu e-mail de inscrição" required
              className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl outline-none focus:border-blue-400 text-sm transition-all"
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="password" placeholder="Sua senha" required
              className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl outline-none focus:border-blue-400 text-sm transition-all"
              onChange={e => setSenha(e.target.value)}
            />
          </div>

          {erro && <p className="text-red-500 text-[9px] font-black uppercase text-center bg-red-50 p-3 rounded-xl">{erro}</p>}

          <button 
            disabled={carregando}
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
          >
            {carregando ? <Loader2 className="animate-spin" /> : <ShieldCheck size={18} />}
            Acessar Minha Ficha
          </button>
        </form>
      </div>
    </div>
  );
}