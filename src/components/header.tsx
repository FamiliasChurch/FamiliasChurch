import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { NavHashLink as HashLink } from 'react-router-hash-link';
import { db, auth } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { collection, query, orderBy, limit, onSnapshot, doc } from "firebase/firestore";
import { Menu, X, Bell, LogOut, Shield, UserPlus, MessageCircle, DollarSign, Sparkles, User, Cake, Trash2 } from "lucide-react";
import logoIgreja from "../assets/logo.webp";

interface Notificacao {
  id: string;
  titulo?: string;
  nome?: string;
  conteudo?: string;
  valor?: string;
  local?: string;
  dataReal?: any;
  tipoNotificacao: 'social' | 'evento';
  urgent?: boolean;
}

export default function Header({ userRole, userName }: { userRole: string, userName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [notificacoesAberto, setNotificacoesAberto] = useState(false);
  const [notificacoesRaw, setNotificacoesRaw] = useState<Notificacao[]>([]);
  const [idsIgnorados, setIdsIgnorados] = useState<string[]>([]);
  const [userPhoto, setUserPhoto] = useState("");
  const [userAge, setUserAge] = useState<number | null>(null);
  const [ministerioUsuario, setMinisterioUsuario] = useState<string | null>(null);

  const navigate = useNavigate();

  const navLinks = [
    { name: "Início", href: "/#inicio" },
    { name: "Quem Somos", href: "/#sobre" },
    { name: "Cultos", href: "/#cultos" },
    { name: "Ministérios", href: "/#ministerios" },
    { name: "Devocionais", href: "/devocionais" },
    { name: "Eventos", href: "/eventos" },
    { name: "Doações", href: "/doacoes" },
  ];

  const rolesRelevantes = ["Dev", "Apóstolo", "Pastor", "Secretaria", "Mídia"];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMenuAberto(false);
      setIsOpen(false);
      navigate("/");
    } catch (error) { console.error(error); }
  };

  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return null;
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  // --- BUSCA NOTIFICAÇÕES EM REALTIME ---
  useEffect(() => {
    const colecaoPrincipal = ["Secretaria", "Apóstolo", "Dev"].includes(userRole) ? "registros_dizimos" : "pedidos_oracao";
    const qPrincipal = query(collection(db, colecaoPrincipal), orderBy("data", "desc"), limit(4));
    return onSnapshot(qPrincipal, (snap) => {
      setNotificacoesRaw(snap.docs.map(d => ({ id: d.id, ...d.data(), tipoNotificacao: 'social' as const })) as Notificacao[]);
    });
  }, [userRole]);

  const notificacoesVisiveis = notificacoesRaw.filter(n => !idsIgnorados.includes(n.id));
  const limparNotificacoes = () => setIdsIgnorados(prev => [...prev, ...notificacoesVisiveis.map(n => n.id)]);

  // --- MONITORAMENTO DE PERFIL E MINISTÉRIO ---
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user && user.email) {
        const unsubDoc = onSnapshot(doc(db, "contas_acesso", user.email), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserPhoto(data.foto || "");
            if (data.nascimento) setUserAge(calculateAge(data.nascimento));
          }
        });

        const unsubMin = onSnapshot(collection(db, "ministerios_info"), (snap) => {
          let minEncontrado = null;
          snap.docs.forEach(docMin => {
            const equipe = docMin.data().equipe || [];
            if (equipe.some((membro: any) => membro.id === user.email)) {
              minEncontrado = docMin.data().titulo;
            }
          });
          setMinisterioUsuario(minEncontrado);
        });

        return () => { unsubDoc(); unsubMin(); };
      } else {
        setUserPhoto("");
        setUserAge(null);
        setMinisterioUsuario(null);
      }
    });
    return () => unsubAuth();
  }, []);

  const mostrarMinisterio = !rolesRelevantes.includes(userRole);
  const displayPhoto = userPhoto || "https://www.w3schools.com/howto/img_avatar.png";

  return (
    <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md h-20 flex items-center border-b border-n-borda">
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoIgreja} className="w-10 h-10 rounded-full border-2 border-blue-600 object-cover" alt="Logo" />
          <span className="font-display text-2xl font-bold text-n-texto uppercase tracking-tighter">FAMÍLIAS CHURCH</span>
        </Link>

        {/* VERSÃO DESKTOP */}
        <nav className="hidden lg:flex items-center gap-8">
          <ul className="flex gap-6 text-[11px] font-bold uppercase tracking-widest text-n-suave">
            {navLinks.map((link) => (
              <li key={link.name}>
                <HashLink
                  smooth
                  to={link.href}
                  className="text-sm font-bold transition-all text-slate-600 hover:text-blue-600"
                >
                  {link.name}
                </HashLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4 pl-4 border-l border-n-borda relative">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setNotificacoesAberto(!notificacoesAberto);
                  setMenuAberto(false);
                }}
                className={`p-2.5 rounded-xl transition-all ${notificacoesAberto ? 'bg-blue-50 text-blue-600' : 'text-n-suave hover:bg-gray-50'}`}
              >
                <Bell size={22} />
                {notificacoesVisiveis.length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border border-white animate-pulse" />
                )}
              </button>

              {notificacoesAberto && (
                <div className="absolute right-0 top-full mt-4 w-80 bg-white rounded-[2rem] border border-n-borda shadow-2xl z-[60] overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-5 border-b border-n-borda bg-gray-50/50 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-n-texto">Atividade</span>
                    <Sparkles size={14} className="text-blue-500 opacity-50" />
                  </div>
                  <div className="max-h-[350px] overflow-y-auto">
                    {notificacoesVisiveis.length > 0 ? (
                      notificacoesVisiveis.map((n) => (
                        <div key={n.id} className="p-4 border-b border-n-borda/40 flex gap-4 hover:bg-gray-50 transition-colors">
                          <div className={`p-2 rounded-full h-fit bg-blue-50 text-blue-600`}>
                            {n.valor ? <DollarSign size={14} /> : <MessageCircle size={14} />}
                          </div>
                          <div className="flex-1">
                            <p className="text-[11px] font-black text-n-texto uppercase">{n.nome || "Novo Pedido"}</p>
                            <p className="text-[10px] text-n-suave line-clamp-2 leading-relaxed italic">{n.conteudo || `Semente de R$ ${n.valor}`}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center">
                        <p className="text-[10px] font-bold text-n-suave uppercase tracking-widest opacity-40">Sem novidades</p>
                      </div>
                    )}
                  </div>
                  {notificacoesVisiveis.length > 0 && (
                    <div className="p-3 bg-gray-50 border-t border-n-borda text-center">
                      <button onClick={limparNotificacoes} className="text-[9px] font-black uppercase text-blue-600 hover:underline flex items-center justify-center gap-2 w-full">
                        <Trash2 size={12} /> Limpar Tudo
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuAberto(!menuAberto);
                  setNotificacoesAberto(false);
                }}
                className="border-2 border-blue-500 rounded-full p-0.5 w-10 h-10 overflow-hidden hover:shadow-lg transition-all"
              >
                <img src={displayPhoto} className="w-full h-full object-cover rounded-full" alt="Perfil" />
              </button>

              {menuAberto && (
                <div className="absolute right-0 top-full mt-4 w-72 bg-white p-6 rounded-[2.5rem] border border-n-borda shadow-2xl z-[60] animate-in fade-in zoom-in duration-200">
                  {userName === "Convidado" ? (
                    <Link
                      to="/login"
                      onClick={() => setMenuAberto(false)}
                      className="w-full bg-blue-600 text-white py-4 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                      <UserPlus size={14} /> Entrar / Cadastrar
                    </Link>
                  ) : (
                    <div>
                      <div className="flex items-center gap-4 mb-6">
                        <img src={displayPhoto} alt="Foto Painel" className="w-14 h-14 rounded-full object-cover border-2 border-blue-500/20 shadow-sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase font-black text-blue-500 tracking-widest mb-0.5">{userRole}</p>
                          <p className="font-display text-lg leading-tight truncate text-n-texto">{userName}</p>
                          {mostrarMinisterio && ministerioUsuario && (
                            <p className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded mt-1 inline-block uppercase">
                              Min. {ministerioUsuario}
                            </p>
                          )}
                          {userAge !== null && (
                            <div className="flex items-center gap-1 mt-1 text-n-suave">
                              <Cake size={10} />
                              <p className="text-[10px] font-bold uppercase tracking-wider">{userAge} Anos</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-n-borda pt-4">
                        <Link to="/perfil" onClick={() => setMenuAberto(false)} className="flex items-center gap-3 p-3 rounded-xl text-[10px] font-black uppercase text-n-texto hover:bg-gray-50 transition-all group">
                          <div className="p-1.5 bg-gray-100 rounded-lg group-hover:bg-white transition-colors">
                            <User size={14} />
                          </div>
                          Meu Perfil
                        </Link>

                        {rolesRelevantes.includes(userRole) && (
                          <Link to="/admin" onClick={() => setMenuAberto(false)} className="flex items-center gap-3 p-3 rounded-xl text-[10px] font-black uppercase text-n-texto hover:bg-gray-50 transition-all group">
                            <div className="p-1.5 bg-gray-100 rounded-lg group-hover:bg-white transition-colors">
                              <Shield size={14} />
                            </div>
                            Painel Administrativo
                          </Link>
                        )}

                        <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-xl text-[10px] font-black uppercase text-red-500 hover:bg-red-50 transition-all w-full text-left mt-2 group">
                          <div className="p-1.5 bg-red-50 rounded-lg group-hover:bg-white transition-colors">
                            <LogOut size={14} />
                          </div>
                          Sair do Sistema
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* MOBILE TOGGLE */}
        <button className="lg:hidden text-blue-600 p-2" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {isOpen && (
        <div className="absolute top-20 left-0 w-full bg-white border-b border-n-borda py-8 flex flex-col items-center gap-5 lg:hidden animate-in slide-in-from-top duration-300 shadow-xl z-[40]">
          {navLinks.map((link) => (
            <HashLink 
              key={link.name} 
              smooth to={link.href} 
              onClick={() => setIsOpen(false)} 
              className="text-lg font-bold uppercase tracking-widest text-n-texto hover:text-blue-600 transition-colors"
            >
              {link.name}
            </HashLink>
          ))}

          {/* Link Admin para Mobile */}
          {rolesRelevantes.includes(userRole) && (
            <Link 
              to="/admin" 
              onClick={() => setIsOpen(false)} 
              className="flex items-center gap-2 text-lg font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-6 py-2 rounded-xl border border-blue-100"
            >
              <Shield size={18} /> Painel Admin
            </Link>
          )}

          {userName === "Convidado" ? (
            <Link to="/login" onClick={() => setIsOpen(false)} className="mt-4 bg-blue-600 text-white px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
              Entrar na Conta
            </Link>
          ) : (
            <div className="flex flex-col gap-4 w-full px-10 items-center border-t border-n-borda pt-6 mt-2">
              <div className="flex items-center gap-4 w-full justify-center">
                <img src={displayPhoto} className="w-12 h-12 rounded-full border-2 border-blue-500 object-cover" alt="Mobile Perfil" />
                <div className="text-left">
                  <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{userRole}</p>
                  <p className="font-display text-lg text-n-texto leading-none">{userName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full">
                <Link to="/perfil" onClick={() => setIsOpen(false)} className="bg-blue-50 text-blue-600 text-center py-4 rounded-full text-[10px] font-black uppercase tracking-widest">Meu Perfil</Link>
                <button onClick={handleLogout} className="bg-red-50 text-red-500 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-red-100">Sair</button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
