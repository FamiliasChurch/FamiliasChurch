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
    // CONTAINER PRINCIPAL:
    // pt-20: Empurra para baixo do header.
    // h-screen: Ocupa a tela toda.
    // overflow-hidden: Impede scroll duplo no corpo.
    <div className="fixed inset-0 w-full h-full bg-slate-50 flex flex-col md:flex-row overflow-hidden font-sans pt-20">
      
      {/* OVERLAY MOBILE */}
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
          w-72 md:w-72 bg-white border-r border-blue-100 
          flex flex-col h-[calc(100vh-5rem)] md:h-full 
          shadow-2xl md:shadow-none
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        
        {/* Cabeçalho da Sidebar */}
        <div className="p-8 pb-4 shrink-0 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 ml-1">Menu Administrativo</p>
            <h2 className="font-display font-bold text-2xl text-blue-900 tracking-tight mt-1">Painel</h2>
          </div>
          {/* Botão X para fechar no mobile */}
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-red-500">
            <X size={24} />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto custom-scrollbar">
          {itensFiltrados.map(item => {
            const isActive = abaAtiva === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`w-full flex items-center gap-3 px-5 py-4 rounded-[1.5rem] font-bold text-sm transition-all group ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20 translate-x-2" 
                    : "text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600"} /> 
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="p-6 border-t border-blue-50 mt-auto bg-white shrink-0">
          <div className="flex items-center gap-3 px-2 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm border border-blue-100 shrink-0">
              {user.nome.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-blue-900 truncate">{user.nome}</p>
              <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest truncate">{user.cargo}</p>
            </div>
          </div>
          <button onClick={() => signOut(auth)} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-400 font-bold text-xs uppercase tracking-widest hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100">
            <LogOut size={14} /> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 h-full overflow-y-auto bg-blue-50/30 relative w-full">
        
        {/* BARRA SUPERIOR MOBILE (Botão Menu) */}
        <div className="md:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-blue-100 px-6 py-4 flex items-center justify-between mb-6 shadow-sm">
          <div className="flex items-center gap-3">
             <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
               <Menu size={24} />
             </button>
             <span className="font-display font-bold text-lg text-blue-900 tracking-tight">Menu Painel</span>
          </div>
        </div>

        <div className="p-6 md:p-12 lg:p-16 max-w-7xl mx-auto pb-32 min-h-full">
          
          {abaAtiva === "dashboard" && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                 <div>
                   <h1 className="font-display text-4xl md:text-5xl font-bold text-blue-900 tracking-tighter uppercase leading-none">
                      Painel <span className="text-blue-500">{user.cargo}</span>
                   </h1>
                   <p className="text-blue-400 text-xs font-black uppercase tracking-widest mt-2">Visão Geral do Sistema</p>
                 </div>
                 <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    Sistema Online
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Cards de Métricas */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-blue-100 shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><DollarSign size={24} /></div>
                    </div>
                    <p className="text-[10px] font-black uppercase text-blue-300 tracking-widest mb-1">Caixa Atual</p>
                    <h3 className="text-3xl font-display font-bold text-blue-900 tracking-tight">R$ {totalFinancas.toLocaleString('pt-BR')}</h3>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-blue-100 shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-violet-50 rounded-2xl text-violet-600"><Users size={24} /></div>
                    </div>
                    <p className="text-[10px] font-black uppercase text-blue-300 tracking-widest mb-1">Total de Membros</p>
                    <h3 className="text-3xl font-display font-bold text-blue-900 tracking-tight">{totalMembros}</h3>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-blue-100 shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-orange-50 rounded-2xl text-orange-600"><Calendar size={24} /></div>
                    </div>
                    <p className="text-[10px] font-black uppercase text-blue-300 tracking-widest mb-1">Eventos na Agenda</p>
                    <h3 className="text-3xl font-display font-bold text-blue-900 tracking-tight">{totalEventos}</h3>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-blue-100 shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-rose-50 rounded-2xl text-rose-600"><HeartHandshake size={24} /></div>
                    </div>
                    <p className="text-[10px] font-black uppercase text-blue-300 tracking-widest mb-1">Pedidos de Oração</p>
                    <h3 className="text-3xl font-display font-bold text-blue-900 tracking-tight">{totalPedidos}</h3>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-blue-100 shadow-sm">
                    <h4 className="font-display text-2xl font-bold text-blue-900 mb-6 flex items-center gap-3">
                      <Activity size={24} className="text-blue-300" /> Acesso Rápido
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <button onClick={() => handleMenuClick("financeiro")} className="p-6 bg-blue-50/50 hover:bg-blue-100 rounded-[2rem] text-center transition-all group flex flex-col items-center gap-3 border border-blue-50">
                        <TrendingUp size={28} className="text-blue-400 group-hover:text-blue-600 transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 group-hover:text-blue-700">Relatórios</span>
                      </button>
                      <button onClick={() => handleMenuClick("membros")} className="p-6 bg-violet-50/50 hover:bg-violet-100 rounded-[2rem] text-center transition-all group flex flex-col items-center gap-3 border border-violet-50">
                        <Users size={28} className="text-violet-400 group-hover:text-violet-600 transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-violet-400 group-hover:text-violet-700">Novo Membro</span>
                      </button>
                      <button onClick={() => handleMenuClick("eventos")} className="p-6 bg-orange-50/50 hover:bg-orange-100 rounded-[2rem] text-center transition-all group flex flex-col items-center gap-3 border border-orange-50">
                        <Calendar size={28} className="text-orange-400 group-hover:text-orange-600 transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 group-hover:text-orange-700">Criar Evento</span>
                      </button>
                      <button onClick={() => handleMenuClick("ministerios")} className="p-6 bg-teal-50/50 hover:bg-teal-100 rounded-[2rem] text-center transition-all group flex flex-col items-center gap-3 border border-teal-50">
                        <LayoutGrid size={28} className="text-teal-400 group-hover:text-teal-600 transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 group-hover:text-teal-700">Escalas</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-blue-900 p-8 rounded-[3rem] shadow-xl shadow-blue-900/20 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl -mr-20 -mt-20 opacity-30 group-hover:opacity-50 transition-opacity" />
                    
                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div>
                        <h4 className="font-display text-3xl font-bold mb-1">Ministérios</h4>
                        <p className="text-blue-300 text-xs font-bold uppercase tracking-widest">Departamentos Ativos</p>
                      </div>
                      
                      <div className="my-8">
                        <span className="text-7xl font-display font-black tracking-tighter leading-none">{totalMinisterios}</span>
                        <span className="text-blue-300 text-sm font-bold ml-2">GRUPOS</span>
                      </div>

                      <button onClick={() => handleMenuClick("ministerios")} className="w-full py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10">
                        Gerenciar Grupos
                      </button>
                    </div>
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