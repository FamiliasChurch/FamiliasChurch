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
      {/* Container com largura máxima definida para evitar dispersão em telas ultra-wide */}
      <div className="max-w-6xl mx-auto px-6">
        
        {/* GRID PRINCIPAL: 2 Colunas no desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          
          {/* LADO ESQUERDO: Identidade */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-5">
            <div className="flex items-center gap-3 text-slate-800">
              <Church size={28} className="text-blue-600" />
              <span className="font-display text-2xl font-bold uppercase tracking-tighter">
                Famílias Church
              </span>
            </div>
            
            <p className="text-slate-500 text-sm leading-relaxed italic max-w-sm">
              "Uma família para você pertencer. Restaurando vidas em Fazenda Rio Grande e Tijucas através do amor de Cristo."
            </p>

            <div className="flex gap-3 pt-2">
              {redesSociais.map((rede) => (
                <a
                  key={rede.name}
                  href={rede.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all p-3 bg-white rounded-xl border border-slate-100 shadow-sm"
                >
                  {rede.icon}
                </a>
              ))}
            </div>
          </div>

          {/* LADO DIREITO: Contato (Alinhado à direita no desktop) */}
          <div className="flex flex-col items-center lg:items-end justify-start">
            <div className="space-y-4 w-full lg:w-auto">
              <h3 className="font-black text-blue-600 uppercase tracking-[0.2em] text-[11px] text-center lg:text-right">
                Contato
              </h3>
              
              <div className="flex flex-col gap-4 text-slate-600 text-sm font-medium">
                <div className="flex items-center justify-center lg:justify-end gap-3">
                  <span className="text-center lg:text-right">Rua Cassuarina, 219 • Eucaliptos<br/>Fazenda Rio Grande, PR</span>
                </div>

                <a
                  href="tel:+5541987481002"
                  className="flex items-center justify-center lg:justify-end gap-3 hover:text-blue-600 transition-colors"
                >
                  <span>(41) 9 8748-1002</span>
                  <Phone size={16} className="text-blue-400" />
                </a>

                <a
                  href="mailto:adfamiliaigreja@gmail.com"
                  className="flex items-center justify-center lg:justify-end gap-3 hover:text-blue-600 transition-colors"
                >
                  <span>adfamiliaigreja@gmail.com</span>
                  <Mail size={16} className="text-blue-400" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* RODAPÉ INFERIOR: Copyright e Links Legais */}
        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold order-2 md:order-1">
            © 2025 Famílias Church
          </p>

          <div className="flex items-center gap-8 order-1 md:order-2">
            <Link
              to="/politica"
              className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
            >
              <Shield size={14} /> Privacidade
            </Link>

            <Link
              to="/termos"
              className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
            >
              <FileText size={14} /> Termos de Uso
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}