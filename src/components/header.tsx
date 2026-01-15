import { useState, useEffect } from "react";
import { createPortal } from "react-dom"; // <--- IMPORTANTE: Import para o Portal
import { Link, useNavigate } from "react-router-dom";
import { HashLink } from 'react-router-hash-link';
import { db, auth } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { collection, onSnapshot, doc, query, orderBy } from "firebase/firestore";
import { Menu, X, LogOut, Shield, UserPlus, User, Calendar, ChevronRight } from "lucide-react";
import logoIgreja from "../assets/logo.webp";
import NotificationBell from "./NotificationBell"; 
import InstallPWA from "./InstallPWA";

const NAV_LINKS = [
  { name: "Início", href: "/#inicio" },
  { name: "Quem Somos", href: "/#sobre" },
  { name: "Cultos", href: "/#cultos" },
  { name: "Devocionais", href: "/devocionais" },
  { name: "Eventos", href: "/eventos" },
  { name: "Doações", href: "/doacoes" },
];

const SYSTEM_ACCESS_ROLES = ["Dev", "Admin", "Gerenciador", "Moderador", "Publicador", "Midia", "Mídia"];

const hasPanelAccess = (permissao?: string, cargo?: string) => {
    const p = (permissao || "").toLowerCase();
    const c = (cargo || "").toLowerCase();
    const hasSystemRole = SYSTEM_ACCESS_ROLES.some(role => p.includes(role.toLowerCase()));
    const isSupremeLeader = ["apóstolo", "apostolo", "pastor", "pastora", "secretaria"].some(r => c.includes(r));
    return hasSystemRole || isSupremeLeader;
};

// --- MODAL DE MINHAS ESCALAS (COM PORTAL) ---
const MyScalesModal = ({ isOpen, onClose, escalas }: { isOpen: boolean, onClose: () => void, escalas: any[] }) => {
    if (!isOpen) return null;

    // createPortal joga esse HTML direto no <body>, fugindo do header
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
                    <h3 className="text-sm font-black uppercase text-indigo-800 flex items-center gap-2">
                        <Calendar size={16} /> Minhas Escalas
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-white rounded-full transition-colors text-indigo-400">
                        <X size={16} />
                    </button>
                </div>
                <div className="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {escalas.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-6">Nenhuma escala futura encontrada.</p>
                    ) : (
                        escalas.map((escala: any) => {
                            const data = new Date(escala.dataCulto + "T12:00:00");
                            return (
                                <Link 
                                    key={escala.id} 
                                    to={`/escala/${escala.id}`} 
                                    onClick={onClose}
                                    className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl group transition-colors border-b border-slate-50 last:border-0"
                                >
                                    <div>
                                        <p className="text-xs font-bold text-slate-700">{escala.ministerio || "Culto Geral"}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                            {data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                                        </p>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                </Link>
                            )
                        })
                    )}
                </div>
            </div>
        </div>,
        document.body // Alvo do Portal
    );
}

// --- 1. MENU DESKTOP ---
const DesktopNav = ({ user, userData, onLogout, minhasEscalas }: any) => {
  const [menuAberto, setMenuAberto] = useState(false);
  const [showScalesModal, setShowScalesModal] = useState(false);
  const displayPhoto = userData.foto || "https://www.w3schools.com/howto/img_avatar.png";
  const deveMostrarMinisterio = userData.cargo !== "Dev" && userData.ministerio;
  const showAdminButton = hasPanelAccess(userData.permissao, userData.cargo);

  return (
    <>
    <div className="hidden lg:flex items-center gap-8">
      <nav className="absolute left-1/2 -translate-x-1/2">
        <ul className="flex gap-8 text-[11px] font-bold uppercase tracking-widest text-slate-500">
          {NAV_LINKS.map((link) => (
            <li key={link.name}>
              <HashLink smooth to={link.href} className="hover:text-blue-600 transition-colors py-2 whitespace-nowrap">
                {link.name}
              </HashLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex items-center gap-4 ml-auto">
        
        {/* BOTÃO ESCALAS - FORA DO DROPDOWN (VISÍVEL SE TIVER ESCALAS) */}
        {user && minhasEscalas.length > 0 && (
            <button 
                onClick={() => setShowScalesModal(true)} 
                className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors text-[10px] font-bold uppercase tracking-wider border border-indigo-100"
                title="Minhas Escalas"
            >
                <Calendar size={16} /> 
                <span>Minhas Escalas ({minhasEscalas.length})</span>
            </button>
        )}

        <div className="relative">
            {user && <NotificationBell />}
        </div>

        <div className="relative pl-4 border-l border-slate-200">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuAberto(!menuAberto); }}
            className="border-2 border-blue-500 rounded-full p-0.5 w-10 h-10 overflow-hidden hover:shadow-lg transition-all active:scale-95"
          >
            <img src={displayPhoto} className="w-full h-full object-cover rounded-full" alt="Perfil" />
          </button>

          {menuAberto && (
            <div className="absolute right-0 top-full mt-4 w-72 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-2xl z-[60] animate-in fade-in zoom-in duration-200"
                 onClick={(e) => e.stopPropagation()}> 
              
              {!user ? (
                <Link to="/login" onClick={() => setMenuAberto(false)} className="w-full bg-blue-600 text-white py-4 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg">
                  <UserPlus size={14} /> Entrar / Cadastrar
                </Link>
              ) : (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <img src={displayPhoto} className="w-14 h-14 rounded-full object-cover border-2 border-blue-500/20 shadow-sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase font-black text-blue-500 tracking-widest mb-0.5">{userData.cargo}</p>
                      <p className="font-display text-lg leading-tight truncate text-slate-800">{userData.nome}</p>
                      {deveMostrarMinisterio && <p className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded mt-1 inline-block uppercase">Min. {userData.ministerio}</p>}
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 pt-4">
                    <Link to="/perfil" onClick={() => setMenuAberto(false)} className="flex items-center gap-3 p-3 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 transition-all group">
                      <div className="p-1.5 bg-slate-100 rounded-lg group-hover:bg-white transition-colors"><User size={14} /></div> Meu Perfil
                    </Link>
                    
                    {showAdminButton && (
                      <Link to="/admin" onClick={() => setMenuAberto(false)} className="flex items-center gap-3 p-3 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 transition-all group">
                        <div className="p-1.5 bg-slate-100 rounded-lg group-hover:bg-white transition-colors"><Shield size={14} /></div> Painel Admin
                      </Link>
                    )}

                    <button onClick={onLogout} className="flex items-center gap-3 p-3 rounded-xl text-[10px] font-black uppercase text-red-500 hover:bg-red-50 transition-all w-full text-left mt-2 group">
                      <div className="p-1.5 bg-red-50 rounded-lg group-hover:bg-white transition-colors"><LogOut size={14} /></div> Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {menuAberto && <div className="fixed inset-0 z-50" onClick={() => setMenuAberto(false)} />}
        </div>
      </div>
    </div>
    
    <MyScalesModal isOpen={showScalesModal} onClose={() => setShowScalesModal(false)} escalas={minhasEscalas} />
    </>
  );
};

// --- 2. MENU MOBILE ---
const MobileMenu = ({ isOpen, setIsOpen, user, userData, onLogout, minhasEscalas }: any) => {
  const [showScalesModal, setShowScalesModal] = useState(false);
  const displayPhoto = userData.foto || "https://www.w3schools.com/howto/img_avatar.png";
  const deveMostrarMinisterio = userData.cargo !== "Dev" && userData.ministerio;
  const showAdminButton = hasPanelAccess(userData.permissao, userData.cargo);

  useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden'; } else { document.body.style.overflow = 'unset'; }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <>
    <div className="lg:hidden">
      <div className="flex items-center gap-2 relative z-[60]">
        <div className={`flex items-center gap-2 transition-opacity duration-200 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            
            {/* BOTÃOZINHO DE ESCALAS MOBILE (SÓ ÍCONE) */}
            {user && minhasEscalas.length > 0 && (
                <button 
                    onClick={() => setShowScalesModal(true)} 
                    className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                >
                    <Calendar size={22} />
                </button>
            )}

            {user && <NotificationBell />}
        </div>
        <button className={`p-2 transition-colors ${isOpen ? 'text-white' : 'text-blue-600'}`} onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {isOpen && (
        <div 
            className="fixed inset-0 z-50 animate-in fade-in duration-300 flex flex-col h-[100dvh] w-full bg-black/60 backdrop-blur-xl"
            onClick={() => setIsOpen(false)}
        >
          <div 
            className="flex-1 flex flex-col pt-24 pb-safe relative overflow-y-auto"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="px-8 mb-6"><InstallPWA /></div>

            <div className="flex flex-col items-center gap-6 px-8">
              {NAV_LINKS.map((link) => (
                <HashLink smooth key={link.name} to={link.href} onClick={() => setIsOpen(false)} 
                  className="inline-block py-2 px-6 text-center text-sm font-black uppercase tracking-[0.2em] text-white hover:text-blue-400 transition-colors drop-shadow-md">
                  {link.name}
                </HashLink>
              ))}
            </div>

            <div className="mt-auto w-full p-6 bg-black/40 backdrop-blur-md border-t border-white/10">
              {!user ? (
                <Link to="/login" onClick={() => setIsOpen(false)} className="w-full flex items-center justify-center bg-blue-600 text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg gap-2 border border-blue-400/30">
                  <UserPlus size={16}/> Entrar na Conta
                </Link>
              ) : (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-4">
                      <img src={displayPhoto} className="w-12 h-12 rounded-full border-2 border-white/20 shadow-lg object-cover" />
                      <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-lg truncate drop-shadow-md">{userData.nome}</p>
                          <p className="text-[10px] font-black uppercase tracking-wider text-blue-400 truncate mt-0.5">
                            {userData.cargo}
                            {deveMostrarMinisterio && <span className="text-gray-400"> • {userData.ministerio}</span>}
                          </p>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                      <Link to="/perfil" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-wide hover:bg-white/20 transition-all">
                          <User size={14} /> Perfil
                      </Link>
                      <button onClick={() => { onLogout(); setIsOpen(false); }} className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-red-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-wide hover:bg-red-900/30 transition-all">
                          <LogOut size={14} /> Sair
                      </button>
                  </div>
                  
                  {/* Mantivemos o botão grande também dentro do menu, pois é boa UX ter ambos */}
                  {minhasEscalas.length > 0 && (
                      <button onClick={() => { setIsOpen(false); setShowScalesModal(true); }} className="w-full flex items-center justify-center gap-2 bg-indigo-600/40 border border-indigo-500/30 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-wide shadow-md hover:bg-indigo-600">
                          <Calendar size={14} /> Minhas Escalas ({minhasEscalas.length})
                      </button>
                  )}

                  {showAdminButton && (
                      <Link to="/admin" onClick={() => setIsOpen(false)} className="w-full flex items-center justify-center gap-2 bg-blue-600/40 border border-blue-500/30 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-wide shadow-md hover:bg-blue-600">
                          <Shield size={14} /> Painel Admin
                      </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    
    <MyScalesModal isOpen={showScalesModal} onClose={() => setShowScalesModal(false)} escalas={minhasEscalas} />
    </>
  );
};

// --- 3. HEADER PRINCIPAL ---
export default function Header({ userRole, userName }: { userRole: string, userName: string }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userData, setUserData] = useState({
    nome: userName,
    cargo: userRole,
    permissao: "",
    foto: "",
    ministerio: null as string | null,
    idade: null as number | null
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [minhasEscalas, setMinhasEscalas] = useState<any[]>([]);
  const navigate = useNavigate();

  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return null;
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user && user.email) {
        const unsubDoc = onSnapshot(doc(db, "contas_acesso", user.email), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData(prev => ({
              ...prev,
              nome: data.nome || user.displayName || "Membro",
              cargo: data.cargo || "Membro",
              permissao: data.permissao || "",
              foto: data.foto || "",
              idade: calculateAge(data.nascimento)
            }));
          }
        });

        // Buscar ministério
        const unsubMin = onSnapshot(collection(db, "ministerios_info"), (snap) => {
          let minEncontrado: string | null = null; 
          snap.docs.forEach(docMin => {
            const equipe = docMin.data().equipe || [];
            if (equipe.some((membro: any) => membro.id === user.email)) {
              minEncontrado = docMin.data().titulo;
            }
          });
          setUserData(prev => ({ ...prev, ministerio: minEncontrado }));
        });

        // BUSCAR ESCALAS DO USUÁRIO
        const qEscalas = query(collection(db, "escalas_servos"), orderBy("dataCulto", "asc"));
        const unsubEscalas = onSnapshot(qEscalas, (snap) => {
            const hoje = new Date();
            hoje.setHours(0,0,0,0);

            const minhas = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter((escala: any) => {
                    const isEscalado = escala.servosEmails?.includes(user.email);
                    const dataEscala = new Date(escala.dataCulto + "T12:00:00");
                    return isEscalado && dataEscala >= hoje;
                });
            setMinhasEscalas(minhas);
        });

        return () => { unsubDoc(); unsubMin(); unsubEscalas(); };
      } else {
        setUserData({ nome: "Convidado", cargo: "Visitante", permissao: "", foto: "", ministerio: null, idade: null });
        setMinhasEscalas([]);
      }
    });
    return () => unsubAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMobileMenuOpen(false);
      navigate("/");
    } catch (error) { console.error(error); }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md h-20 flex items-center border-b border-n-borda shadow-sm transition-all duration-300">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center relative z-50">
        
        <Link to="/" className="flex items-center gap-3 shrink-0 relative z-[60]">
          <img src={logoIgreja} className="w-10 h-10 rounded-full border-2 border-blue-600 object-cover" alt="Logo" />
          <span className="font-display text-xl md:text-2xl font-bold text-n-texto uppercase tracking-tighter hidden sm:block">FAMÍLIAS CHURCH</span>
        </Link>

        <DesktopNav user={currentUser} userData={userData} onLogout={handleLogout} minhasEscalas={minhasEscalas} />
        
        <MobileMenu 
            isOpen={mobileMenuOpen} 
            setIsOpen={setMobileMenuOpen} 
            user={currentUser} 
            userData={userData} 
            onLogout={handleLogout}
            minhasEscalas={minhasEscalas}
        />

      </div>
    </header>
  );
}