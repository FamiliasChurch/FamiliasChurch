import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
// Adicionado getDocs e where para a limpeza
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc, getDocs, where } from "firebase/firestore";
import { Calendar, Trash2, MapPin, Plus, Loader2, Image as ImageIcon, Type, Layout, Sparkles } from "lucide-react";

export default function EventsManagement({ userRole }: { userRole: string }) {
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados do Formulário
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("Culto");
  const [dataEvento, setDataEvento] = useState("");
  const [local, setLocal] = useState("Sede Fazenda Rio Grande");
  const [imagem, setImagem] = useState("");

  // 1. FUNÇÃO DE FAXINA (Apaga eventos antigos do banco)
  const limparEventosAntigos = async () => {
    const agora = new Date();
    const q = query(collection(db, "agenda_eventos"), where("dataReal", "<", agora));
    
    try {
      const snapshot = await getDocs(q);
      const deletando = snapshot.docs.map(evento => deleteDoc(doc(db, "agenda_eventos", evento.id)));
      await Promise.all(deletando);
      if (snapshot.size > 0) console.log(`${snapshot.size} eventos antigos removidos.`);
    } catch (err) {
      console.error("Erro na limpeza:", err);
    }
  };

  useEffect(() => {
    // Executa a limpeza assim que o Admin abre a página
    limparEventosAntigos();

    const q = query(collection(db, "agenda_eventos"), orderBy("dataReal", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setEventos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "agenda_eventos"), {
        titulo,
        descricao,
        tipo,
        dataReal: new Date(dataEvento), // Salva como objeto Date para facilitar filtros
        local,
        capa: imagem || "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073",
        criado_em: serverTimestamp()
      });
      
      setTitulo("");
      setDescricao("");
      setImagem("");
      alert("Evento publicado com sucesso!");
    } catch (err) { 
      alert("Erro ao criar evento."); 
    } finally { 
      setLoading(false); 
    }
  };

  const podeGerir = ["Mídia", "Apóstolo", "Dev"].includes(userRole);
  if (!podeGerir) return <div className="h-screen flex items-center justify-center font-black text-red-600 uppercase">Acesso Negado</div>;

  return (
    <div className="min-h-screen bg-n-fundo pt-32 pb-20 px-6 font-body">
      <div className="container mx-auto max-w-6xl space-y-12">
        
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primaria/10 text-primaria px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={12} /> Limpeza Automática Ativa
            </div>
          </div>
          <h1 className="font-display text-7xl md:text-8xl text-n-texto tracking-tighter uppercase">Gerenciar <span className="text-primaria">Agenda</span></h1>
          <p className="text-[10px] text-n-suave font-black uppercase tracking-[0.4em]">Alimentar a página principal em tempo real</p>
        </div>

        {/* FORMULÁRIO */}
        <section className="bg-white p-10 rounded-[3rem] border border-n-borda shadow-xl">
          <form onSubmit={handleAddEvent} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-n-suave ml-2 flex items-center gap-2"><Type size={12}/> Título do Evento</label>
                <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Conferência de Famílias" className="w-full bg-n-fundo p-5 rounded-2xl border border-n-borda outline-none focus:border-primaria text-n-texto" required />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-n-suave ml-2 flex items-center gap-2"><Calendar size={12}/> Data e Hora</label>
                <input value={dataEvento} onChange={(e) => setDataEvento(e.target.value)} type="datetime-local" className="w-full bg-n-fundo p-5 rounded-2xl border border-n-borda outline-none focus:border-primaria text-n-texto" required />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-n-suave ml-2 flex items-center gap-2"><Layout size={12}/> Tipo / Categoria</label>
                <input value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Culto, Congresso, Festa..." className="w-full bg-n-fundo p-5 rounded-2xl border border-n-borda outline-none focus:border-primaria text-n-texto" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-n-suave ml-2 flex items-center gap-2"><ImageIcon size={12}/> URL da Imagem de Capa</label>
                <input value={imagem} onChange={(e) => setImagem(e.target.value)} placeholder="https://..." className="w-full bg-n-fundo p-5 rounded-2xl border border-n-borda outline-none focus:border-primaria text-n-texto text-xs" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-n-suave ml-2">Breve Descrição (Exibida na Home)</label>
              <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full bg-n-fundo p-5 rounded-2xl border border-n-borda outline-none focus:border-primaria text-n-texto h-32" placeholder="Descreva o que acontecerá..." />
            </div>

            <button disabled={loading} className="w-full bg-n-texto text-white py-6 rounded-full font-black uppercase text-xs tracking-[0.3em] hover:bg-primaria transition-all flex items-center justify-center gap-3">
              {loading ? <Loader2 className="animate-spin" /> : <Plus size={18} />}
              PUBLICAR EVENTO
            </button>
          </form>
        </section>

        {/* LISTAGEM DE EVENTOS ATIVOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {eventos.map(ev => (
            <div key={ev.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-n-borda group hover:shadow-2xl transition-all duration-500">
              <div className="h-40 overflow-hidden relative">
                <img src={ev.capa} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Capa" />
                <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent opacity-60" />
                <button onClick={() => deleteDoc(doc(db, "agenda_eventos", ev.id))} className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-xl">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="p-8 space-y-4 text-n-texto">
                <span className="text-[9px] font-black uppercase text-primaria tracking-widest bg-primaria/5 px-3 py-1 rounded-full">{ev.tipo}</span>
                <h3 className="text-2xl font-bold tracking-tighter">{ev.titulo}</h3>
                <div className="flex flex-col gap-2 text-[10px] uppercase font-bold text-n-suave tracking-widest">
                  <div className="flex items-center gap-2 text-primaria"><Calendar size={14} /> {ev.dataReal?.toDate ? ev.dataReal.toDate().toLocaleString('pt-BR') : 'Data Indisponível'}</div>
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