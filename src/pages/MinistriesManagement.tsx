import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { Shield, LayoutGrid, Info, CheckCircle2, AlertCircle } from "lucide-react";

export default function MinistriesManagement({ userRole }: { userRole: string }) {
  const [ministerios, setMinisterios] = useState<any[]>([]);
  const [salvando, setSalvando] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ministerios_info"), (snap) => {
      setMinisterios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const podeGerir = ["Mídia", "Apóstolo", "Dev"].includes(userRole);

  const atualizarDescricao = async (id: string, novaDesc: string) => {
    setSalvando(id);
    try {
      await updateDoc(doc(db, "ministerios_info", id), { desc: novaDesc });
    } finally {
      setTimeout(() => setSalvando(null), 1000); // Feedback visual
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 pt-32 text-white font-body">
      <div className="container mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="font-display text-7xl md:text-8xl text-gradient tracking-tighter uppercase leading-none">Ministérios</h1>
          <p className="text-[10px] text-white/40 uppercase tracking-[0.5em] font-bold">Gestão Estratégica & Lideranças</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {ministerios.map(m => (
            <div key={m.id} className="glass p-1 rounded-[3.5rem] border border-white/5 relative group overflow-hidden">
              {/* Imagem com Overlay */}
              <div className="relative h-48 w-full overflow-hidden rounded-t-[3.2rem]">
                <img src={m.img} className="w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700" alt={m.titulo} />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
              </div>

              <div className="p-8 pt-4 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-3xl font-black text-destaque tracking-tighter uppercase">{m.titulo}</h3>
                  {salvando === m.id ? (
                    <CheckCircle2 size={16} className="text-green-400 animate-pulse" />
                  ) : (
                    <LayoutGrid size={16} className="text-white/20" />
                  )}
                </div>

                {podeGerir ? (
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Descrição Editável</label>
                    <textarea 
                      defaultValue={m.desc} 
                      onBlur={(e) => atualizarDescricao(m.id, e.target.value)}
                      className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm italic text-white/80 resize-none outline-none focus:border-destaque/40 h-32 transition-all"
                      placeholder="Descreva a missão deste ministério..."
                    />
                  </div>
                ) : (
                  <p className="text-sm text-white/60 leading-relaxed italic border-l-2 border-destaque/30 pl-4">
                    "{m.desc}"
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Shield size={12} className="text-destaque" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Nível: {podeGerir ? 'Gestão' : 'Consulta'}</span>
                  </div>
                  <Info size={14} className="text-white/10 hover:text-destaque transition-colors cursor-help" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
