// src/components/layout.tsx
import { Outlet } from "react-router-dom";
import Header from "./header";
import Footer from "./footer";
// 1. Importe o componente do botão
import FloatingScannerButton from "./FloatingScannerButton";

interface LayoutProps {
  userRole: string;
  userName: string;
}

export default function Layout({ userRole, userName }: LayoutProps) {
  return (
    <>
      <Header userRole={userRole} userName={userName} />
      <main>
        <Outlet context={{ userRole, userName }} />
      </main>
      <Footer />

      {/* 2. Adicione o componente aqui. 
          Como ele usa 'fixed', ficará no canto da tela. 
          Ele só renderiza se o userRole permitir. */}
      <FloatingScannerButton userRole={userRole} />
    </>
  );
}