import { Instagram, Facebook, Youtube, Mail, MapPin, Phone, Church, FileText, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const redesSociais = [
  { name: "Instagram", icon: <Instagram size={18} />, url: "https://www.instagram.com/familias.church/" },
  { name: "Facebook", icon: <Facebook size={18} />, url: "https://www.facebook.com/IeadFamiliasFazendaRiogrande" },
  { name: "Youtube", icon: <Youtube size={18} />, url: "https://www.youtube.com/@FamiliasChurch" },
];

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-slate-100 pt-12 pb-8">
      <div className="container mx-auto px-6">

        {/* PARTE SUPERIOR: CONTEÚDO PRINCIPAL */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-10 mb-12">

          {/* 1. IDENTIDADE + REDES */}
          <div className="text-center lg:text-left space-y-4 max-w-sm">
            <div className="flex items-center justify-center lg:justify-start gap-2 text-slate-800">
              <Church size={24} className="text-blue-600" />
              <span className="font-display text-xl font-bold uppercase tracking-tight">Famílias Church</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed italic">
              "Uma família para você pertencer. Restaurando vidas em Fazenda Rio Grande e Tijucas através do amor de Cristo."
            </p>
            <div className="flex justify-center lg:justify-start gap-3 pt-2">
              {redesSociais.map((rede) => (
                <a
                  key={rede.name}
                  href={rede.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm"
                  title={rede.name}
                >
                  {rede.icon}
                </a>
              ))}
            </div>
          </div>

          {/* 2. LINKS RÁPIDOS E CONTATO */}
          <div className="flex flex-col md:flex-row gap-10 text-center lg:text-left">
            <div className="space-y-3">
              <h3 className="font-black text-blue-600 uppercase tracking-widest text-[10px]">Contato</h3>
              <div className="flex flex-col gap-3 text-slate-600 text-xs font-medium">
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <span>Rua Cassuarina, 219 | Eucaliptos</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <span>Fazenda Rio Grande, PR</span>
                </div>

                {/* Link para ligação */}
                <a
                  href="tel:+55 41 9 9999-9999"
                  className="flex items-center justify-center lg:justify-start gap-2 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <Phone size={14} className="text-blue-400" />
                  <span>(41) 9 8748-1002</span>
                </a>
                <a
                  href="mailto:adfamiliaigreja@gmail.com?subject=Dúvida%20do%20Site"
                  className="flex items-center justify-center lg:justify-start gap-2 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <Mail size={14} className="text-blue-400" />
                  <span>adfamiliaigreja@gmail.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        {/* PARTE INFERIOR: DOCUMENTAÇÃO E COPYRIGHT */}
        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">

          <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">
            © 2025 Famílias Church
          </p>

          {/* ÁREA DE DOCUMENTAÇÃO LEGAL */}
          <div className="flex items-center gap-6">
            <Link
              to="/politica"
              target="_blank"
              className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-colors"
            >
              <Shield size={12} /> Privacidade
            </Link>

            <Link
              to="/termos"
              target="_blank"
              className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
              title="Termos de Uso"
            >
              <FileText size={12} /> Termos de Uso
            </Link>
          </div>

        </div>
      </div>
    </footer>
  );
}