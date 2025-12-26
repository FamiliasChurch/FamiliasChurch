import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import logoIgreja from "./assets/logo.jpg";

const Root = () => {
  const [role, setRole] = useState("Visitante");
  const [name, setName] = useState("Convidado");
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false); // NOVO: Controle do Alerta

  useEffect(() => {
    // @ts-ignore
    const netlifyIdentity = window.netlifyIdentity;
    if (!netlifyIdentity) {
      setLoading(false);
      return;
    }

    const fetchUserDataFromFirestore = async (user: any) => {
      setLoading(true);
      if (user) {
        try {
          const { doc, getDoc } = await import("firebase/firestore");
          const { db } = await import("./lib/firebase");
          const userDoc = await getDoc(doc(db, "contas_acesso", user.email));

          if (userDoc.exists()) {
            const data = userDoc.data();
            setRole(data.cargo || "Membro");
            setName(data.nome || user.user_metadata?.full_name);
          } else {
            setRole("Membro");
            setName(user.user_metadata?.full_name || "Usuário");
          }
          setShowWelcome(true); // Ativa o alerta após carregar os dados reais
        } catch (error) {
          console.error("Erro ao buscar no banco:", error);
        }
      }
      setLoading(false);
    };

    fetchUserDataFromFirestore(netlifyIdentity.currentUser());
    netlifyIdentity.on('login', (user: any) => fetchUserDataFromFirestore(user));
    netlifyIdentity.on('logout', () => {
      setRole("Visitante");
      setName("Convidado");
      setLoading(false);
      setShowWelcome(false);
    });
  }, []);

  // Timer para sumir o alerta após 5 segundos
  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => setShowWelcome(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <img src={logoIgreja} className="w-24 h-24 rounded-full border-2 border-destaque animate-pulse" />
          <div className="absolute -top-2 -left-2 w-28 h-28 border-t-2 border-destaque rounded-full animate-spin"></div>
        </div>
        <p className="text-destaque font-black uppercase tracking-[0.4em] text-[10px]">Sincronizando Altar...</p>
      </div>
    );
  }

  return (
    <StrictMode>
      {/* ALERTA FLUTUANTE DE BOAS-VINDAS */}
      {showWelcome && name !== "Convidado" && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-500">
          <div className="glass px-8 py-4 rounded-full border border-destaque/30 flex items-center gap-4 shadow-2xl">
            <div className="w-2 h-2 bg-destaque rounded-full animate-ping"></div>
            <p className="text-xs uppercase font-black tracking-widest leading-none">
              Bem-vindo de volta, <span className="text-destaque">{name}</span>
            </p>
          </div>
        </div>
      )}

      <App userRole={role} userName={name} />
    </StrictMode>
  );
};

createRoot(document.getElementById('root')!).render(<Root />);