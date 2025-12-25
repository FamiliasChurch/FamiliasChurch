// main.tsx corrigido
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App' // <--- Certifique-se de que este import existe!

const Root = () => {
  const [role, setRole] = useState("Visitante");
  const [name, setName] = useState("Convidado");

  useEffect(() => {
    // @ts-ignore
    const netlifyIdentity = window.netlifyIdentity;
    if (!netlifyIdentity) return;

    const updateUserInfo = (user: any) => {
      if (user) {
        const userRole = user.app_metadata?.roles?.[0] || "Membro";
        setRole(userRole);
        setName(user.user_metadata?.full_name || "Usuário");
      } else {
        setRole("Visitante");
      }
    };

    updateUserInfo(netlifyIdentity.currentUser());
    netlifyIdentity.on('login', (user: any) => updateUserInfo(user));
    netlifyIdentity.on('logout', () => updateUserInfo(null));
  }, []);

  return (
    <StrictMode>
      {/* VOCÊ PRECISA DISSO AQUI PARA A TELA NÃO FICAR PRETA */}
      <App userRole={role} userName={name} />
    </StrictMode>
  );
};

createRoot(document.getElementById('root')!).render(<Root />);