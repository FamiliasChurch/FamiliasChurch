import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from "react-router-dom";
import { messaging, db, auth } from './lib/firebase';
import { getToken } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ConfirmProvider } from "./context/ConfirmContext";

import Layout from "./components/layout";
import ProtectedRoute from "./components/ProtectedRoute";

// --- PÁGINAS ---
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
import ScaleDetails from "./pages/ScaleDetails";
import ConfiguracoesPastor from "./pages/ConfiguracoesPastor";

// --- PÁGINAS DO ENCONTRO ---
import EncontroComDeus from "./pages/Encontro/EncontroComDeus";
import InscricaoEncontrista from "./pages/Encontro/InscricaoEncontrista";
import InscricaoServo from "./pages/Encontro/InscricaoServo";
import LoginEncontro from "./pages/Encontro/LoginEncontro";
import DashboardEncontrista from "./pages/Encontro/DashboardEncontrista";
import GerenciamentoEncontro from "./pages/Encontro/Gerenciamento";
import ValidadorQR from "./pages/Encontro/ValidadorQR";
import SimuladorEncontro from "./pages/Encontro/Simulador";

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
          const currentToken = await getToken(messaging, {
            vapidKey: 'BAi4Y5sN9NMC4gn9626R4934k2qIRJCIKeBvPOG8hlOx7vvUtKvvx1hKBjnTBAlzg_VsLbHDaShWegvjHb4fqmA'
          });

          if (currentToken) {
            console.log('Token FCM:', currentToken);
            const user = auth.currentUser;
            if (user && user.email) {
              const userRef = doc(db, "contas_acesso", user.email);
              await updateDoc(userRef, {
                fcmTokens: arrayUnion(currentToken)
              });
            }
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

          {/* Rotas do Encontro com Deus */}
          <Route path="/encontro" element={<EncontroComDeus />} />
          <Route path="/encontro/login" element={<LoginEncontro />} />
          <Route path="/encontro/inscricao" element={<InscricaoEncontrista />} />
          <Route path="/encontro/servo" element={<InscricaoServo />} />
          <Route path="/encontro/dashboard" element={<DashboardEncontrista />} />
          <Route path="/encontro/gerenciamento" element={<GerenciamentoEncontro />} />
          <Route path="/encontro/validar" element={<ValidadorQR />} />

          <Route path="/simulador-dev-secret" element={<SimuladorEncontro />} />

          {/* Rota de Perfil */}
          <Route path="perfil" element={
            <ProtectedRoute
              userRole={userRole}
              allowedRoles={[
                "Dev", "Admin", "Gerenciador", "Moderador", "Publicador", "Midia", "Staff", "Líder",
                "Membro", "Congregado", "Apóstolo", "Pastor", "Evangelista", "Presbítero", "Diácono", "Obreiro", "Servo", "Secretaria"
              ]}
            >
              <ProfilePage />
            </ProtectedRoute>
          } />

          {/* Rota pública para validação de carteirinha */}
          <Route path="/validar/:ra" element={<ValidateCredential />} />

          {/* Detalhes da Escala */}
          <Route path="/escala/:id" element={<ScaleDetails />} />

          {/* --- ÁREA ADMINISTRATIVA --- */}
          <Route path="admin" element={
            <ProtectedRoute
              userRole={userRole}
              allowedRoles={[
                "Dev", "Admin", "Gerenciador", "Moderador", "Publicador", "Midia", "Staff", "Líder",
                "Apóstolo", "Pastor", "Secretaria", "Evangelista", "Presbítero", "Diácono", "Obreiro"
              ]}
            >
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* --- ROTA SECRETA DO PASTOR (SEGURANÇA) --- */}
          <Route path="admin/config-pastor-secret" element={
            <ProtectedRoute
              userRole={userRole}
              allowedRoles={["Dev", "Admin", "Pastor"]} // Apenas alto nível
            >
              <ConfiguracoesPastor />
            </ProtectedRoute>
          } />

        </Route>
      </Routes>
    </ConfirmProvider>
  );
}