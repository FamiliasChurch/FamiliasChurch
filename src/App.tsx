import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from "react-router-dom"; 
import { messaging, db, auth } from './lib/firebase'; 
import { getToken } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'; // Changed to updateDoc/arrayUnion
import { onAuthStateChanged } from 'firebase/auth';
import { ConfirmProvider } from "./context/ConfirmContext";

import Layout from "./components/layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Donations from "./pages/Donations";
import Login from "./pages/Login"; 
import ProfilePage from "./pages/ProfilePage";
import Devocionais from "./pages/Devocionais";
import Eventos from "./pages/Eventos";
import EncontroComDeus from "./pages/EncontroComDeus";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import AdminDashboard from "./pages/Admin";
import ValidateCredential from "./pages/ValidateCredential";
import ScaleDetails from "./pages/ScaleDetails";

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

  useEffect(() => {
    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Get the token
          const currentToken = await getToken(messaging, { 
            vapidKey: 'BMQvahXVL6HdP-ZxwHcTp-9mPVCPpPsPz9wYIfdI0Ga6OsyD_cQh7t_3LVdzhCTHJNKO7refM4AFL38j5K2Fvfw' // You need to generate a VAPID key in Firebase Console -> Cloud Messaging -> Web Configuration
          });

          if (currentToken) {
            console.log('Token FCM:', currentToken);
            // Save token to user profile if logged in
            const user = auth.currentUser;
            if (user) {
                const userRef = doc(db, "contas_acesso", user.email!);
                await updateDoc(userRef, {
                    fcmTokens: arrayUnion(currentToken)
                });
            }
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        }
      } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
      }
    };

    requestPermission();
  }, []);

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
          <Route path="encontro" element={<EncontroComDeus />} />
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