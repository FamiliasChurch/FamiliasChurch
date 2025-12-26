import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { NavHashLink as HashLink } from 'react-router-hash-link';
import { db } from "../lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";
import { Menu, X, Bell, LogOut, Shield, UserPlus, MessageCircle, DollarSign, Calendar, Sparkles } from "lucide-react";
import logoIgreja from "../assets/logo.jpg";
import fotoApostolo from "../assets/Ap.jpg";

interface Notificacao {
  id: string;
  titulo?: string;
  nome?: string;
  conteudo?: string;
  valor?: string;
  local?: string;
  dataReal?: any;
  tipoNotificacao: 'social' | 'evento';
  urgente?: boolean;
}

export default function Header({ userRole, userName }: { userRole: string, userName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [notificacoesAberto, setNotificacoesAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const navigate = useNavigate();

  const navLinks = [
    { name: "Início", href: "/#inicio" },
    { name: "Cultos", href: "/#cultos" },
    { name: "Ministérios", href: "/#ministerios" },
    { name: "Quem Somos", href: "/#sobre" },
    { name: "Eventos", href: "/#eventos" },
    { name: "Doações", href: "/doacoes" },
  ];

  const abrirLogin = () => {
    // @ts-ignore
    if (window.netlifyIdentity) {
      window.netlifyIdentity.open();
      setMenuAberto(false);
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    // @ts-ignore
    const netlifyIdentity = window.netlifyIdentity;
    if (netlifyIdentity) {
      netlifyIdentity.logout();
      setMenuAberto(false);
      navigate("/");
    }
  };

  useEffect(() => {
    const colecaoPrincipal = ["Tesoureira", "Apóstolo", "Dev"].includes(userRole) 
      ? "registros_dizimos" 
      : "pedidos_oracao";

    const qPrincipal = query(collection(db, colecaoPrincipal), orderBy("data", "desc"), limit(4));
    
    const unsub = onSnapshot(qPrincipal, (snap) => {
      const docs = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(), 
        tipoNotificacao: 'social' as const 
      }));
      setNotificacoes(docs as Notificacao[]);
    });
    return () => unsub();
  }, [userRole]);

  const scrollWithOffset = (el: HTMLElement) => {
    const yCoordinate = el.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({ top: yCoordinate - 80, behavior: 'smooth' }); 
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md h-20 flex items-center border-b border-n-borda transition-all">
      <div className="container mx-auto px-6 flex justify-between items-center">

        <Link to="/" className="flex items-center gap-3">
          <img src={logoIgreja} className="w-10 h-10 rounded-full border-2 border-primaria object-cover" alt="Logo" />
          <span className="font-display text-2xl font-bold text-n-texto uppercase tracking-tighter">FAMÍLIAS CHURCH</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          <ul className="flex gap-6 text-[11px] font-bold uppercase tracking-widest text-n-suave">
            {navLinks.map((link) => (
              <li key={link.name}>
                <HashLink smooth to={link.href} scroll={scrollWithOffset} className="hover:text-primaria transition-colors">
                  {link.name}
                </HashLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4 pl-4 border-l border-n-borda relative">
            
            {/* SININHO RENOVADO */}
            <div className="relative">
              <button 
                onClick={() => { setNotificacoesAberto(!notificacoesAberto); setMenuAberto(false); }}
                className={`transition-all p-2.5 rounded-xl relative ${notificacoesAberto ? 'bg-primaria/10 text-primaria' : 'text-n-suave hover:text-primaria hover:bg-gray-50'}`}
              >
                <Bell size={22} />
                {notificacoes.length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border border-white" />
                )}
              </button>

              {/* DROPDOWN DE NOTIFICAÇÕES - AGORA LARGO E BONITO */}
              {notificacoesAberto && (
                <div className="absolute right-0 top-full mt-4 w-80 bg-white rounded-[2rem] border border-n-borda shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in zoom-in duration-200 z-50">
                  <div className="p-5 border-b border-n-borda bg-gray-50/50 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-n-texto">Atividade Recente</span>
                    <Sparkles size={14} className="text-primaria opacity-50" />
                  </div>

                  <div className="max-h-[350px] overflow-y-auto">
                    {notificacoes.length > 0 ? (
                      notificacoes.map((n) => (
                        <div key={n.id} className="p-4 border-b border-n-borda/40 last:border-0 hover:bg-gray-50 transition-colors flex gap-4">
                          <div className={`mt-1 p-2 rounded-full h-fit ${n.valor ? 'bg-primaria/10 text-primaria' : 'bg-blue-50 text-blue-600'}`}>
                            {n.valor ? <DollarSign size={14} /> : <MessageCircle size={14} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-n-texto uppercase tracking-tight mb-0.5">
                              {n.nome || "Novo Pedido de Oração"}
                            </p>
                            <p className="text-[10px] text-n-suave line-clamp-2 leading-relaxed italic">
                              {n.conteudo || `Semente de R$ ${n.valor}`}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center">
                        <p className="text-[10px] font-bold text-n-suave uppercase tracking-widest opacity-40">Sem novidades</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-gray-50 border-t border-n-borda text-center">
                    <button className="text-[9px] font-black uppercase text-primaria hover:underline">Limpar Tudo</button>
                  </div>
                </div>
              )}
            </div>

            {/* BOTÃO PERFIL */}
            <div className="relative">
              <button
                onClick={() => { setMenuAberto(!menuAberto); setNotificacoesAberto(false); }}
                className="border-2 border-primaria rounded-full p-0.5 w-10 h-10 overflow-hidden hover:shadow-lg transition-all"
              >
                <img src={userName === "Convidado" ? "https://www.w3schools.com/howto/img_avatar.png" : fotoApostolo} className="w-full h-full object-cover rounded-full" alt="Perfil" />
              </button>

              {/* PAINEL FLUTUANTE DE PERFIL */}
              {menuAberto && (
                <div className="absolute right-0 top-full mt-4 w-64 bg-white p-6 rounded-[2.5rem] border border-n-borda shadow-2xl animate-in fade-in zoom-in duration-200 z-50 text-n-texto">
                  {userName === "Convidado" ? (
                    <button onClick={abrirLogin} className="w-full bg-primaria text-white py-4 rounded-full font-bold text-[10px] uppercase tracking-widest hover:brightness-110 shadow-lg shadow-primaria/20 transition-all flex items-center justify-center gap-2">
                      <UserPlus size={14} /> Entrar / Cadastrar
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] uppercase font-black text-primaria tracking-widest mb-1">{userRole}</p>
                        <p className="font-display text-xl leading-none truncate">{userName}</p>
                      </div>
                      <div className="space-y-2 border-t border-n-borda pt-4">
                        {["Dev", "Apóstolo", "Tesoureira"].includes(userRole) && (
                          <Link to="/admin" onClick={() => setMenuAberto(false)} className="flex items-center gap-3 p-2 rounded-xl text-[10px] font-black uppercase hover:bg-gray-50 hover:text-primaria transition-all">
                            <Shield size={14} /> Painel Administrativo
                          </Link>
                        )}
                        <button onClick={handleLogout} className="flex items-center gap-3 p-2 rounded-xl text-[10px] font-black uppercase text-n-suave hover:bg-red-50 hover:text-red-600 w-full text-left transition-all">
                          <LogOut size={14} /> Sair do Sistema
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>

        <button className="lg:hidden text-primaria p-2" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* MENU MOBILE */}
      {isOpen && (
        <div className="absolute top-20 left-0 w-full bg-white border-b border-n-borda py-10 flex flex-col items-center gap-6 lg:hidden animate-in slide-in-from-top duration-300 shadow-xl">
          {navLinks.map((link) => (
            <HashLink 
              key={link.name} 
              smooth 
              to={link.href} 
              scroll={scrollWithOffset} 
              onClick={() => setIsOpen(false)} 
              className="text-lg font-bold uppercase tracking-widest text-n-texto hover:text-primaria"
            >
              {link.name}
            </HashLink>
          ))}
          <button onClick={abrirLogin} className="mt-4 bg-primaria text-white px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
            {userName === "Convidado" ? "Entrar na Conta" : `Sair (${userName})`}
          </button>
        </div>
      )}
    </header>
  );
}