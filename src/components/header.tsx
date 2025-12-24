import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Bell} from "lucide-react";
// 1. O Vite vai gerenciar esse caminho automaticamente no build
import logoIgreja from "../assets/logo.jpg"; 
import fotoApostolo from "../assets/Ap.jpg";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  // Use caminhos relativos para as âncoras (#) e Link para as rotas
  const navLinks = [
    { name: "Início", href: "#inicio", isRoute: false },
    { name: "Cultos", href: "#cultos", isRoute: false },
    { name: "Ministérios", href: "#ministerios", isRoute: false },
    { name: "Quem Somos", href: "#sobre", isRoute: false },
    { name: "Eventos", href: "#eventos", isRoute: false },
    { name: "Doações", href: "/doacoes", isRoute: true }, // Rota interna
  ];

  return (
    <header className="fixed top-0 w-full z-50 glass h-20 flex items-center border-b border-white/5">
      <div className="container mx-auto px-6 flex justify-between items-center">
        
        {/* LOGO - Agora usando a variável importada */}
        <Link to="/" className="flex items-center gap-3">
          <img 
            src={logoIgreja} 
            alt="Logo Famílias Church" 
            className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-destaque object-cover" 
          />
          <span className="font-display text-2xl md:text-3xl font-bold tracking-tight hidden sm:block">
            FAMÍLIAS CHURCH
          </span>
        </Link>

        {/* MENU DESKTOP */}
        <nav className="hidden lg:flex items-center gap-8">
          <ul className="flex gap-6 text-[11px] font-bold tracking-[0.2em] uppercase text-white/70">
            {navLinks.map((link) => (
              <li key={link.name}>
                {link.isRoute ? (
                  <Link to={link.href} className="hover:text-destaque transition-colors">
                    {link.name}
                  </Link>
                ) : (
                  <a href={link.href} className="hover:text-destaque transition-colors">
                    {link.name}
                  </a>
                )}
              </li>
            ))}
          </ul>

          {/* ICONES DE CONTROLE */}
          <div className="flex items-center gap-4 pl-4 border-l border-white/10">
            <button className="text-destaque hover:scale-110 transition-transform">
              <Bell size={20} />
            </button>
            <Link to="/admin" className="border-2 border-destaque rounded-full p-0.5">
              <img 
                src="https://www.w3schools.com/howto/img_avatar.png" 
                className="w-8 h-8 rounded-full" 
                alt="Perfil" 
              />
            </Link>
          </div>
        </nav>

        {/* BOTÃO MOBILE */}
        <button className="lg:hidden text-destaque" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={32} /> : <Menu size={32} />}
        </button>
      </div>

      {/* MENU MOBILE EXPANSÍVEL */}
      {isOpen && (
        <div className="absolute top-20 left-0 w-full glass flex flex-col items-center py-10 gap-6 lg:hidden animate-in slide-in-from-top duration-300">
          {navLinks.map((link) => (
            link.isRoute ? (
              <Link
                key={link.name}
                to={link.href}
                className="text-lg font-bold uppercase tracking-widest"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ) : (
              <a
                key={link.name}
                href={link.href}
                className="text-lg font-bold uppercase tracking-widest"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </a>
            )
          ))}
        </div>
      )}
    </header>
  );
}