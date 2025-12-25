import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Settings, Clock, Save} from "lucide-react";

export default function ConfigSettings() {
  const [horaNotificacao, setHoraNotificacao] = useState("09");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Busca a configuração atual ao carregar
    const fetchConfig = async () => {
      const docRef = doc(db, "configuracoes", "notificacoes");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setHoraNotificacao(docSnap.data().hora);
    };
    fetchConfig();
  }, []);

  const salvarConfig = async () => {
    setLoading(true);
    await setDoc(doc(db, "configuracoes", "notificacoes"), {
      hora: horaNotificacao,
      ultimaAlteracao: new Date()
    });
    setLoading(false);
    alert("Configuração de avisos atualizada!");
  };

  return (
    <div className="p-8 glass rounded-[3rem] border border-white/5 space-y-8">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <Settings className="text-destaque" size={28} />
        <h2 className="text-3xl font-black uppercase tracking-tighter">Configurações</h2>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Clock className="text-destaque/50" />
          <div className="space-y-1">
            <p className="text-sm font-bold uppercase tracking-widest text-white/80">Horário dos Avisos</p>
            <p className="text-[10px] text-white/30 uppercase">Quando os Servos receberão o lembrete (24h antes)</p>
          </div>
        </div>

        <select 
          value={horaNotificacao}
          onChange={(e) => setHoraNotificacao(e.target.value)}
          className="w-full glass p-5 rounded-2xl outline-none focus:border-destaque/50 text-xl font-bold"
        >
          {Array.from({ length: 24 }).map((_, i) => {
            const h = i.toString().padStart(2, '0');
            return <option key={h} value={h}>{h}:00</option>;
          })}
        </select>

        <button 
          onClick={salvarConfig}
          disabled={loading}
          className="w-full bg-destaque text-primaria py-5 rounded-full font-black uppercase text-xs tracking-[0.2em] hover:scale-105 transition-all flex items-center justify-center gap-3"
        >
          <Save size={18} /> {loading ? "SALVANDO..." : "ATUALIZAR PREFERÊNCIAS"}
        </button>
      </div>
    </div>
  );
}