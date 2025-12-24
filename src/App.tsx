import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout";
import Home from "./pages/Home";
import Donations from "./pages/Donations";
import AdminDashboard from "./pages/Admin";
import MembersList from "./pages/MembersList";
import BibleStudies from "./pages/BibleStudies";
import EventsManagement from "./pages/EventsManagement";
import MinistriesManagement from "./pages/MinistriesManagement";
import ProtectedRoute from "./components/ProtectedRoute";

// Supondo que recebes o userRole do teu estado global de Auth
export default function App({ userRole, userName }: { userRole: string, userName: string }) {
  return (
    <BrowserRouter basename="/Familias">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="doacoes" element={<Donations />} />

          {/* ROTAS PROTEGIDAS POR CARGO */}

          {/* Tesouraria e Liderança */}
          <Route path="admin" element={
            <ProtectedRoute userRole={userRole} allowedRoles={["Tesoureira", "Apóstolo", "Dev"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Só Apóstolo e Dev */}
          <Route path="membros" element={
            <ProtectedRoute userRole={userRole} allowedRoles={["Apóstolo", "Dev"]}>
              <MembersList />
            </ProtectedRoute>
          } />

          {/* Pastores e Liderança de Ensino */}
          <Route path="estudos" element={
            <ProtectedRoute userRole={userRole} allowedRoles={["Pastor", "Apóstolo", "Dev"]}>
              <BibleStudies userRole={userRole} userName={userName} />
            </ProtectedRoute>
          } />

          {/* Equipa de Mídia e Apóstolo */}
          <Route path="gestao-eventos" element={
            <ProtectedRoute userRole={userRole} allowedRoles={["Mídia", "Apóstolo", "Dev"]}>
              <EventsManagement userRole={userRole} />
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