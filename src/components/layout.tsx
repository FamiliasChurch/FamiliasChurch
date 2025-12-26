// src/components/layout.tsx
import { Outlet } from "react-router-dom";
import Header from "./header";
import Footer from "./footer";

// VOCÊ PRECISA DESTA INTERFACE PARA O ERRO SUMIR
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
    </>
  );
}