import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom"; 
import { db, auth } from "../lib/firebase";
import { 
  DollarSign, LogOut, LayoutDashboard, BookOpen, 
  Calendar, Users, LayoutGrid, HeartHandshake,
  TrendingUp, Activity, Menu, X
} from "lucide-react";

import AuditPanel from "./AuditPanel"; 
import AdminAudit from "./AdminAudit";
import BibleStudies from "./BibleStudies";
import MembersManagement from "./MembersManagement";
import EventsManagement from "./EventsManagement";
import MinistriesManagement from "./MinistriesManagement";
import PrayerManagement from "./PrayerManagement";

export default function AdminDashboard() {
  const [user, setUser] = useState<{nome: string, cargo: string, email: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false); // Controle do menu mobile
  
  const [totalFinancas, setTotalFinancas] = useState(0);
  const [totalMembros, setTotalMembros] = useState(0);
  const [totalEventos, setTotalEventos] = useState(0);
  const [totalMinisterios, setTotalMinisterios] = useState(0);
  const [totalPedidos, setTotalPedidos] = useState(0);
  
  const navigate = useNavigate();

  // Fecha sidebar ao clicar em um item no mobile
  const handleMenuClick = (id: string) => {
    setAbaAtiva(id);
    setSidebarOpen(false);
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const q = query(collection(db, "contas_acesso"), where("email", "==", firebaseUser.email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0].data();
          setUser({ nome: d.nome, cargo: d.cargo, email: firebaseUser.email! });
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

  useEffect(() => {
    if (!user) return;

    const unsubDizimos = onSnapshot(collection(db, "registros_dizimos"), (snap) => {
      const soma = snap.docs
        .filter(d => d.data().status === "Aprovado")
        .reduce((acc, d) => acc + Number(d.data().valor || 0), 0);
      setTotalFinancas(soma);
    });

    const unsubMembros = onSnapshot(collection(db, "registros_membros"), (snap) => {
      setTotalMembros(snap.size);
    });

    const unsubEventos = onSnapshot(collection(db, "eventos"), (snap) => {
      setTotalEventos(snap.size);
    });

    const unsubMinisterios = onSnapshot(collection(db, "ministerios"), (snap) => {
      setTotalMinisterios(snap.size);
    });

    const unsubPedidos = onSnapshot(collection(db, "pedidos_oracao"), (snap) => {
      setTotalPedidos(snap.size);
    });

    return () => {
      unsubDizimos();
      unsubMembros();
      unsubEventos();
      unsubMinisterios();
      unsubPedidos();
    };
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div></div>;
  if (!user) return null;

  const menuItens = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["Dev", "Apóstolo", "Secretaria"] },
    { id: "financeiro", label: "Financeiro", icon: DollarSign, roles: ["Dev", "Apóstolo", "Secretaria"] },
    { id: "intercessao", label: "Intercessão", icon: HeartHandshake, roles: ["Dev", "Apóstolo", "Pastor"] },
    { id: "estudos", label: "Estudos/Devocionais", icon: BookOpen, roles: ["Dev", "Apóstolo", "Pastor"] },
    { id: "eventos", label: "Agenda/Eventos", icon: Calendar, roles: ["Dev", "Apóstolo", "Mídia", "Secretaria"] }, 
    { id: "membros", label: "Membros", icon: Users, roles: ["Dev", "Apóstolo", "Secretaria"] },
    { id: "ministerios", label: "Ministérios", icon: LayoutGrid, roles: ["Dev", "Apóstolo", "Secretaria"] },
  ];

  const itensFiltrados = menuItens.filter(item => item.roles.includes(user.cargo));

  return (
    // FIX: pt-20 compensa o Header fixo. h-screen trava a tela.
    <div className="fixed inset-0 w-full h-full bg-slate-50 flex flex-col md:flex-row overflow-hidden font-sans pt-20">
      
      {/* OVERLAY MOBILE: Fundo escuro quando menu abre */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm top-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside 
        className={`
          fixed md:relative top-20 md:top-0 bottom-0 left-0 z-40 md:z-10
          w-72 md:w-64 bg-white border-r border-slate-100 
          flex flex-col h-[calc(100vh-5rem)] md:h-full 
          shadow-2xl md:shadow-[2px_0_20px_-10px_rgba(0,0,0,0.05)]
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        
        {/* Cabeçalho da Sidebar */}
        <div className="p-8 pb-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="font-display font-bold text-4xl tracking-tight text-blue-600">Painel</h2>
            <p className="text-xs text-slate-400 mt-1 font-medium px-1">Gestão Eclesiástica</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-red-500">
            <X size={24} />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {itensFiltrados.map(item => {
            const isActive = abaAtiva === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  isActive 
                    ? "bg-blue-50 text-blue-600 shadow-sm" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"} /> 
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="p-4 border-t border-slate-100 mt-auto bg-white shrink-0">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
              {user.nome.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate">{user.nome}</p>
              <p className="text-xs text-slate-400 truncate">{user.cargo}</p>
            </div>
          </div>
          <button onClick={() => signOut(auth)} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-500 font-medium text-xs hover:bg-red-50 rounded-lg transition-colors">
            <LogOut size={14} /> Sair
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 h-full overflow-y-auto bg-slate-50 relative w-full">
        
        {/* BARRA SUPERIOR MOBILE (Botão Menu) */}
        <div className="md:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between mb-4 shadow-sm">
          <div className="flex items-center gap-3">
             <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
               <Menu size={24} />
             </button>
             <span className="font-display font-bold text-lg text-slate-800 tracking-tight">Menu Painel</span>
          </div>
        </div>

        <div className="p-6 md:p-12 lg:p-20 max-w-7xl mx-auto pb-20 min-h-full">
          
          {abaAtiva === "dashboard" && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <div>
                   <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Visão Geral</h1>
                   <p className="text-slate-500 mt-1">Bem-vindo de volta, {user.nome}. Aqui está o resumo da sua igreja hoje.</p>
                 </div>
                 <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    SISTEMA ONLINE
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* ... Cards ... */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><DollarSign size={20} /></div>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">+12%</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Caixa Atual</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">R$ {totalFinancas.toLocaleString('pt-BR')}</h3>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-violet-50 rounded-lg text-violet-600"><Users size={20} /></div>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Total de Membros</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalMembros}</h3>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><Calendar size={20} /></div>
                      <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">Próximos</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Eventos na Agenda</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalEventos}</h3>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-rose-50 rounded-lg text-rose-600"><HeartHandshake size={20} /></div>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Pedidos de Oração</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalPedidos}</h3>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Activity size={18} className="text-slate-400" /> Acesso Rápido
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <button onClick={() => handleMenuClick("financeiro")} className="p-4 bg-slate-50 hover:bg-blue-50 rounded-xl text-center transition-colors group">
                        <TrendingUp size={24} className="mx-auto text-slate-400 group-hover:text-blue-600 mb-2" />
                        <span className="text-sm font-semibold text-slate-600 group-hover:text-blue-700">Relatórios</span>
                      </button>
                      <button onClick={() => handleMenuClick("membros")} className="p-4 bg-slate-50 hover:bg-violet-50 rounded-xl text-center transition-colors group">
                        <Users size={24} className="mx-auto text-slate-400 group-hover:text-violet-600 mb-2" />
                        <span className="text-sm font-semibold text-slate-600 group-hover:text-violet-700">Novo Membro</span>
                      </button>
                      <button onClick={() => handleMenuClick("eventos")} className="p-4 bg-slate-50 hover:bg-orange-50 rounded-xl text-center transition-colors group">
                        <Calendar size={24} className="mx-auto text-slate-400 group-hover:text-orange-600 mb-2" />
                        <span className="text-sm font-semibold text-slate-600 group-hover:text-orange-700">Criar Evento</span>
                      </button>
                      <button onClick={() => handleMenuClick("ministerios")} className="p-4 bg-slate-50 hover:bg-teal-50 rounded-xl text-center transition-colors group">
                        <LayoutGrid size={24} className="mx-auto text-slate-400 group-hover:text-teal-600 mb-2" />
                        <span className="text-sm font-semibold text-slate-600 group-hover:text-teal-700">Escalas</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
                    <div className="relative z-10">
                      <h4 className="font-bold text-slate-200 mb-1">Ministérios Ativos</h4>
                      <p className="text-sm text-slate-400 mb-6">Departamentos em funcionamento</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black tracking-tighter">{totalMinisterios}</span>
                        <span className="text-sm font-medium text-slate-400">grupos</span>
                      </div>
                      <button onClick={() => handleMenuClick("ministerios")} className="mt-6 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors">
                        Gerenciar Grupos
                      </button>
                    </div>
                    <LayoutGrid className="absolute -bottom-6 -right-6 text-white/5 w-40 h-40" />
                  </div>
               </div>
            </div>
          )}

          {abaAtiva === "financeiro" && <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500"><AuditPanel totalAtivo={totalFinancas} /><AdminAudit userRole={user.cargo} /></div>}
          {abaAtiva === "intercessao" && <PrayerManagement />}
          {abaAtiva === "estudos" && <BibleStudies userRole={user.cargo} userName={user.nome} />}
          {abaAtiva === "membros" && <MembersManagement currentUserRole={user.cargo} />}
          {abaAtiva === "eventos" && <EventsManagement userRole={user.cargo} />}
          {abaAtiva === "ministerios" && <MinistriesManagement userRole={user.cargo} />}
        </div>
      </main>
    </div>
  );
}