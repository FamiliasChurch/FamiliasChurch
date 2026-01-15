import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Users, HeartHandshake, BookOpen, 
  Calendar, DollarSign, Menu, X, LogOut, CreditCard, LayoutGrid,
  PlusCircle, UserPlus, FileText, CalendarPlus, ShieldAlert,
  ChevronLeft, Info
} from "lucide-react";
import { auth, db } from "../lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";

// Componentes das Abas
import MembershipManagement from "./MembersManagement";
import AdminAudit from "./AdminAudit"; 
import AuditPanel from "./AuditPanel"; 
import PrayerManagement from "./PrayerManagement";
import EventsManagement from "./EventsManagement";
import BibleStudies from "./BibleStudies";
import MinistriesManagement from "./MinistriesManagement";
import CardRequests from "./CardRequests";
import NotificationLogs from "../components/NotificationBell"; 

export default function AdminDashboard() {
  const [user, setUser] = useState<{ nome: string, cargo: string, permissao?: string, email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // sidebarOpen = true (Expandido), false (Recolhido)
  const [sidebarOpen, setSidebarOpen] = useState(false); 
  const [showNavHint, setShowNavHint] = useState(false); 
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Métricas
  const [totalFinancas, setTotalFinancas] = useState(0);
  const [totalMembros, setTotalMembros] = useState(0);
  const [totalEventos, setTotalEventos] = useState(0);
  const [totalMinisterios, setTotalMinisterios] = useState(0);
  const [totalPedidos, setTotalPedidos] = useState(0);

  const abaAtiva = searchParams.get("tab") || "dashboard";

  const setAbaAtiva = (novaAba: string) => {
    setSearchParams({ tab: novaAba });
    if (window.innerWidth < 768) {
        setSidebarOpen(false);
    }
  };

  // --- LÓGICA DA DICA TEMPORÁRIA ---
  useEffect(() => {
    const checkVisits = () => {
        const visitCount = parseInt(localStorage.getItem("admin_dashboard_visits") || "0");
        if (visitCount < 3) {
            setShowNavHint(true);
            localStorage.setItem("admin_dashboard_visits", (visitCount + 1).toString());
            setTimeout(() => { setShowNavHint(false); }, 5000);
        }
    };
    checkVisits();
  }, []);

  // 1. Autenticação e Dados do Usuário
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const q = query(collection(db, "contas_acesso"), where("email", "==", firebaseUser.email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0].data();
          setUser({ nome: d.nome, cargo: d.cargo, permissao: d.permissao, email: firebaseUser.email! });
        } else {
          navigate("/login");
        }
      } else {
        navigate("/login");
      }
      setLoading(false);
    });
    return () => unsubAuth();
  }, [navigate]);

  const checkRole = (rolesAllowed: string[]) => {
      if (!user) return false;
      const userRole = (user.permissao || user.cargo || "").toLowerCase();
      return rolesAllowed.some(r => r.toLowerCase() === userRole);
  };

  // 2. Métricas
  useEffect(() => {
    if (!user) return;
    const unsubs: (() => void)[] = [];
    const role = (user.permissao || user.cargo || "").toLowerCase();
    const isDevOrAdmin = role === "dev" || role === "admin";
    const isGerenciador = role === "gerenciador";
    const isPublicador = role === "publicador";

    if (isDevOrAdmin || isGerenciador) {
        unsubs.push(onSnapshot(collection(db, "registros_dizimos"), (snap) => {
            const soma = snap.docs.filter(d => d.data().status === "Aprovado").reduce((acc, d) => acc + Number(d.data().valor || 0), 0);
            setTotalFinancas(soma);
        }));
    }
    if (isDevOrAdmin || isGerenciador || isPublicador) {
        unsubs.push(onSnapshot(collection(db, "contas_acesso"), (snap) => setTotalMembros(snap.size)));
    }
    unsubs.push(onSnapshot(collection(db, "agenda_eventos"), (snap) => setTotalEventos(snap.size)));
    unsubs.push(onSnapshot(collection(db, "ministerios_info"), (snap) => setTotalMinisterios(snap.size)));
    unsubs.push(onSnapshot(collection(db, "pedidos_oracao"), (snap) => setTotalPedidos(snap.size)));

    return () => unsubs.forEach(u => u());
  }, [user]);

  // --- MENU CONFIG ---
  const menuItens = [
    { id: "dashboard", label: "Dashboard", desc: "Visão Geral", icon: LayoutDashboard, roles: ["Dev", "Admin", "Gerenciador", "Moderador", "Publicador", "Midia"] },
    { id: "financeiro", label: "Financeiro", desc: "Fluxo de Caixa", icon: DollarSign, roles: ["Dev", "Admin", "Gerenciador"] },
    { id: "intercessao", label: "Intercessão", desc: "Orações", icon: HeartHandshake, roles: ["Dev", "Admin", "Publicador"] },
    { id: "estudos", label: "Estudos", desc: "Conteúdo", icon: BookOpen, roles: ["Dev", "Admin", "Publicador"] },
    { id: "eventos", label: "Agenda", desc: "Calendário", icon: Calendar, roles: ["Dev", "Admin", "Gerenciador", "Midia"] },
    { id: "membros", label: "Membros", desc: "Pessoas", icon: Users, roles: ["Dev", "Admin", "Gerenciador", "Publicador"] },
    { id: "ministerios", label: "Ministérios", desc: "Equipes", icon: LayoutGrid, roles: ["Dev", "Admin", "Gerenciador", "Moderador", "Publicador"] },
    { id: "carteirinhas", label: "Carteirinhas", desc: "Credenciais", icon: CreditCard, roles: ["Dev", "Admin", "Gerenciador"] },
  ];

  const quickActions = [
    { id: "new_event", label: "Novo Evento", desc: "Agendar Culto", icon: CalendarPlus, targetTab: "eventos", color: "bg-orange-50 text-orange-600 border-orange-100", roles: ["Dev", "Admin", "Gerenciador", "Midia"] },
    { id: "new_member", label: "Novo Membro", desc: "Cadastrar Pessoa", icon: UserPlus, targetTab: "membros", color: "bg-violet-50 text-violet-600 border-violet-100", roles: ["Dev", "Admin", "Gerenciador"] },
    { id: "new_study", label: "Publicar Palavra", desc: "Estudo/Devocional", icon: FileText, targetTab: "estudos", color: "bg-emerald-50 text-emerald-600 border-emerald-100", roles: ["Dev", "Admin", "Publicador"] },
    { id: "check_requests", label: "Carteirinhas", desc: "Ver Pedidos", icon: CreditCard, targetTab: "carteirinhas", color: "bg-blue-50 text-blue-600 border-blue-100", roles: ["Dev", "Admin", "Gerenciador"] },
  ];

  const itensFiltrados = menuItens.filter(item => checkRole(item.roles));
  const quickActionsFiltrados = quickActions.filter(item => checkRole(item.roles));
  const permissaoParaAbaAtual = itensFiltrados.some(item => item.id === abaAtiva);

  useEffect(() => {
    if (!loading && user && !permissaoParaAbaAtual && abaAtiva !== "dashboard") {
      setAbaAtiva("dashboard");
    }
  }, [abaAtiva, permissaoParaAbaAtual, loading, user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div></div>;
  if (!user) return null;

  const roleAtiva = user.permissao || user.cargo;

  const renderTab = (idTab: string, Componente: React.ReactNode) => {
    if (abaAtiva === idTab && itensFiltrados.some(i => i.id === idTab)) {
      return Componente;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans pt-20 overflow-x-hidden relative">

      <div className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 transition-opacity duration-500 ease-in-out ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={() => setSidebarOpen(false)} />

      {/* DICA DE NAVEGAÇÃO */}
      {showNavHint && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] bg-slate-900/90 backdrop-blur text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500 border border-white/10 pointer-events-none">
            <Info size={20} className="text-blue-400 animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-widest text-center">
                {window.innerWidth < 768 ? "Toque no ícone de menu ao lado para navegar" : "Use o menu lateral para navegar"}
            </p>
        </div>
      )}

      {/* MENU MOBILE FIXO */}
      {!sidebarOpen && (
        <button onClick={() => setSidebarOpen(true)} className="md:hidden fixed top-24 left-4 z-20 p-2 bg-white/80 backdrop-blur-md border border-slate-200 rounded-lg text-slate-500 shadow-sm hover:text-blue-600 hover:shadow-md transition-all animate-in fade-in zoom-in duration-500">
            <Menu size={20} />
        </button>
      )}

      {/* SIDEBAR */}
      <aside 
        className={`
            fixed top-20 left-0 bottom-0 z-40 bg-white border-r border-slate-100 shadow-[8px_0_30px_rgba(0,0,0,0.04)]
            flex flex-col transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)
            ${sidebarOpen ? "w-72 translate-x-0" : "w-20 -translate-x-full md:translate-x-0"}
            /* CORREÇÃO AQUI: overflow-visible quando fechado para o tooltip vazar, mas auto quando aberto para scroll */
            ${sidebarOpen ? "overflow-y-auto" : "overflow-visible"}
        `}
      >
        <div className="h-24 flex items-center justify-center border-b border-slate-50 shrink-0 px-4">
            {sidebarOpen ? (
                <div className="flex-1 flex items-center justify-between animate-in fade-in slide-in-from-left-2 duration-300">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Painel</p>
                        <h2 className="font-display font-bold text-xl text-slate-800 tracking-tight whitespace-nowrap">Administrativo</h2>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                        <ChevronLeft size={22} />
                    </button>
                </div>
            ) : (
                <button onClick={() => setSidebarOpen(true)} className="p-3 bg-white text-slate-400 border border-slate-100 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 hidden md:flex" title="Expandir Menu">
                    <Menu size={22} />
                </button>
            )}
        </div>

        {/* LISTA DE NAVEGAÇÃO */}
        {/* CORREÇÃO: Removemos overflow-y-auto daqui quando fechado para não cortar o tooltip */}
        <nav className={`flex-1 py-6 px-3 space-y-2 custom-scrollbar ${sidebarOpen ? "overflow-y-auto" : "overflow-visible"}`}>
          {itensFiltrados.map(item => {
            const isActive = abaAtiva === item.id;
            return (
              <button 
                key={item.id} 
                onClick={() => setAbaAtiva(item.id)} 
                className={`
                    w-full flex items-center px-3 py-3.5 rounded-2xl transition-all relative group
                    ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"}
                    ${sidebarOpen ? "justify-start gap-4" : "justify-center"}
                `}
              >
                <div className="shrink-0 flex items-center justify-center w-6 h-6">
                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                
                {sidebarOpen && (
                    <span className="text-sm font-bold tracking-wide whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300 delay-75">
                        {item.label}
                    </span>
                )}

                {!sidebarOpen && isActive && (
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full" />
                )}

                {/* TOOLTIP CORRIGIDO */}
                {!sidebarOpen && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-slate-800 text-white px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-[100] translate-x-2 group-hover:translate-x-0 hidden md:block border border-slate-700">
                        {/* Seta do Tooltip */}
                        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45 border-l border-b border-slate-700"></div>
                        
                        <div className="relative z-10 flex flex-col items-start gap-0.5">
                            <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest leading-none">{item.label}</span>
                            <span className="text-[10px] font-medium text-slate-300 leading-none">{item.desc}</span>
                        </div>
                    </div>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer do Usuário */}
        <div className="p-4 border-t border-slate-50 bg-white shrink-0">
            <div className={`flex items-center rounded-2xl transition-all ${sidebarOpen ? "bg-slate-50 p-3 gap-3" : "justify-center p-2"}`}>
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm border-2 border-white shadow-sm shrink-0">
                    {user.nome.charAt(0)}
                </div>
                
                {sidebarOpen && (
                    <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
                        <p className="text-xs font-bold text-slate-800 truncate">{user.nome.split(' ')[0]}</p>
                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest truncate">{roleAtiva}</p>
                    </div>
                )}

                {sidebarOpen && (
                    <button onClick={() => signOut(auth)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors" title="Sair">
                        <LogOut size={18} />
                    </button>
                )}
            </div>
        </div>
      </aside>

      <main className="flex-1 min-h-[calc(100vh-5rem)] md:ml-20 transition-all duration-300">
        <div className="p-6 md:p-12 lg:p-16 max-w-[1600px] mx-auto pb-32">
          {/* ... (CONTEÚDO DO DASHBOARD IGUAL AO ANTERIOR) ... */}
          {abaAtiva === "dashboard" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pt-8 md:pt-0">
                <div className="xl:col-span-2 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pl-12 md:pl-0">
                        <div>
                            <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-900 tracking-tighter uppercase leading-none">
                              Olá, <span className="text-blue-600">{user.nome.split(" ")[0]}</span>
                            </h1>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2">
                                Nível: {user.permissao || user.cargo}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Sistema Online
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 ml-1 flex items-center gap-2"><LayoutGrid size={14}/> Acesso Rápido</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {quickActionsFiltrados.map((action) => (
                                <button
                                    key={action.id}
                                    onClick={() => setAbaAtiva(action.targetTab)}
                                    className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group text-left relative overflow-hidden"
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${action.color}`}>
                                        <action.icon size={22} />
                                    </div>
                                    <p className="font-bold text-slate-800 text-sm leading-tight">{action.label}</p>
                                    <p className="text-[10px] font-medium text-slate-400 mt-1">{action.desc}</p>
                                </button>
                            ))}
                             <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-200 border-dashed flex flex-col items-center justify-center text-center opacity-60 hover:opacity-100 transition-opacity cursor-help">
                                <ShieldAlert size={24} className="text-slate-400 mb-2"/>
                                <p className="text-[10px] font-black uppercase text-slate-400">Suporte TI</p>
                             </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 ml-1 flex items-center gap-2"><LayoutDashboard size={14}/> Visão Geral</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {checkRole(["Dev", "Admin", "Gerenciador"]) && (
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                                    <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50 rounded-full -mr-10 -mt-10 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6"><div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><DollarSign size={24} /></div></div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Caixa Atual</p>
                                        <h3 className="text-4xl font-display font-bold text-slate-800 tracking-tight">R$ {totalFinancas.toLocaleString('pt-BR')}</h3>
                                    </div>
                                </div>
                            )}

                            {checkRole(["Dev", "Admin", "Gerenciador", "Publicador"]) && (
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                                    <div className="absolute right-0 top-0 w-32 h-32 bg-violet-50 rounded-full -mr-10 -mt-10 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6"><div className="p-3 bg-violet-50 rounded-2xl text-violet-600"><Users size={24} /></div></div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total de Membros</p>
                                        <h3 className="text-4xl font-display font-bold text-slate-800 tracking-tight">{totalMembros}</h3>
                                    </div>
                                </div>
                            )}

                            {checkRole(["Dev", "Admin", "Gerenciador", "Midia"]) && (
                                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden md:col-span-2 lg:col-span-1">
                                    <div className="absolute right-0 top-0 w-32 h-32 bg-orange-50 rounded-full -mr-10 -mt-10 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6"><div className="p-3 bg-orange-50 rounded-2xl text-orange-600"><Calendar size={24} /></div></div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Eventos Agendados</p>
                                        <h3 className="text-4xl font-display font-bold text-slate-800 tracking-tight">{totalEventos}</h3>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-1 space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
                    <NotificationLogs />
                </div>
            </div>
          )}

          {renderTab("eventos", <EventsManagement userRole={roleAtiva} />)}
          
          {renderTab("financeiro", (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <AuditPanel totalAtivo={totalFinancas} />
                <AdminAudit userRole={roleAtiva} />
            </div>
          ))}
          
          {renderTab("intercessao", <PrayerManagement />)}
          {renderTab("estudos", <BibleStudies userRole={roleAtiva} userName={user.nome} />)}
          {renderTab("membros", <MembershipManagement currentUserRole={roleAtiva} />)}
          {renderTab("ministerios", <MinistriesManagement userRole={roleAtiva} userEmail={user.email} />)}
          {renderTab("carteirinhas", <CardRequests userRole={roleAtiva} />)}

        </div>
      </main>
    </div>
  );
}