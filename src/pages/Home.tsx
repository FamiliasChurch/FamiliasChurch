import { useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
    Music, Heart, Users, Calendar, MapPin,
    Quote, Send, DollarSign, Star, Church, Play, Menu, X
} from "lucide-react";

// Sub-componente de Header para organização
import Header from "../components/header";

export default function Home() {
    const [activeTab, setActiveTab] = useState(0);
    const [activeState, setActiveState] = useState('pr');
    const [pedido, setPedido] = useState("");
    const [enviando, setEnviando] = useState(false);

    const ministerios = [
        { titulo: "Louvor", desc: "Levando a igreja à presença de Deus através da adoração profunda.", img: "https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=2070" },
        { titulo: "Famílias", desc: "Edificando lares sobre a Rocha, fortalecendo casamentos.", img: "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2070" },
        { titulo: "Déboras", desc: "Mulheres de intercessão que se levantam em oração fervorosa.", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1888" },
        { titulo: "Jovens", desc: "Uma geração de força, santidade e propósito.", img: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2070" },
        { titulo: "Kids", desc: "Ensinando a próxima geração com amor e a pureza da Palavra.", img: "https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?q=80&w=2069" },
    ];

    const enviarAoAltar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pedido.trim()) return;
        setEnviando(true);
        try {
            await addDoc(collection(db, "pedidos_oracao"), {
                conteudo: pedido,
                data: serverTimestamp()
            });
            setPedido("");
            alert("Pedido enviado com sucesso!");
        } catch (err) { alert("Erro ao enviar."); }
        finally { setEnviando(false); }
    };

    return (
        <div className="min-h-screen bg-background text-white font-body selection:bg-destaque/30">
            <Header />

            <main id="inicio">
                {/* 1. HERO */}
                <section className="relative h-screen flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073')] bg-cover bg-center opacity-30 scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

                    <div className="relative z-10 text-center space-y-8 px-6">
                        <h1 className="font-display text-7xl md:text-[10rem] lg:text-[12rem] leading-none tracking-normal">
                            FAMÍLIAS <span className="text-gradient">CHURCH</span>
                        </h1>
                        <p className="text-xl md:text-3xl text-destaque font-light italic tracking-widest">"Restaurar, Cuidar e Amar"</p>
                        <div className="flex flex-col md:flex-row gap-4 justify-center">
                            <a href="#cultos" className="bg-white text-primaria px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all flex items-center justify-center gap-2">
                                <Play className="fill-current" /> Venha nos Visitar
                            </a>
                            <a href="/doacoes" className="glass px-10 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                <DollarSign /> Semeie
                            </a>
                        </div>
                    </div>
                </section>

                {/* 2. PRÓXIMOS ENCONTROS */}
                <section id="eventos" className="py-24 bg-white/5">
                    <div className="container mx-auto px-6">
                        <div className="mb-12 border-l-4 border-destaque pl-6">
                            <h2 className="font-display text-6xl">Próximos Encontros</h2>
                            <p className="text-white/50">Fique por dentro do que está acontecendo na Famílias Church</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 glass h-[400px] rounded-[3rem] p-12 flex flex-col justify-end relative overflow-hidden group">
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=2070')] bg-cover opacity-20 group-hover:scale-110 transition-transform duration-700" />
                                <span className="relative z-10 bg-destaque text-primaria px-4 py-1 rounded-full text-xs font-bold w-fit mb-4">DESTAQUE</span>
                                <h3 className="relative z-10 text-4xl font-bold">Noite de Adoração Profunda</h3>
                            </div>
                            <div className="glass rounded-[3rem] p-8 flex flex-col gap-4">
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                    <p className="text-destaque text-sm font-bold">SÁBADO | 19:30</p>
                                    <p className="font-bold">Rede de Jovens</p>
                                </div>
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                    <p className="text-destaque text-sm font-bold">TERÇA | 20:00</p>
                                    <p className="font-bold">Tarde da Bênção</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. SOBRE */}
                <section id="sobre" className="py-24 container mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                    <div className="glass p-12 rounded-[3rem] space-y-6 relative">
                        <Quote className="text-destaque w-12 h-12 opacity-20 absolute top-8 left-8" />
                        <blockquote className="text-2xl leading-relaxed italic pt-8">
                            "Roguemos a vocês, irmãos, que admoestem os indisciplinados, consolem os desanimados, amparem os fracos e sejam pacientes com todos."
                        </blockquote>
                        <cite className="block text-destaque font-bold">— 1 Tessalonicenses 5.14</cite>
                    </div>
                    <div className="flex items-center gap-8">
                        <img
                            src="./Ap.jpg" // Fix: Em Vite, arquivos na pasta public são acessados pela raiz '/'
                            alt="Apóstolo"
                            className="w-48 h-48 rounded-[2rem] object-cover border-2 border-destaque p-2"
                        />
                        <div>
                            <h3 className="font-display text-5xl">José Roberto Couto</h3>
                            <p className="text-destaque tracking-[0.3em] uppercase text-sm">Apóstolo</p>
                        </div>
                    </div>
                </section>

                {/* 4. MINISTÉRIOS */}
                <section id="ministerios" className="py-24 bg-white/5">
                    <div className="container mx-auto px-6 text-center">
                        <h2 className="font-display text-7xl mb-8">Nossos <span className="text-destaque">Ministérios</span></h2>
                        <div className="flex flex-wrap justify-center gap-2 mb-12">
                            {ministerios.map((m, index) => (
                                <button
                                    key={m.titulo}
                                    onClick={() => setActiveTab(index)}
                                    className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === index ? 'bg-destaque text-primaria shadow-glow' : 'glass hover:bg-white/10'}`}
                                >
                                    {m.titulo}
                                </button>
                            ))}
                        </div>

                        <div className="glass rounded-[3rem] overflow-hidden grid md:grid-cols-2 min-h-[400px]">
                            <img src={ministerios[activeTab].img} className="h-full w-full object-cover" alt="Ministério" />
                            <div className="p-16 flex flex-col justify-center text-left space-y-6">
                                <h3 className="text-5xl font-bold">{ministerios[activeTab].titulo}</h3>
                                <div className="w-20 h-1 bg-destaque" />
                                <p className="text-xl text-white/70">{ministerios[activeTab].desc}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. CULTOS E LOCALIZAÇÃO */}
                <section id="cultos" className="py-24 container mx-auto px-6">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="font-display text-7xl">Encontre-nos</h2>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setActiveState('pr')}
                                className={`px-8 py-2 rounded-xl font-bold transition-all ${activeState === 'pr' ? 'bg-white text-primaria' : 'glass opacity-50'}`}
                            >
                                Paraná
                            </button>
                            <button
                                onClick={() => setActiveState('sc')}
                                className={`px-8 py-2 rounded-xl font-bold transition-all ${activeState === 'sc' ? 'bg-white text-primaria' : 'glass opacity-50'}`}
                            >
                                Santa Catarina
                            </button>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 items-start">
                        <div className="space-y-6">
                            <h3 className="font-display text-4xl text-destaque">
                                {activeState === 'pr' ? 'Fazenda Rio Grande' : 'Tijucas'}
                            </h3>
                            <div className="grid gap-4">
                                <div className="glass p-6 rounded-2xl flex justify-between items-center">
                                    <div>
                                        <p className="font-bold">DOMINGO</p>
                                        <p className="text-xs text-white/50">Culto da Família</p>
                                    </div>
                                    <span className="text-2xl font-display text-destaque">19:00</span>
                                </div>
                                <div className="glass p-6 rounded-2xl flex justify-between items-center">
                                    <div>
                                        <p className="font-bold">QUINTA-FEIRA</p>
                                        <p className="text-xs text-white/50">Ensino Bíblico</p>
                                    </div>
                                    <span className="text-2xl font-display text-destaque">20:00</span>
                                </div>
                            </div>
                        </div>
                        <div className="glass p-2 rounded-[2.5rem] overflow-hidden h-[400px]">
                            <iframe
                                src={activeState === 'pr'
                                    ? "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3598.677!2d-49.3039!3d-25.6156!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94dcf97424075133%3A0xb2490544f83e843c!2sR.%20Cassuarina%2C%20219%20-%20Eucaliptos%2C%20Fazenda%20Rio%20Grande%20-%20PR!5e0!3m2!1spt-BR!2sbr!4v1735011600000"
                                    : "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3545.228!2d-48.6401!3d-27.2434!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94d89617d7b5b5b5%3A0x1b5b5b5b5b5b5b5b!2sR.%20Ant%C3%B4nio%20Leal%2C%2061%20-%20Tijucas%20-%20SC!5e0!3m2!1spt-BR!2sbr!4v1735011600000"}
                                className="w-full h-full rounded-[2rem] grayscale invert opacity-40 hover:opacity-60 transition-opacity"
                                title="Localização Famílias Church"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </section>

                {/* 6. PEDIDO DE ORAÇÃO */}
                <section className="py-24 bg-white/5">
                    <form onSubmit={enviarAoAltar} className="container mx-auto px-6 max-w-3xl text-center space-y-8">
                        <h2 className="font-display text-7xl">Pedido de <span className="text-destaque">Oração</span></h2>
                        <p className="text-white/60 italic">"Compartilhe sua causa. Vamos orar por você."</p>
                        <textarea
                            value={pedido}
                            onChange={(e) => setPedido(e.target.value)}
                            className="w-full glass p-8 rounded-[2rem] outline-none focus:border-destaque/50 text-xl text-white"
                            placeholder="Escreva seu pedido aqui..."
                            rows={5}
                            required
                        />
                        <button
                            type="submit"
                            disabled={enviando}
                            className="w-full bg-destaque text-primaria py-6 rounded-full font-bold text-2xl hover:brightness-110 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            <Send size={24} /> {enviando ? "ENVIANDO..." : "ENVIAR PEDIDO AO ALTAR"}
                        </button>
                    </form>
                </section>

                {/* 7. TESTEMUNHOS */}
                <section className="py-24 container mx-auto px-6">
                    <div className="text-center mb-16">
                        <Star className="text-destaque mx-auto mb-4 animate-pulse" />
                        <h2 className="font-display text-7xl">Testemunhos</h2>
                        <p className="text-white/50 italic">O que Deus tem feito na nossa Família</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="glass p-10 rounded-[3rem] space-y-4">
                                <div className="flex gap-1 text-destaque"><Star size={14} /><Star size={14} /><Star size={14} /></div>
                                <p className="text-white/80 italic leading-relaxed">"Deus restaurou minha casa e hoje vivemos em paz e alegria..."</p>
                                <p className="font-bold text-destaque">— Membro da Família</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}