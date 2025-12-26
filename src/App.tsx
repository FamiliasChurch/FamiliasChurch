import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Layout from "./components/layout";
import Home from "./pages/Home";
import Donations from "./pages/Donations";
import AdminDashboard from "./pages/Admin";
import AdminAudit from "./pages/AdminAudit"; // Importação corrigida
import MembersList from "./pages/MembersList";
import BibleStudies from "./pages/BibleStudies";
import EventsManagement from "./pages/EventsManagement";
import MinistriesManagement from "./pages/MinistriesManagement";
import ProtectedRoute from "./components/ProtectedRoute";
import MembersManagement from "./pages/MembersManagement"; // Faltava esta linha!

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
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* ROTA PAI: O Layout envolve tudo que está dentro dele */}
        <Route path="/" element={<Layout userRole={userRole} userName={userName} />}>

          <Route index element={<Home />} />
          <Route path="doacoes" element={<Donations />} />

          {/* ROTA DE AUDITORIA: Protegida e com acesso restrito */}
          <Route
            path="/admin/financeiro"
            element={
              <ProtectedRoute userRole={userRole} allowedRoles={["Tesoureira", "Apóstolo", "Dev"]}>
                <AdminAudit userRole={userRole} />
              </ProtectedRoute>
            }
          />

          <Route path="admin" element={
            <ProtectedRoute userRole={userRole} allowedRoles={["Tesoureira", "Apóstolo", "Dev"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

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
            <ProtectedRoute userRole={userRole} allowedRoles={["Apóstolo", "Dev"]}>
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