import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from "react-router-dom"; 
import { messaging, db } from './lib/firebase'; 
import { getToken } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ConfirmProvider } from "./context/ConfirmContext";

import Layout from "./components/layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Donations from "./pages/Donations";
import Login from "./pages/Login"; 
import ProfilePage from "./pages/ProfilePage";
import Devocionais from "./pages/Devocionais";
import Eventos from "./pages/Eventos";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import AdminDashboard from "./pages/Admin";
import ValidateCredential from "./pages/ValidateCredential";
import ScaleDetails from "./pages/ScaleDetails"; // <--- IMPORTAÇÃO ADICIONADA

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

interface AppProps {
  userRole: string;
  userName: string;
}

export default function App({ userRole, userName }: AppProps) {

  // (useEffect de notificações mantido igual...)

  return (
    <ConfirmProvider>
      <ScrollToTop />
      
      <Routes>
        <Route path="/" element={<Layout userRole={userRole} userName={userName} />}>
          
          <Route index element={<Home />} />
          <Route path="doacoes" element={<Donations />} />
          <Route path="login" element={<Login />} />
          <Route path="devocionais" element={<Devocionais />} />
          <Route path="eventos" element={<Eventos />} />
          <Route path="politica" element={<Privacy />} />
          <Route path="termos" element={<Terms />} />

          {/* Rota de Perfil: TODOS os cargos logados podem ver */}
          <Route path="perfil" element={
            <ProtectedRoute 
                userRole={userRole} 
                allowedRoles={[
                    // Cargos de Sistema
                    "Dev", "Admin", "Gerenciador", "Moderador", "Publicador", "Midia", "Staff", "Líder",
                    // Cargos Eclesiásticos
                    "Membro", "Congregado", "Apóstolo", "Pastor", "Evangelista", "Presbítero", "Diácono", "Obreiro", "Servo", "Secretaria"
                ]}
            >
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          {/* Rota pública para validação de carteirinha */}
          <Route path="/validar/:ra" element={<ValidateCredential />} />

          {/* NOVA ROTA: Detalhes da Escala (Acessível via link/notificação) */}
          <Route path="/escala/:id" element={<ScaleDetails />} />

          {/* ROTA ADMIN BLINDADA, MAS INCLUSIVA */}
          {/* ATUALIZAÇÃO V2: Agora permite Cargos Eclesiásticos de Liderança entrarem no painel */}
          <Route path="admin" element={
            <ProtectedRoute 
                userRole={userRole} 
                allowedRoles={[
                    // --- Níveis de Sistema ---
                    "Dev", "Admin", "Gerenciador", "Moderador", "Publicador", "Midia", "Staff", "Líder",
                    
                    // --- Níveis Eclesiásticos (Permite acesso, o Admin.tsx define o que veem) ---
                    "Apóstolo", 
                    "Pastor", 
                    "Secretaria", 
                    "Evangelista", 
                    "Presbítero", 
                    "Diácono", 
                    "Obreiro" 
                    // Nota: "Membro", "Congregado" e "Servo" continuam bloqueados do painel
                ]}
            >
                <AdminDashboard />
            </ProtectedRoute>
          } />

        </Route>
      </Routes>
    </ConfirmProvider>
  );
}