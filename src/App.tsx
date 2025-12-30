import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { messaging, db } from './lib/firebase'; 
import { getToken } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
// Import do Contexto (Já estava aí)
import { ConfirmProvider } from "./context/ConfirmContext";

// Componentes de Estrutura
import Layout from "./components/layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Páginas Públicas
import Home from "./pages/Home";
import Donations from "./pages/Donations";
import Login from "./pages/Login"; 
import ProfilePage from "./pages/ProfilePage";
import Devocionais from "./pages/Devocionais";
import Eventos from "./pages/Eventos";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

// O ÚNICO Admin que importa agora
import AdminDashboard from "./pages/Admin";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

interface AppProps {
  userRole: string;
  userName: string;
}

export default function App({ userRole, userName }: AppProps) {

  // LÓGICA DE NOTIFICAÇÃO PUSH
  useEffect(() => {
    const setupNotifications = async () => {
      console.log("🔔 Iniciando configuração de notificações...");
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getToken(messaging, { 
            vapidKey: 'BMQvahXVL6HdP-ZxwHcTp-9mPVCPpPsPz9wYIfdI0Ga6OsyD_cQh7t_3LVdzhCTHJNKO7refM4AFL38j5K2Fvfw' 
          });

          if (token) {
            await setDoc(doc(db, "notificacoes_inscritos", token), {
              token: token,
              plataforma: 'web',
              inscrito_em: serverTimestamp(),
              ultimo_acesso: serverTimestamp()
            });
            console.log("☁️ Token salvo!");
          }
        }
      } catch (error) {
        console.error("❌ Erro ao configurar Push:", error);
      }
    };
    setupNotifications();
  }, []);

  return (
    // CORREÇÃO: Envolvendo o app com o Provider do Modal
    <ConfirmProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Layout userRole={userRole} userName={userName} />}>
            
            {/* Rotas Públicas */}
            <Route index element={<Home />} />
            <Route path="doacoes" element={<Donations />} />
            <Route path="login" element={<Login />} />
            <Route path="devocionais" element={<Devocionais />} />
            <Route path="eventos" element={<Eventos />} />
            <Route path="politica" element={<Privacy />} />
            <Route path="termos" element={<Terms />} />

            {/* Rota de Perfil (Para todos os membros logados) */}
            <Route path="perfil" element={
              <ProtectedRoute userRole={userRole} allowedRoles={["Membro", "Congregado", "Dev", "Apóstolo", "Secretaria", "Pastor", "Mídia", "Evangelista", "Presbítero", "Diácono", "Obreiro", "Servo"]}>
                <ProfilePage />
              </ProtectedRoute>
            } />

            {/* ROTA MESTRA DO ADMIN */}
            <Route path="admin" element={
              <ProtectedRoute userRole={userRole} allowedRoles={["Dev", "Apóstolo", "Secretaria", "Pastor", "Mídia"]}>
                  <AdminDashboard />
              </ProtectedRoute>
            } />

          </Route>
        </Routes>
      </BrowserRouter>
    </ConfirmProvider>
  );
}