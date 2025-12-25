import { useEffect, useState } from "react";
// Importações do Firebase Auth
import { 
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut 
} from "firebase/auth";
import { 
  collection, query, where, getDocs, onSnapshot, 
  limit, orderBy, addDoc, serverTimestamp 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { 
  TrendingUp, Users, Heart, DollarSign, 
  ShieldCheck, LogOut, UserCheck, Lock, Activity, 
  ChevronRight, BookOpen, Clock 
} from "lucide-react";

const auth = getAuth();

export default function AdminDashboard() {
  const [user, setUser] = useState<{nome: string, cargo: string, email: string} | null>(null);
  const [loginData, setLoginData] = useState({ email: "", senha: "" });
  const [loading, setLoading] = useState(false);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [logsAcesso, setLogsAcesso] = useState<any[]>([]);
  const [totalFinancas, setTotalFinancas] = useState(0);

  // VIGIA DE SESSÃO: Mantém o login ativo e busca o cargo no Firestore
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Busca o perfil (cargo/nome) na coleção 'contas_acesso' usando o email logado
        const q = query(collection(db, "contas_acesso"), where("email", "==", firebaseUser.email));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const d = snap.docs[0].data();
          setUser({ nome: d.nome, cargo: d.cargo, email: firebaseUser.email! });
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubAuth();
  }, []);

  // LOGIN PROFISSIONAL via Firebase Auth
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, loginData.email, loginData.senha);
      const [checkins, setCheckins] = useState<any[]>([]);
      // Log de Auditoria (Registro de Engenharia)
      await addDoc(collection(db, "logs_acesso"), {
        email: loginData.email,
        dataAcesso: serverTimestamp() 
      });
    } catch (error) {
      alert("Credenciais inválidas ou e-mail não cadastrado no sistema.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => signOut(auth);

  // VIGIAS DE DADOS (Snapshots em tempo real)
  useEffect(() => {
    if (!user) return;

    const unsubPedidos = onSnapshot(query(collection(db, "pedidos_oracao"), orderBy("data", "desc"), limit(5)), (snap) => {
      setPedidos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    let unsubLogs = () => {};
    if (["Dev", "Apostolo"].includes(user.cargo)) {
      unsubLogs = onSnapshot(query(collection(db, "logs_acesso"), orderBy("dataAcesso", "desc"), limit(6)), (snap) => {
        setLogsAcesso(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }

    let unsubDizimos = () => {};
    if (["Dev", "Apostolo", "Tesouraria"].includes(user.cargo)) {
       unsubDizimos = onSnapshot(collection(db, "registros_dizimos"), (snap) => {
         const soma = snap.docs.reduce((acc, d) => acc + Number(d.data().valor || 0), 0);
         setTotalFinancas(soma);
       });
    }

    return () => { unsubPedidos(); unsubDizimos(); unsubLogs(); };
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <form onSubmit={handleLogin} className="glass p-12 space-y-8 text-center max-w-md w-full rounded-[3rem] border border-white/5 shadow-glow">
          <ShieldCheck className="text-destaque mx-auto" size={56} />
          <div className="space-y-2">
            <h2 className="font-display text-4xl text-destaque uppercase tracking-tight">Portal Sede</h2>
            <p className="text-[10px] text-white/40 uppercase tracking-[0.3em]">Autenticação Famílias Church</p>
          </div>
          <div className="space-y-4">
            <input 
              type="email" placeholder="E-mail" required
              className="glass w-full p-5 rounded-2xl outline-none focus:border-destaque/30 transition-all"
              onChange={(e) => setLoginData({...loginData, email: e.target.value})}
            />
            <input 
              type="password" placeholder="Senha" required
              className="glass w-full p-5 rounded-2xl outline-none focus:border-destaque/30 transition-all"
              onChange={(e) => setLoginData({...loginData, senha: e.target.value})}
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-white text-primaria py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">
            {loading ? "Processando..." : "Entrar no Painel"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white p-6 pt-32 font-body">
      <div className="container mx-auto space-y-16">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-10">
          <div className="space-y-2">
            <h1 className="font-display text-7xl md:text-8xl tracking-tight text-gradient uppercase leading-none">Painel {user.cargo}</h1>
            <p className="text-white/40 uppercase tracking-[0.4em] text-[10px] font-bold italic">Bem-vindo, {user.nome}</p>
          </div>
          <button onClick={handleLogout} className="glass p-5 rounded-full hover:text-red-400 transition-colors shadow-lg">
            <LogOut size={24} />
          </button>
        </div>

        {/* DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {["Dev", "Apostolo", "Tesouraria"].includes(user.cargo) ? (
                <div className="glass p-10 rounded-[3.5rem] relative overflow-hidden group border border-white/5">
                  <DollarSign className="absolute top-0 right-0 p-8 opacity-10" size={90} />
                  <p className="text-[10px] font-bold text-destaque uppercase tracking-[0.2em] mb-2">Total Semeado</p>
                  <h3 className="text-5xl font-black tabular-nums tracking-tighter">R$ {totalFinancas.toLocaleString('pt-BR')}</h3>
                </div>
              ) : (
                 <div className="glass p-10 rounded-[3.5rem] border border-white/5 flex flex-col justify-center items-center opacity-40 grayscale">
                    <Lock className="mb-4 text-white/20" size={32}/>
                    <span className="text-[10px] uppercase font-black text-center">Acesso Restrito</span>
                 </div>
              )}

              <div className="glass p-10 rounded-[3.5rem] relative overflow-hidden group border border-white/5">
                <Heart className="text-blue-400 mb-6" size={32} />
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-2">Pedidos de Oração</p>
                <h3 className="text-5xl font-black tabular-nums tracking-tighter">{pedidos.length}</h3>
              </div>
            </div>

            {/* LISTA DE PEDIDOS */}
            <div className="glass p-10 rounded-[3.5rem] border border-white/5 space-y-8">
               <div className="flex items-center gap-3">
                 <Activity size={24} className="text-destaque" />
                 <h3 className="text-xl font-black uppercase tracking-tighter">Fluxo de Pedidos</h3>
               </div>
               <div className="grid gap-4">
                 {pedidos.map(p => (
                   <div key={p.id} className="p-6 bg-white/5 rounded-[2rem] border border-white/5 flex justify-between items-center group">
                     <p className="text-sm italic text-white/80">"{p.conteudo}"</p>
                     <ChevronRight size={16} className="text-white/20"/>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* COLUNA DIREITA: AUDITORIA */}
          <div className="space-y-10">
            {["Dev", "Apostolo"].includes(user.cargo) && (
              <div className="glass p-10 rounded-[3.5rem] border border-white/5 shadow-2xl">
                <div className="flex items-center gap-3 mb-10">
                  <UserCheck className="text-destaque" size={28} />
                  <h3 className="text-xl font-black uppercase tracking-tighter">Auditoria</h3>
                </div>
                <div className="space-y-5">
                  {logsAcesso.map((log) => (
                    <div key={log.id} className="flex items-center gap-4 p-5 bg-white/5 rounded-3xl border border-white/5">
                      <div className="flex-1 overflow-hidden">
                        <p className="text-[11px] font-black uppercase tracking-tight truncate">{log.email}</p>
                        <p className="text-[9px] text-destaque font-black mt-1">
                          {log.dataAcesso?.toDate().toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}