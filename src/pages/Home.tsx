import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot, limit, addDoc, serverTimestamp, where } from "firebase/firestore";
import { Heart, MapPin, Quote, Send, Star, Loader2, Calendar, Clock } from "lucide-react";

// CORREÇÃO: Import apontando para a pasta assets
import fotoApostolo from "../assets/Ap.jpg";

export default function Home() {
    const [activeTab, setActiveTab] = useState(0);
    const [activeState, setActiveState] = useState('pr'); // Controle da Sede (PR ou SC)
    const [pedido, setPedido] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [eventos, setEventos] = useState<any[]>([]);

    const ministerios = [
        { titulo: "Louvor", desc: "Levando a igreja à presença de Deus através da adoração profunda.", img: "https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=2070" },
        { titulo: "Famílias", desc: "Edificando lares sobre a Rocha, fortalecendo casamentos.", img: "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2070" },
        { titulo: "Déboras", desc: "Mulheres de intercessão que se levantam em oração fervorosa.", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1888" },
        { titulo: "Jovens", desc: "Uma geração de força, santidade e propósito.", img: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2070" },
        { titulo: "Teens", desc: "Novas promessas para essa geração.", img: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2070" },
        { titulo: "Kids", desc: "Ensinando a próxima geração com amor e a pureza da Palavra.", img: "https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?q=80&w=2069" },
        { titulo: "Teatro", desc: "Formando Jovens a buscar a Deus com seus talentos.", img: "https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?q=80&w=2069" },
        { titulo: "Dança", desc: "Incentivando a adoração a Deus com nossos corpos.", img: "https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?q=80&w=2069" },
    ];

    useEffect(() => {
        const q = query(
            collection(db, "agenda_eventos"),
            where("dataReal", ">=", new Date()),
            orderBy("dataReal", "asc"),
            limit(3)
        );
        const unsub = onSnapshot(q, (snap) => {
            setEventos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    const enviarAoAltar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pedido.trim()) return;
        setEnviando(true);
        try {
            await addDoc(collection(db, "pedidos_oracao"), { conteudo: pedido, data: serverTimestamp() });
            setPedido("");
            alert("Pedido enviado com sucesso!");
        } catch (err) { alert("Erro ao enviar."); }
        finally { setEnviando(false); }
    };

    return (
        <div className="min-h-screen bg-n-fundo text-n-texto font-body selection:bg-primaria/10">
            <main id="inicio">
                {/* HERO SECTION */}
                <section className="relative h-screen flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073')] bg-cover opacity-5" />
                    <div className="relative z-10 text-center space-y-8 px-6">
                        <h1 className="text-n-texto font-display text-7xl md:text-[10rem] leading-none uppercase tracking-tighter">
                            FAMÍLIAS <span className="text-primaria">CHURCH</span>
                        </h1>
                        <p className="text-xl md:text-3xl text-n-suave font-light italic tracking-widest italic">"Restaurar, Cuidar e Amar"</p>
                        <div className="flex flex-col md:flex-row gap-4 justify-center">
                            <a href="#cultos" className="bg-n-texto text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-primaria transition-all flex items-center justify-center gap-2 shadow-lg">
                                <MapPin size={20} /> Venha nos Visitar
                            </a>
                            <a href="/doacoes" className="bg-white text-n-texto border border-n-borda px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                <Heart size={20} /> Semeie
                            </a>
                        </div>
                    </div>
                </section>

                {/* PRÓXIMOS ENCONTROS */}
                <section id="eventos" className="py-24 bg-white border-y border-n-borda">
                    <div className="container mx-auto px-6">
                        <div className="mb-12 border-l-4 border-primaria pl-6">
                            <h2 className="font-display text-6xl uppercase tracking-tighter text-n-texto">Próximos Encontros</h2>
                            <p className="text-n-suave uppercase tracking-widest text-[10px] font-black mt-2">Agenda em Tempo Real</p>
                        </div>
                        {eventos.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 bg-gray-50 h-[400px] rounded-[3rem] p-12 flex flex-col justify-end relative overflow-hidden group border border-n-borda shadow-inner">
                                    <img src={eventos[0].capa} className="absolute inset-0 w-full h-full object-cover opacity-10" alt="Evento" />
                                    <span className="relative z-10 bg-primaria text-white px-4 py-1 rounded-full text-[10px] font-black w-fit mb-4 uppercase tracking-widest">{eventos[0].tipo || "Destaque"}</span>
                                    <h3 className="relative z-10 text-5xl font-black uppercase tracking-tighter leading-none text-n-texto">{eventos[0].titulo}</h3>
                                    <p className="relative z-10 text-n-suave mt-4 line-clamp-2 italic">{eventos[0].descricao}</p>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {eventos.slice(1).map((ev) => (
                                        <div key={ev.id} className="bg-white p-8 rounded-[2.5rem] border border-n-borda hover:shadow-md transition-all">
                                            <p className="text-primaria text-[10px] font-black uppercase tracking-widest mb-2">{ev.diaSemana} | {ev.horario}</p>
                                            <p className="font-bold uppercase text-lg text-n-texto">{ev.titulo}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="py-20 text-center border-2 border-dashed border-n-borda rounded-[3rem]">
                                <p className="uppercase tracking-widest font-black text-xs text-n-suave">Aguardando Novas Sementes na Agenda</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* SOBRE O APÓSTOLO */}
                <section id="sobre" className="py-24 container mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                    <div className="bg-gray-50 p-12 rounded-[3rem] border border-n-borda relative">
                        <Quote className="text-n-suave w-12 h-12 opacity-10 absolute top-8 left-8" />
                        <blockquote className="text-2xl leading-relaxed italic pt-8 text-n-texto">
                            "Roguemos a vocês, irmãos, que admoestem os indisciplinados, consolem os desanimados, amparem os fracos e sejam pacientes com todos."
                        </blockquote>
                        <cite className="block text-primaria font-black uppercase tracking-widest text-xs mt-4">— 1 Tessalonicenses 5.14</cite>
                    </div>
                    <div className="flex items-center gap-8">
                        <img src={fotoApostolo} alt="Apóstolo" className="w-48 h-48 rounded-[2rem] object-cover border-2 border-primaria p-2 shadow-lg shadow-primaria/10" />
                        <div>
                            <h3 className="font-display text-5xl leading-none text-n-texto">José Roberto Couto</h3>
                            <p className="text-n-suave tracking-widest uppercase text-xs mt-2 font-black">Apóstolo e Fundador</p>
                        </div>
                    </div>
                </section>

                {/* SEÇÃO DE CULTOS (HORÁRIOS) - REINTEGRADA COM ESTILO NEUTRO */}
                <section id="cultos" className="py-24 bg-n-fundo">
                    <div className="container mx-auto px-6 space-y-12">
                        <div className="text-center space-y-4">
                            <h2 className="font-display text-7xl uppercase tracking-tighter text-n-texto">Nossas Sedes</h2>
                            <div className="flex justify-center gap-4">
                                {['pr', 'sc'].map((state) => (
                                    <button
                                        key={state}
                                        onClick={() => setActiveState(state)}
                                        className={`px-10 py-3 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-sm ${
                                            activeState === state ? 'bg-n-texto text-white scale-105' : 'bg-white border border-n-borda text-n-suave hover:bg-gray-50'
                                        }`}
                                    >
                                        {state === 'pr' ? 'Paraná' : 'Santa Catarina'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-10 items-stretch">
                            <div className="space-y-6">
                                <h3 className="font-display text-5xl text-primaria uppercase tracking-tighter">
                                    {activeState === 'pr' ? 'Fazenda Rio Grande' : 'T i j u c a s'}
                                </h3>
                                <div className="grid gap-4">
                                    {/* Card Domingo */}
                                    <div className="bg-white p-8 rounded-[2.5rem] flex justify-between items-center border border-n-borda shadow-sm group hover:border-primaria/30 transition-all">
                                        <div className="flex items-center gap-5">
                                            <div className="bg-n-fundo p-4 rounded-2xl text-primaria group-hover:bg-primaria group-hover:text-white transition-colors">
                                                <Calendar size={24} />
                                            </div>
                                            <div>
                                                <p className="font-black text-primaria text-[10px] tracking-widest uppercase italic">Domingo</p>
                                                <p className="text-xl font-bold text-n-texto mt-1">Culto da Família</p>
                                            </div>
                                        </div>
                                        <span className="text-4xl font-display text-n-texto">19:00</span>
                                    </div>
                                    {/* Card Quinta */}
                                    <div className="bg-white p-8 rounded-[2.5rem] flex justify-between items-center border border-n-borda shadow-sm group hover:border-primaria/30 transition-all">
                                        <div className="flex items-center gap-5">
                                            <div className="bg-n-fundo p-4 rounded-2xl text-primaria group-hover:bg-primaria group-hover:text-white transition-colors">
                                                <Clock size={24} />
                                            </div>
                                            <div>
                                                <p className="font-black text-primaria text-[10px] tracking-widest uppercase italic">Quinta-Feira</p>
                                                <p className="text-xl font-bold text-n-texto mt-1">Ensino Bíblico</p>
                                            </div>
                                        </div>
                                        <span className="text-4xl font-display text-n-texto">20:00</span>
                                    </div>
                                </div>
                            </div>
                            {/* MAPA ESTILIZADO */}
                            <div className="bg-white p-3 rounded-[3rem] overflow-hidden h-[400px] border border-n-borda shadow-inner">
                                <iframe
                                    src={activeState === 'pr' ? "URL_MAPA_FAZENDA" : "URL_MAPA_TIJUCAS"}
                                    title="Localização"
                                    className="w-full h-full rounded-[2.5rem] grayscale opacity-70 hover:opacity-100 transition-opacity"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* MINISTÉRIOS */}
                <section id="ministerios" className="py-24 bg-gray-50">
                    <div className="container mx-auto px-6 text-center">
                        <h2 className="font-display text-7xl mb-12 uppercase tracking-tighter text-n-texto">Nossos <span className="text-primaria">Ministérios</span></h2>
                        <div className="flex flex-wrap justify-center gap-3 mb-16">
                            {ministerios.map((m, index) => (
                                <button
                                    key={m.titulo}
                                    onClick={() => setActiveTab(index)}
                                    className={`px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === index ? 'bg-primaria text-white shadow-lg' : 'bg-white border border-n-borda text-n-suave hover:bg-gray-100'}`}
                                >
                                    {m.titulo}
                                </button>
                            ))}
                        </div>
                        <div className="bg-white rounded-[3rem] overflow-hidden grid md:grid-cols-2 min-h-[500px] border border-n-borda shadow-xl">
                            <img src={ministerios[activeTab].img} className="h-full w-full object-cover" alt="Ministério" />
                            <div className="p-16 flex flex-col justify-center text-left space-y-8">
                                <h3 className="text-6xl font-black uppercase tracking-tighter text-n-texto leading-none">{ministerios[activeTab].titulo}</h3>
                                <div className="w-24 h-1 bg-primaria" />
                                <p className="text-xl text-n-suave leading-relaxed font-light">{ministerios[activeTab].desc}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* PEDIDO DE ORAÇÃO */}
                <section className="py-32 bg-white relative overflow-hidden">
                    <form onSubmit={enviarAoAltar} className="container mx-auto px-6 max-w-4xl text-center space-y-12 relative z-10">
                        <div className="space-y-4">
                            <h2 className="font-display text-8xl uppercase tracking-tighter text-n-texto">Pedido de <span className="opacity-30">Oração</span></h2>
                            <p className="text-n-suave uppercase tracking-[0.5em] text-[10px] font-black">Intercessão em Fazenda Rio Grande</p>
                        </div>
                        <textarea
                            value={pedido}
                            onChange={(e) => setPedido(e.target.value)}
                            className="w-full bg-gray-50 p-10 rounded-[3rem] outline-none focus:border-primaria/30 text-2xl text-n-texto border border-n-borda min-h-[300px]"
                            placeholder="Escreva sua causa aqui..."
                            required
                        />
                        <button type="submit" disabled={enviando} className="w-full bg-n-texto text-white py-8 rounded-full font-black text-xs uppercase tracking-[0.4em] hover:bg-primaria transition-all flex items-center justify-center gap-4 disabled:opacity-50 shadow-xl shadow-n-texto/20">
                            {enviando ? <Loader2 className="animate-spin" /> : <Send size={24} />}
                            {enviando ? "ENVIANDO AO ALTAR..." : "APRESENTAR AO SENHOR AGORA"}
                        </button>
                    </form>
                </section>
            </main>
        </div>
    );
}