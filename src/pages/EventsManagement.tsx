import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { Calendar, Trash2, MapPin} from "lucide-react";

export default function EventsManagement({ userRole }: { userRole: string }) {
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados do Formulário
  const [titulo, setTitulo] = useState("");
  const [dataEvento, setDataEvento] = useState("");
  const [local, setLocal] = useState("Sede Fazenda Rio Grande");
  const [imagem, setImagem] = useState("");

  useEffect(() => {
    const q = query(collection(db, "eventos"), orderBy("data_realizacao", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setEventos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "eventos"), {
        titulo,
        data_realizacao: dataEvento,
        local,
        imagem: imagem || "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073",
        criado_em: serverTimestamp()
      });
      setTitulo("");
      setImagem("");
    } catch (err) { alert("Erro ao criar evento."); }
    finally { setLoading(false); }
  };

  const podeGerir = ["Mídia", "Apóstolo", "Dev"].includes(userRole);

  return (
    <div className="min-h-screen bg-background p-6 pt-32 text-white font-body">
      <div className="container mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h1 className="font-display text-7xl text-gradient tracking-tighter uppercase">Eventos</h1>
          <p className="text-[10px] text-white/40 uppercase tracking-[0.4em]">Agenda de Celebrações e Encontros</p>
        </div>

        {podeGerir && (
          <section className="max-w-4xl mx-auto glass p-10 rounded-[3rem] border border-destaque/20">
            <form onSubmit={handleAddEvent} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título do Evento" className="glass p-4 rounded-2xl outline-none focus:border-destaque/50" required />
              <input value={dataEvento} onChange={(e) => setDataEvento(e.target.value)} type="datetime-local" className="glass p-4 rounded-2xl outline-none focus:border-destaque/50 text-white/50" required />
              <input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Localização" className="glass p-4 rounded-2xl outline-none focus:border-destaque/50" />
              <input value={imagem} onChange={(e) => setImagem(e.target.value)} placeholder="URL da Imagem de Capa" className="glass p-4 rounded-2xl outline-none focus:border-destaque/50" />
              <button disabled={loading} className="md:col-span-2 bg-white text-primaria py-4 rounded-full font-black uppercase text-xs tracking-widest hover:scale-[1.02] transition-transform">
                {loading ? "A PROCESSAR..." : "PUBLICAR EVENTO"}
              </button>
            </form>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {eventos.map(ev => (
            <div key={ev.id} className="glass rounded-[2.5rem] overflow-hidden group border border-white/5">
              <div className="h-48 overflow-hidden relative">
                <img src={ev.imagem} className="w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700" alt="Evento" />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                {podeGerir && (
                  <button onClick={() => deleteDoc(doc(db, "eventos", ev.id))} className="absolute top-4 right-4 p-3 glass rounded-full text-red-400 hover:bg-red-500 hover:text-white transition-all">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <div className="p-8 space-y-4">
                <h3 className="text-2xl font-bold">{ev.titulo}</h3>
                <div className="space-y-2 text-[10px] uppercase font-bold text-white/40 tracking-widest">
                  <div className="flex items-center gap-2 text-destaque"><Calendar size={14} /> {new Date(ev.data_realizacao).toLocaleString('pt-PT')}</div>
                  <div className="flex items-center gap-2"><MapPin size={14} /> {ev.local}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}