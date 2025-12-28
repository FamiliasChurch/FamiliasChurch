import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// IMPORTAÇÃO FIREBASE
// Certifique-se que o caminho ./lib/firebase está correto em relação a este arquivo
import { auth, db } from "./lib/firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const Root = () => {
  const [role, setRole] = useState("Visitante");
  const [name, setName] = useState("Convidado");
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Monitora o estado da autenticação (Login/Logout)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);

      if (user && user.email) {
        try {
          // Busca o perfil completo no Firestore usando o e-mail como ID
          const userDocRef = doc(db, "contas_acesso", user.email);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            setRole(data.cargo || "Membro");
            // Prioriza o nome do banco, senão usa do Google, senão "Membro"
            setName(data.nome || user.displayName || "Membro");
            setShowWelcome(true);
          } else {
            // Usuário logado no Auth, mas sem registro no Banco ainda
            setRole("Membro");
            setName(user.displayName || "Novo Membro");
          }
        } catch (error) {
          console.error("Erro ao buscar perfil:", error);
          setRole("Visitante");
        }
      } else {
        // Não logado
        setRole("Visitante");
        setName("Convidado");
        setShowWelcome(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Timer para esconder o toast de boas-vindas após 5s
  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => setShowWelcome(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

  // TELA DE LOADING (Preto com animação CSS elegante)
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-8">
        <div className="relative flex items-center justify-center">
           {/* Círculo externo */}
           <div className="w-24 h-24 rounded-full border-4 border-slate-800 animate-pulse"></div>
           {/* Círculo interno girando */}
           <div className="absolute w-24 h-24 border-t-4 border-emerald-500 rounded-full animate-spin"></div>
           {/* Ícone ou Ponto central */}
           <div className="absolute w-4 h-4 bg-emerald-500 rounded-full animate-ping"></div>
        </div>
        <p className="text-emerald-500 font-black uppercase tracking-[0.4em] text-xs animate-pulse">
          Conectando ao Altar...
        </p>
      </div>
    );
  }

  return (
    <StrictMode>
      {/* TOAST DE BOAS VINDAS */}
      {showWelcome && name !== "Convidado" && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-10 duration-500">
          <div className="glass px-8 py-4 rounded-full border border-emerald-500/30 flex items-center gap-4 shadow-2xl bg-white/90 backdrop-blur-md">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
            <p className="text-xs uppercase font-black tracking-widest leading-none text-slate-800">
              Paz seja convosco, <span className="text-emerald-700">{name}</span>
            </p>
          </div>
        </div>
      )}

      <App userRole={role} userName={name} />
    </StrictMode>
  );
};

createRoot(document.getElementById('root')!).render(<Root />);