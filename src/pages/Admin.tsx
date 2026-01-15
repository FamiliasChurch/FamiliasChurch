import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Users, HeartHandshake, BookOpen, 
  Calendar, DollarSign, Menu, X, LogOut, CreditCard, LayoutGrid,
  PlusCircle, UserPlus, FileText, CalendarPlus, ShieldAlert,
  ChevronLeft
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

  // 1. Autenticação e Dados do Usuário
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const q = query(collection(db, "contas_acesso"), where("email", "==", firebaseUser.email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0].data();
          setUser({ 
              nome: d.nome, 
              cargo: d.cargo, 
              permissao: d.permissao, 
              email: firebaseUser.email! 
          });
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
            const soma = snap.docs
                .filter(d => d.data().status === "Aprovado")
                .reduce((acc, d) => acc + Number(d.data().valor || 0), 0);
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

  // --- MENU LATERAL ---
  const menuItens = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["Dev", "Admin", "Gerenciador", "Moderador", "Publicador", "Midia"] },
    { id: "financeiro", label: "Financeiro", icon: DollarSign, roles: ["Dev", "Admin", "Gerenciador"] },
    { id: "intercessao", label: "Intercessão", icon: HeartHandshake, roles: ["Dev", "Admin", "Publicador"] },
    { id: "estudos", label: "Estudos/Devocionais", icon: BookOpen, roles: ["Dev", "Admin", "Publicador"] },
    { id: "eventos", label: "Agenda/Eventos", icon: Calendar, roles: ["Dev", "Admin", "Gerenciador", "Midia"] },
    { id: "membros", label: "Membros", icon: Users, roles: ["Dev", "Admin", "Gerenciador", "Publicador"] },
    { id: "ministerios", label: "Ministérios", icon: LayoutGrid, roles: ["Dev", "Admin", "Gerenciador", "Moderador", "Publicador"] },
    { id: "carteirinhas", label: "Carteirinhas", icon: CreditCard, roles: ["Dev", "Admin", "Gerenciador"] },
  ];

  const quickActions = [
    { 
        id: "new_event", 
        label: "Novo Evento", 
        desc: "Agendar Culto",
        icon: CalendarPlus, 
        targetTab: "eventos", 
        color: "bg-orange-50 text-orange-600 border-orange-100",
        roles: ["Dev", "Admin", "Gerenciador", "Midia"] 
    },
    { 
        id: "new_member", 
        label: "Novo Membro", 
        desc: "Cadastrar Pessoa",
        icon: UserPlus, 
        targetTab: "membros", 
        color: "bg-violet-50 text-violet-600 border-violet-100",
        roles: ["Dev", "Admin", "Gerenciador"] 
    },
    { 
        id: "new_study", 
        label: "Publicar Palavra", 
        desc: "Estudo/Devocional",
        icon: FileText, 
        targetTab: "estudos", 
        color: "bg-emerald-50 text-emerald-600 border-emerald-100",
        roles: ["Dev", "Admin", "Publicador"] 
    },
    { 
        id: "check_requests", 
        label: "Carteirinhas", 
        desc: "Ver Pedidos",
        icon: CreditCard, 
        targetTab: "carteirinhas", 
        color: "bg-blue-50 text-blue-600 border-blue-100",
        roles: ["Dev", "Admin", "Gerenciador"] 
    },
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
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans pt-20 overflow-x-hidden">

      {/* --- OVERLAY FOSCO (BACKDROP) --- */}
      {/* Cobre o conteúdo quando o menu está ABERTO */}
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 transition-opacity duration-500 ease-in-out ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* --- SIDEBAR ELEGANTE --- */}
      <aside 
        className={`
            fixed top-20 left-0 bottom-0 z-40 bg-white border-r border-slate-100 shadow-[8px_0_30px_rgba(0,0,0,0.04)]
            flex flex-col transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)
            ${sidebarOpen ? "w-72 translate-x-0" : "w-20 -translate-x-full md:translate-x-0"}
        `}
      >
        {/* Header do Sidebar - Centralizado quando fechado */}
        <div className="h-24 flex items-center justify-center border-b border-slate-50 shrink-0 px-4">
            {sidebarOpen ? (
                <div className="flex-1 flex items-center justify-between animate-in fade-in slide-in-from-left-2 duration-300">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Painel</p>
                        <h2 className="font-display font-bold text-xl text-slate-800 tracking-tight whitespace-nowrap">Administrativo</h2>
                    </div>
                    {/* Botão Recolher */}
                    <button 
                        onClick={() => setSidebarOpen(false)} 
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    >
                        <ChevronLeft size={22} />
                    </button>
                </div>
            ) : (
                /* Botão Expandir (Centralizado) */
                <button 
                    onClick={() => setSidebarOpen(true)} 
                    className="p-3 bg-white text-slate-400 border border-slate-100 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95"
                    title="Expandir Menu"
                >
                    <Menu size={22} />
                </button>
            )}
        </div>

        {/* Lista de Navegação */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
          {itensFiltrados.map(item => {
            const isActive = abaAtiva === item.id;
            return (
              <button 
                key={item.id} 
                onClick={() => setAbaAtiva(item.id)} 
                title={!sidebarOpen ? item.label : ""}
                className={`
                    w-full flex items-center px-3 py-3.5 rounded-2xl transition-all relative group
                    ${isActive 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"
                    }
                    /* AQUI ESTÁ A CORREÇÃO DO 'AMASSADO': */
                    ${sidebarOpen ? "justify-start gap-4" : "justify-center"}
                `}
              >
                <div className="shrink-0 flex items-center justify-center w-6 h-6">
                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                
                {/* Oculta completamente o texto quando fechado para não ocupar espaço invisível */}
                {sidebarOpen && (
                    <span className="text-sm font-bold tracking-wide whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300 delay-75">
                        {item.label}
                    </span>
                )}

                {/* Indicador Ativo (Bolinha) quando fechado */}
                {!sidebarOpen && isActive && (
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full" />
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

      {/* --- ÁREA PRINCIPAL --- */}
      {/* Mantém margem fixa de 80px (w-20) no desktop, pois o menu expandido é um overlay */}
      <main className="flex-1 min-h-[calc(100vh-5rem)] md:ml-20 transition-all duration-300">
        
        {/* Header Mobile */}
        <div className="md:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                <Menu size={24} />
            </button>
            <span className="font-display font-bold text-lg text-slate-800 tracking-tight">Menu Painel</span>
          </div>
        </div>

        <div className="p-6 md:p-12 lg:p-16 max-w-[1600px] mx-auto pb-32">

          {/* DASHBOARD */}
          {abaAtiva === "dashboard" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    
                    {/* Header de Boas Vindas */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
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

                    {/* ACESSO RÁPIDO */}
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
                             {/* Botão de Suporte Decorativo */}
                             <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-200 border-dashed flex flex-col items-center justify-center text-center opacity-60 hover:opacity-100 transition-opacity cursor-help">
                                <ShieldAlert size={24} className="text-slate-400 mb-2"/>
                                <p className="text-[10px] font-black uppercase text-slate-400">Suporte TI</p>
                             </div>
                        </div>
                    </div>

                    {/* Métrica Cards */}
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