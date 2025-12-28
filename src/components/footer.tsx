import { Instagram, Facebook, Youtube, MapPin, Phone, Church } from "lucide-react";

const redesSociais = [
  { name: "Instagram", icon: <Instagram size={18} />, url: "https://www.instagram.com/familias.church/" },
  { name: "Facebook", icon: <Facebook size={18} />, url: "https://www.facebook.com/IeadFamiliasFazendaRiogrande" },
  { name: "Youtube", icon: <Youtube size={18} />, url: "https://www.youtube.com/@FamiliasChurch" },
];

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-slate-100 py-10">
      <div className="container mx-auto px-6 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 lg:gap-12">
        
        {/* IDENTIDADE + REDES (Compacto) */}
        <div className="text-center lg:text-left space-y-3 max-w-sm">
          <div className="flex items-center justify-center lg:justify-start gap-2 text-slate-800">
            <Church size={24} className="text-blue-600" />
            <span className="font-display text-xl font-bold uppercase tracking-tight">Famílias Church</span>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed italic">
            "Uma família para você pertencer. Restaurando vidas em Fazenda Rio Grande e Tijucas."
          </p>
          <div className="flex justify-center lg:justify-start gap-4 pt-1">
            {redesSociais.map((rede) => (
              <a
                key={rede.name}
                href={rede.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-600 transition-colors p-2 bg-white rounded-full border border-slate-100 shadow-sm hover:shadow-md"
                title={rede.name}
              >
                {rede.icon}
              </a>
            ))}
          </div>
        </div>

        {/* CONTATO (Linha única no desktop) */}
        <div className="text-center lg:text-left space-y-2">
          <h3 className="font-black text-blue-600 uppercase tracking-widest text-[10px] mb-2">Contato</h3>
          <div className="flex flex-col gap-2 text-slate-600 text-xs font-medium">
            <div className="flex items-center justify-center lg:justify-start gap-2"><MapPin size={14} /> Fazenda Rio Grande, PR</div>
            <div className="flex items-center justify-center lg:justify-start gap-2"><Phone size={14} /> (41) 99999-9999</div>
          </div>
        </div>

        {/* MAPA (Pequeno e Arredondado) */}
        <div className="w-full lg:w-64 h-32 rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3596.5298154564883!2d-49.3039785!3d-25.6537385!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94dcf97f536c4b2b%3A0x633390c58e0a84e2!2sFazenda%20Rio%20Grande%2C%20PR!5e0!3m2!1spt-BR!2sbr!4v1703615000000!5m2!1spt-BR!2sbr" 
            title="Localização"
            className="w-full h-full grayscale opacity-70 hover:opacity-100 transition-all"
            loading="lazy"
          />
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-bold">© 2025 Famílias Church</p>
      </div>
    </footer>
  );
}