import { useState, useEffect } from "react";
import { X, Sparkles, ArrowRight, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

export default function HighlightPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Mostra o popup após 2 segundos que a pessoa entrou no site
    const timer = setTimeout(() => {
      // Verifica se já viu o popup hoje (opcional)
      const jaViu = sessionStorage.getItem("seenPopup");
      if (!jaViu) {
        setIsVisible(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem("seenPopup", "true"); // Grava que já viu pra não abrir de novo na mesma sessão
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* OVERLAY (Fundo escuro com blur) */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 animate-in fade-in"
        onClick={handleClose}
      />

      {/* CARD DO POPUP */}
      <div className="relative bg-white w-full max-w-sm md:max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 border border-white/20 ring-1 ring-black/5">
        
        {/* Fundo Decorativo (Gradiente) */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-600 to-indigo-600">
            {/* Círculos decorativos */}
            <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-white/10 rounded-full blur-xl" />
            <div className="absolute bottom-[-20px] left-[-20px] w-32 h-32 bg-white/10 rounded-full blur-xl" />
        </div>

        {/* Botão Fechar */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-all backdrop-blur-md z-20"
        >
          <X size={20} />
        </button>

        {/* Conteúdo */}
        <div className="relative z-10 pt-8 px-8 pb-8 text-center mt-10">
            
            {/* Ícone Flutuante */}
            <div className="mx-auto w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-blue-600 mb-6 transform -rotate-6 border-4 border-white/50">
                <Sparkles size={32} className="animate-pulse" />
            </div>

            <h3 className="font-display text-3xl font-bold text-slate-800 uppercase tracking-tighter mb-2">
                Seja Bem-Vindo!
            </h3>
            
            <p className="text-slate-500 text-sm leading-relaxed mb-8 px-2">
                É uma alegria ter você aqui na <strong>Famílias Church</strong>. 
                Confira nossa agenda da semana e participe conosco!
            </p>

            {/* Ações */}
            <div className="space-y-3">
                <Link 
                    to="/eventos" 
                    onClick={handleClose}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:scale-[1.02] transition-all"
                >
                    <Calendar size={16} /> Ver Programação
                </Link>
                
                <button 
                    onClick={handleClose}
                    className="w-full bg-slate-50 text-slate-400 py-3 rounded-2xl font-bold text-xs uppercase tracking-wide hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                    Agora não
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}