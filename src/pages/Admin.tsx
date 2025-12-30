import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom"; 
import { db, auth } from "../lib/firebase";
import { 
  DollarSign, LogOut, LayoutDashboard, BookOpen, 
  Calendar, Users, CheckCircle2, LayoutGrid, HeartHandshake 
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
  const [totalFinancas, setTotalFinancas] = useState(0);
  
  const navigate = useNavigate();

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
    if (!user || !["Dev", "Apóstolo", "Secretaria"].includes(user.cargo)) return;
    const unsubDizimos = onSnapshot(collection(db, "registros_dizimos"), (snap) => {
      const soma = snap.docs
        .filter(d => d.data().status === "Aprovado")
        .reduce((acc, d) => acc + Number(d.data().valor || 0), 0);
      setTotalFinancas(soma);
    });
    return () => unsubDizimos();
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-900"></div></div>;
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
    <div className="min-h-screen bg-blue-50/20 flex flex-col md:flex-row pt-20">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-72 bg-white border-r border-blue-100 p-6 flex flex-col gap-8 md:sticky md:top-20 md:h-[calc(100vh-80px)]">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-4 ml-2">Menu Administrativo</p>
          <nav className="space-y-2">
            {itensFiltrados.map(item => (
              <button
                key={item.id}
                onClick={() => setAbaAtiva(item.id)}
                className={`w-full flex items-center gap-3 px-5 py-4 rounded-[1.5rem] font-bold text-sm transition-all ${
                  abaAtiva === item.id 
                    ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20 translate-x-2" 
                    : "text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                <item.icon size={18} /> {item.label}
              </button>
            ))}
          </nav>
        </div>
        <button onClick={() => signOut(auth)} className="mt-auto flex items-center gap-3 px-5 py-4 text-red-500 font-bold text-sm hover:bg-red-50 rounded-2xl transition-all">
          <LogOut size={18} /> Sair do Painel
        </button>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-6 md:p-12 pb-32">
        <div className="max-w-6xl mx-auto">
          {abaAtiva === "dashboard" && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <h1 className="font-display text-5xl uppercase font-bold text-blue-900 italic tracking-tighter">Painel <span className="text-blue-500">{user.cargo}</span></h1>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-8 rounded-[3rem] border border-blue-100 shadow-sm transition-all hover:shadow-xl group">
                    <p className="text-[10px] font-black uppercase text-blue-300 mb-2 tracking-widest group-hover:text-blue-500 transition-colors">Caixa Atual (Aprovado)</p>
                    <p className="text-4xl font-black text-blue-600 tracking-tighter">R$ {totalFinancas.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="bg-white p-8 rounded-[3rem] border border-blue-100 shadow-sm flex items-center justify-between transition-all hover:shadow-xl">
                    <div>
                      <p className="text-[10px] font-black uppercase text-blue-300 mb-2 tracking-widest">Sistema</p>
                      <p className="text-2xl font-bold text-blue-900 uppercase">Online</p>
                    </div>
                    <CheckCircle2 className="text-blue-500" size={32} />
                  </div>
               </div>
            </div>
          )}

          {abaAtiva === "financeiro" && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <AuditPanel totalAtivo={totalFinancas} />
              <AdminAudit userRole={user.cargo} />
            </div>
          )}

          {abaAtiva === "intercessao" && <PrayerManagement />}
          {abaAtiva === "estudos" && <BibleStudies userRole={user.cargo} userName={user.nome} />}
          
          {/* ALTERAÇÃO 2: Passando o userRole para MembersManagement */}
          {abaAtiva === "membros" && <MembersManagement currentUserRole={user.cargo} />}
          
          {abaAtiva === "eventos" && <EventsManagement userRole={user.cargo} />}
          {abaAtiva === "ministerios" && <MinistriesManagement userRole={user.cargo} />}
        </div>
      </main>
    </div>
  );
}