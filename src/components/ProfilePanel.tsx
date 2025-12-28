import { useState, useEffect } from "react";
import { LogOut, User, Shield, BookOpen, Calendar, DollarSign, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

declare global { interface Window { netlifyIdentity: any; } }

export default function ProfilePanel() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const identity = window.netlifyIdentity;
    if (!identity) return;

    identity.on("login", (u: any) => {
      setUser(u);
      fetchUserData(u.id);
      setIsOpen(false);
    });
    identity.on("logout", () => { setUser(null); setUserData(null); });
    
    const currentUser = identity.currentUser();
    if (currentUser) { setUser(currentUser); fetchUserData(currentUser.id); }
  }, []);

  const fetchUserData = async (uid: string) => {
    const d = await getDoc(doc(db, "usuarios", uid));
    if (d.exists()) setUserData(d.data());
  };

  if (!user) {
    return (
      <button 
        onClick={() => window.netlifyIdentity.open()}
        className="bg-destaque text-primaria px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform"
      >
        Entrar
      </button>
    );
  }

  const role = userData?.cargo || "Congregado";

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="border-2 border-destaque rounded-full p-0.5 transition-transform hover:scale-105">
        <img src={userData?.foto || "https://www.w3schools.com/howto/img_avatar.png"} className="w-10 h-10 rounded-full object-cover" alt="Perfil" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-72 glass p-6 rounded-[2rem] border border-white/10 shadow-glow animate-in fade-in slide-in-from-top-2">
          <div className="text-center space-y-3 mb-6">
            <img src={userData?.foto || "https://www.w3schools.com/howto/img_avatar.png"} className="w-20 h-20 rounded-full mx-auto border-4 border-destaque/20" alt="Avatar" />
            <div>
              <h2 className="font-display text-2xl text-destaque leading-none">{userData?.nome || user.user_metadata?.full_name}</h2>
              <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-bold mt-1">Cargo: {role}</p>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            <Link to="/perfil" className="flex items-center gap-3 bg-white/5 hover:bg-white/10 p-3 rounded-xl text-[10px] font-bold uppercase transition-all">
              <User size={14} className="text-destaque" /> Meu Perfil
            </Link>

            {/* ACESSOS POR CARGO */}
            {(role === "Secretaria" || role === "Apóstolo" || role === "Dev") && (
              <Link to="/admin" className="flex items-center gap-3 bg-white/5 hover:bg-destaque hover:text-primaria p-3 rounded-xl text-[10px] font-bold uppercase transition-all">
                <DollarSign size={14} /> Gestão Financeira
              </Link>
            )}

            {(role === "Apóstolo" || role === "Dev") && (
              <Link to="/membros" className="flex items-center gap-3 bg-white/5 hover:bg-white/10 p-3 rounded-xl text-[10px] font-bold uppercase transition-all">
                <Users size={14} className="text-destaque" /> Lista de Membros
              </Link>
            )}

            {(role === "Pastor" || role === "Apóstolo" || role === "Dev") && (
              <Link to="/estudos" className="flex items-center gap-3 bg-white/5 hover:bg-white/10 p-3 rounded-xl text-[10px] font-bold uppercase transition-all">
                <BookOpen size={14} className="text-destaque" /> Devocionais
              </Link>
            )}

            {(role === "Mídia" || role === "Apóstolo" || role === "Dev") && (
              <Link to="/gestao-eventos" className="flex items-center gap-3 bg-white/5 hover:bg-white/10 p-3 rounded-xl text-[10px] font-bold uppercase transition-all">
                <Calendar size={14} className="text-destaque" /> Eventos & Ministérios
              </Link>
            )}

            <button onClick={() => window.netlifyIdentity.logout()} className="flex items-center justify-center gap-2 mt-4 text-red-400 text-[9px] font-bold uppercase tracking-widest hover:text-red-300 transition-colors">
              <LogOut size={14} /> Sair da Conta
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}