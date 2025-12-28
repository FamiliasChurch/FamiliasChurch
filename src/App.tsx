import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { messaging, db } from './lib/firebase'; 
import { getToken } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

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

// Páginas Administrativas
import AdminDashboard from "./pages/Admin";
import AdminAudit from "./pages/AdminAudit";
import MembersList from "./pages/MembersList";
import BibleStudies from "./pages/BibleStudies";
import EventsManagement from "./pages/EventsManagement";
import MinistriesManagement from "./pages/MinistriesManagement";
import MembersManagement from "./pages/MembersManagement";

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

  // LÓGICA DE NOTIFICAÇÃO PUSH COM LOGS DE DEBUG
  useEffect(() => {
    const setupNotifications = async () => {
      console.log("🔔 Iniciando configuração de notificações...");
      try {
        const permission = await Notification.requestPermission();
        console.log("🔐 Status da permissão:", permission);

        if (permission === 'granted') {
          console.log("🔑 Solicitando Token ao Firebase...");
          const token = await getToken(messaging, { 
            vapidKey: 'BMQvahXVL6HdP-ZxwHcTp-9mPVCPpPsPz9wYIfdI0Ga6OsyD_cQh7t_3LVdzhCTHJNKO7refM4AFL38j5K2Fvfw' 
          });

          if (token) {
            console.log("✅ Token gerado com sucesso:", token);
            
            // Gravação no Firestore
            const docRef = doc(db, "notificacoes_inscritos", token);
            await setDoc(docRef, {
              token: token,
              plataforma: 'web',
              inscrito_em: serverTimestamp(),
              ultimo_acesso: serverTimestamp()
            });
            console.log("☁️ Token salvo no Firestore na coleção 'notificacoes_inscritos'");
          } else {
            console.warn("⚠️ Nenhum token foi gerado. Verifique as configurações do Firebase.");
          }
        } else {
          console.warn("🚫 Permissão de notificação negada pelo usuário.");
        }
      } catch (error) {
        console.error("❌ Erro detalhado ao configurar Push:", error);
      }
    };

    setupNotifications();
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout userRole={userRole} userName={userName} />}>
          <Route index element={<Home />} />
          <Route path="doacoes" element={<Donations />} />
          <Route path="login" element={<Login />} />
          <Route path="devocionais" element={<Devocionais />} />
          <Route path="eventos" element={<Eventos />} />

          <Route path="perfil" element={
            <ProtectedRoute userRole={userRole} allowedRoles={["Membro", "Congregado", "Dev", "Apóstolo", "Secretaria", "Pastor", "Mídia"]}>
              <ProfilePage />
            </ProtectedRoute>
          } />

          <Route path="admin" element={<AdminDashboard />} />

          <Route
            path="/admin/financeiro"
            element={
              <ProtectedRoute userRole={userRole} allowedRoles={["Secretaria", "Apóstolo", "Dev"]}>
                <AdminAudit userRole={userRole} />
              </ProtectedRoute>
            }
          />

          <Route path="membros" element={
            <ProtectedRoute userRole={userRole} allowedRoles={["Apóstolo", "Dev"]}>
              <MembersList />
            </ProtectedRoute>
          } />

          <Route path="estudos" element={
            <ProtectedRoute userRole={userRole} allowedRoles={["Pastor", "Apóstolo", "Dev"]}>
              <BibleStudies userRole={userRole} userName={userName} />
            </ProtectedRoute>
          } />

          <Route path="gestao-eventos" element={
            <ProtectedRoute userRole={userRole} allowedRoles={["Mídia", "Apóstolo", "Dev"]}>
              <EventsManagement userRole={userRole} />
            </ProtectedRoute>
          } />

          <Route path="gestao-membros" element={
            <ProtectedRoute userRole={userRole} allowedRoles={["Apóstolo", "Dev", "Secretaria"]}>
              <MembersManagement />
            </ProtectedRoute>
          } />

          <Route path="gestao-ministerios" element={
            <ProtectedRoute userRole={userRole} allowedRoles={["Mídia", "Apóstolo", "Dev"]}>
              <MinistriesManagement userRole={userRole} />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}