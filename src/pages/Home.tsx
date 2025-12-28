import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import {
    collection, query, orderBy, onSnapshot, limit, addDoc,
    serverTimestamp, where, doc, updateDoc, increment, arrayUnion
} from "firebase/firestore"; // Adicionado arrayUnion
import { onAuthStateChanged } from "firebase/auth";
import {
    Heart, MapPin, Quote, Send, Loader2, Calendar, Clock,
    Sparkles, ArrowRight, Share2, User, HeartHandshake, Check
} from "lucide-react"; // Adicionado ícone Check
import { Link } from "react-router-dom";

import fotoApostolo from "../assets/Ap.jpg";

export default function Home() {
    const [activeTab, setActiveTab] = useState(0);
    const [activeState, setActiveState] = useState('pr');
    const [user, setUser] = useState<any>(null);

    const [nome, setNome] = useState("");
    const [pedido, setPedido] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [oracoesAprovadas, setOracoesAprovadas] = useState<any[]>([]);

    const [eventos, setEventos] = useState<any[]>([]);
    const [hojePalavra, setHojePalavra] = useState<any>(null);

    const linksMapas: { [key: string]: string } = {
        pr: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3596.5298154564883!2d-49.3039785!3d-25.6537385!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94dcf97f536c4b2b%3A0x633390c58e0a84e2!2sFazenda%20Rio%20Grande%2C%20PR!5e0!3m2!1spt-BR!2sbr!4v1703615000000!5m2!1spt-BR!2sbr",
        sc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d28345.543419363013!2d-48.6436665!3d-27.2355555!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94d8ba9c99999999%3A0x999999999999999!2sTijucas%2C%20SC!5e0!3m2!1spt-BR!2sbr!4v1703615000000!5m2!1spt-BR!2sbr"
    };

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
        const unsub = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsub();
    }, []);

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

    useEffect(() => {
        const q = query(collection(db, "estudos_biblicos"), orderBy("data", "desc"), limit(1));
        const unsub = onSnapshot(q, (snap) => {
            if (!snap.empty) {
                setHojePalavra({ id: snap.docs[0].id, ...snap.docs[0].data() });
            }
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        const q = query(
            collection(db, "pedidos_oracao"),
            where("status", "==", "aprovado")
        );
        const unsub = onSnapshot(q, (snap) => {
            setOracoesAprovadas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    const handleShare = async () => {
        if (!hojePalavra) return;
        const shareData = {
            title: `Palavra: ${hojePalavra.titulo}`,
            text: `Confira essa devocional: "${hojePalavra.titulo}"`,
            url: window.location.origin + '/devocionais',
        };
        try {
            if (navigator.share) { await navigator.share(shareData); }
            else {
                await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
                alert("Link copiado!");
            }
        } catch (err) { console.error(err); }
    };

    const enviarAoAltar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pedido.trim() || !nome.trim()) return;
        setEnviando(true);
        try {
            await addDoc(collection(db, "pedidos_oracao"), {
                nome,
                conteudo: pedido,
                status: "pendente",
                notaPublica: "",
                intercessoes: 0,
                intercessores: [], // Inicializa a lista de quem orou
                data: serverTimestamp()
            });
            setPedido("");
            setNome("");
            alert("Pedido enviado ao altar!");
        } catch (err) { alert("Erro ao enviar."); }
        finally { setEnviando(false); }
    };

    // Função Blindada para Intercessão Única
    const handleInterceder = async (id: string, listaIntercessores: string[]) => {
        if (!user) {
            alert("Faça login para registrar sua intercessão.");
            return;
        }

        // Verifica se o usuário já está na lista
        if (listaIntercessores && listaIntercessores.includes(user.uid)) {
            return; // Bloqueia a ação se já intercedeu
        }

        try {
            const oracaoRef = doc(db, "pedidos_oracao", id);
            await updateDoc(oracaoRef, {
                intercessoes: increment(1),
                intercessores: arrayUnion(user.uid) // Adiciona o ID do usuário na lista sem duplicar
            });
        } catch (error) {
            console.error("Erro ao interceder", error);
        }
    };

    return (
        <div className="min-h-screen bg-blue-50/30 text-slate-900 font-body selection:bg-blue-500/10">
            <main id="inicio">
                {/* HERO SECTION */}
                <section className="relative h-screen flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073')] bg-cover opacity-5 grayscale" />
                    <div className="relative z-10 text-center space-y-8 px-6">
                        <h1 className="text-slate-900 font-display text-7xl md:text-[10rem] leading-none uppercase tracking-tighter">
                            FAMÍLIAS <span className="text-blue-500">CHURCH</span>
                        </h1>
                        <p className="text-xl md:text-3xl text-blue-900/60 font-light italic tracking-widest italic">"Restaurar, Cuidar e Amar"</p>
                        <div className="flex flex-col md:flex-row gap-4 justify-center pt-4">
                            <a href="#cultos" className="bg-blue-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20">
                                <MapPin size={20} /> Venha nos Visitar
                            </a>
                            <Link to="/doacoes" className="bg-white text-blue-900 border border-blue-100 px-10 py-4 rounded-full font-bold text-lg hover:bg-white/80 transition-all flex items-center justify-center gap-2">
                                <Heart size={20} className="text-blue-500" /> Semeie
                            </Link>
                        </div>
                    </div>
                </section>

                {/* --- SEÇÃO PALAVRA DE HOJE --- */}
                {hojePalavra && (
                    <section className="py-24 container mx-auto px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="bg-white rounded-[4rem] p-8 md:p-20 text-slate-900 flex flex-col lg:flex-row gap-16 items-center overflow-hidden relative shadow-2xl border border-blue-100">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-[100px] -mr-48 -mt-48" />
                            <div className="flex-1 space-y-8 relative z-10 text-center lg:text-left">
                                <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                                    <Sparkles size={14} className="text-blue-600" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-700">Mensagem do Dia</span>
                                </div>
                                <h2 className="font-display text-5xl md:text-7xl leading-[0.9] uppercase tracking-tighter text-blue-900">{hojePalavra.titulo}</h2>
                                <p className="text-slate-600 italic text-lg md:text-xl line-clamp-3 leading-relaxed max-w-2xl">"{hojePalavra.conteudo}"</p>
                                <div className="pt-4 flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start">
                                    <Link to="/devocionais" className="group bg-blue-600 text-white px-10 py-5 rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-3 shadow-xl shadow-blue-600/30">
                                        Ler Mensagem Completa <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                    <button onClick={handleShare} className="flex items-center gap-2 text-blue-400 hover:text-blue-600 transition-colors uppercase font-black text-[10px] tracking-widest">
                                        <Share2 size={16} /> Compartilhar
                                    </button>
                                </div>
                            </div>
                            <div className="w-full lg:w-[450px] h-[550px] rounded-[3.5rem] overflow-hidden shadow-2xl relative group p-3 bg-blue-50 border border-blue-100">
                                <img src={hojePalavra.capa} className="w-full h-full object-cover rounded-[2.8rem] transition-transform duration-1000 group-hover:scale-110" alt="Capa Devocional" />
                            </div>
                        </div>
                    </section>
                )}

                {/* PRÓXIMOS EVENTOS */}
                <section id="eventos" className="py-24 bg-white border-y border-blue-50">
                    <div className="container mx-auto px-6">
                        <div className="mb-12 border-l-4 border-blue-500 pl-6">
                            <h2 className="font-display text-6xl uppercase tracking-tighter text-blue-900">Próximos Eventos</h2>
                            <p className="text-blue-400 uppercase tracking-widest text-[10px] font-black mt-2">Agenda em Tempo Real</p>
                        </div>

                        {eventos.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 bg-blue-50/50 h-[400px] rounded-[3.5rem] p-12 flex flex-col justify-end relative overflow-hidden group border border-blue-100 shadow-sm transition-all hover:shadow-lg">
                                    <img src={eventos[0].capa} className="absolute inset-0 w-full h-full object-cover opacity-10 grayscale group-hover:opacity-20 transition-opacity duration-500" alt="Evento" />
                                    <span className="relative z-10 bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black w-fit mb-4 uppercase tracking-widest shadow-lg">{eventos[0].tipo || "Especial"}</span>
                                    <h3 className="relative z-10 text-5xl font-black uppercase tracking-tighter leading-none text-blue-900">{eventos[0].titulo}</h3>
                                    <p className="relative z-10 text-slate-500 mt-4 line-clamp-2 italic">{eventos[0].descricao}</p>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {eventos.slice(1).map((ev) => (
                                        <div key={ev.id} className="bg-white p-8 rounded-[2.5rem] border border-blue-50 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all group">
                                            <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <Calendar size={12} /> {ev.dataReal?.toDate().toLocaleDateString('pt-BR')}
                                            </p>
                                            <p className="font-bold uppercase text-lg text-blue-900 group-hover:text-blue-600 transition-colors">{ev.titulo}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="py-20 text-center border-2 border-dashed border-blue-100 rounded-[3rem] bg-blue-50/20">
                                <p className="uppercase tracking-widest font-black text-xs text-blue-300">Nenhum evento agendado para os próximos dias</p>
                            </div>
                        )}

                        <div className="flex justify-end mt-10">
                            <a
                                href="/eventos"
                                className="bg-blue-900 text-white px-8 py-4 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-700 hover:scale-105 transition-all shadow-xl shadow-blue-900/20 group"
                            >
                                Saiba Mais <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </a>
                        </div>
                    </div>
                </section>

                {/* SOBRE O APÓSTOLO */}
                <section id="sobre" className="py-24 container mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                    <div className="bg-white p-12 rounded-[3.5rem] border border-blue-100 relative shadow-xl">
                        <Quote className="text-blue-500 w-12 h-12 opacity-10 absolute top-8 left-8" />
                        <blockquote className="text-2xl leading-relaxed italic pt-8 text-slate-700">"Roguemos a vocês, irmãos, que admoestem os indisciplinados, consolem os desanimados, amparem os fracos e sejam pacientes com todos."</blockquote>
                        <cite className="block text-blue-600 font-black uppercase tracking-widest text-[10px] mt-6">— 1 Tessalonicenses 5.14</cite>
                    </div>
                    <div className="flex items-center gap-8 pl-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500 rounded-[2.5rem] rotate-6 scale-95 opacity-20" />
                            <img src={fotoApostolo} alt="Apóstolo" className="relative w-48 h-48 rounded-[2.5rem] object-cover border-4 border-white shadow-2xl" />
                        </div>
                        <div>
                            <h3 className="font-display text-5xl leading-none text-blue-900">José Roberto Couto</h3>
                            <p className="text-blue-500 tracking-widest uppercase text-[10px] mt-2 font-black">Apóstolo e Fundador</p>
                        </div>
                    </div>
                </section>

                {/* SEÇÃO DE CULTOS E MINISTÉRIOS */}
                {/* ... (Conteúdo de Cultos e Ministérios mantido igual ao anterior) ... */}
                <section id="cultos" className="py-24 bg-blue-50/50">
                    <div className="container mx-auto px-6 space-y-12">
                        <div className="text-center space-y-6">
                            <h2 className="font-display text-7xl uppercase tracking-tighter text-blue-900">Nossas Sedes</h2>
                            <div className="flex justify-center gap-3">
                                {['pr', 'sc'].map((state) => (
                                    <button
                                        key={state}
                                        onClick={() => setActiveState(state)}
                                        className={`px-10 py-3 rounded-full font-black uppercase text-[10px] tracking-[0.2em] transition-all ${activeState === state ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 scale-105' : 'bg-white text-blue-400 hover:bg-blue-50 border border-blue-100'
                                            }`}
                                    >
                                        {state === 'pr' ? 'Paraná' : 'Santa Catarina'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <h3 className="font-display text-5xl text-blue-600 uppercase tracking-tighter mb-8">
                                    {activeState === 'pr' ? 'Fazenda Rio Grande' : 'Tijucas'}
                                </h3>
                                <div className="grid gap-4">
                                    <div className="bg-white p-8 rounded-[3rem] flex justify-between items-center border border-blue-50 shadow-sm group hover:border-blue-400 transition-all hover:shadow-xl">
                                        <div className="flex items-center gap-6">
                                            <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <Calendar size={24} />
                                            </div>
                                            <div>
                                                <p className="font-black text-blue-400 text-[10px] tracking-widest uppercase italic mb-1">Domingo</p>
                                                <p className="text-xl font-bold text-blue-900 uppercase">Culto da Família</p>
                                            </div>
                                        </div>
                                        <span className="text-4xl font-display text-blue-900 opacity-30 group-hover:opacity-100 transition-opacity">19:00</span>
                                    </div>
                                    <div className="bg-white p-8 rounded-[3rem] flex justify-between items-center border border-blue-50 shadow-sm group hover:border-blue-400 transition-all hover:shadow-xl">
                                        <div className="flex items-center gap-6">
                                            <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <Clock size={24} />
                                            </div>
                                            <div>
                                                <p className="font-black text-blue-400 text-[10px] tracking-widest uppercase italic mb-1">Quinta-Feira</p>
                                                <p className="text-xl font-bold text-blue-900 uppercase">Ensino Bíblico</p>
                                            </div>
                                        </div>
                                        <span className="text-4xl font-display text-blue-900 opacity-30 group-hover:opacity-100 transition-opacity">20:00</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-[4rem] overflow-hidden h-[450px] border border-blue-100 shadow-2xl">
                                <iframe
                                    src={linksMapas[activeState]}
                                    title="Localização Famílias Church"
                                    className="w-full h-full rounded-[3rem] grayscale brightness-110 opacity-80 hover:opacity-100 hover:grayscale-0 transition-all duration-700"
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <section id="ministerios" className="py-24 bg-white">
                    <div className="container mx-auto px-6 text-center">
                        <h2 className="font-display text-7xl mb-12 uppercase tracking-tighter text-blue-900">Minis<span className="text-blue-500">térios</span></h2>
                        <div className="flex flex-wrap justify-center gap-3 mb-16">
                            {ministerios.map((m, index) => (
                                <button
                                    key={m.titulo}
                                    onClick={() => setActiveTab(index)}
                                    className={`px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === index ? 'bg-blue-600 text-white shadow-xl scale-110' : 'bg-blue-50 text-blue-400 hover:bg-blue-100 border border-blue-100/50'}`}
                                >
                                    {m.titulo}
                                </button>
                            ))}
                        </div>
                        <div className="bg-white rounded-[4rem] overflow-hidden grid md:grid-cols-2 min-h-[600px] border border-blue-100 shadow-2xl">
                            <div className="relative overflow-hidden">
                                <img src={ministerios[activeTab].img} className="h-full w-full object-cover transition-transform duration-1000 hover:scale-110" alt="Ministério" />
                                <div className="absolute inset-0 bg-blue-900/10" />
                            </div>
                            <div className="p-16 flex flex-col justify-center text-left space-y-8 bg-blue-50/20">
                                <h3 className="text-6xl font-black uppercase tracking-tighter text-blue-900 leading-none">{ministerios[activeTab].titulo}</h3>
                                <div className="w-24 h-2 bg-blue-500 rounded-full" />
                                <p className="text-xl text-slate-600 leading-relaxed font-light italic">{ministerios[activeTab].desc}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* PEDIDOS DE ORAÇÃO */}
                <section className="py-32 bg-blue-50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

                    <div className="container mx-auto px-6 max-w-4xl relative z-10 space-y-16">

                        {/* LISTA DE ORAÇÕES APROVADAS */}
                        {oracoesAprovadas.length > 0 && (
                            <div className="bg-white p-8 rounded-[3rem] border border-blue-100 shadow-xl text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex items-center justify-center gap-2 text-blue-400 uppercase tracking-widest text-[10px] font-black">
                                    <Sparkles size={14} /> Clamor da Igreja
                                </div>
                                <h3 className="font-display text-3xl text-blue-900 uppercase italic tracking-tight">Em Intercessão Constante</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {oracoesAprovadas.map((oracao) => {
                                        // Verifica se o usuário atual já intercedeu neste pedido
                                        const jaIntercedeu = user && oracao.intercessores && oracao.intercessores.includes(user.uid);

                                        return (
                                            <div key={oracao.id} className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded-full text-blue-300">
                                                        <User size={16} />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold text-blue-900 uppercase">
                                                            {oracao.nome}
                                                        </p>
                                                        <p className="text-xs text-slate-500 italic line-clamp-1">
                                                            {oracao.notaPublica || "Pedido de oração em andamento..."}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* BOTÃO DE INTERCESSÃO (Interação Única) */}
                                                <button
                                                    onClick={() => handleInterceder(oracao.id, oracao.intercessores)}
                                                    disabled={!user || jaIntercedeu}
                                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide transition-all ${!user
                                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-70' // Deslogado
                                                            : jaIntercedeu
                                                                ? 'bg-blue-600 text-white cursor-default' // Já clicou
                                                                : 'bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white cursor-pointer' // Pode clicar
                                                        }`}
                                                    title={!user ? "Faça login para interceder" : jaIntercedeu ? "Você já intercedeu" : "Clique para interceder"}
                                                >
                                                    {jaIntercedeu ? <Check size={14} /> : <HeartHandshake size={14} />}
                                                    <span>{oracao.intercessoes || 0}</span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* FORMULÁRIO DE PEDIDO */}
                        <form onSubmit={enviarAoAltar} className="text-center space-y-12">
                            <div className="space-y-4">
                                <h2 className="font-display text-6xl md:text-8xl uppercase tracking-tighter text-blue-900 leading-none">
                                    Faça um pedido de <span className="opacity-20">Oração</span> <br /> você também
                                </h2>
                                <p className="text-blue-400 uppercase tracking-[0.5em] text-[10px] font-black">Sua causa levada à presença do Pai</p>
                            </div>

                            <div className="space-y-6 bg-white p-2 rounded-[4.5rem] shadow-2xl border border-blue-100">
                                <div className="relative">
                                    <div className="absolute top-6 left-8 text-blue-200">
                                        <User size={24} />
                                    </div>
                                    <input
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        className="w-full bg-transparent p-6 pl-20 rounded-[4rem] outline-none text-xl font-bold text-blue-900 placeholder:text-blue-600 placeholder:font-normal"
                                        placeholder="Seu nome ou iniciais..."
                                        required
                                    />
                                </div>

                                <div className="h-[1px] w-full bg-blue-50 mx-auto max-w-[90%]"></div>

                                <textarea
                                    value={pedido}
                                    onChange={(e) => setPedido(e.target.value)}
                                    className="w-full bg-transparent p-8 rounded-[4rem] outline-none text-xl text-blue-900 min-h-[250px] placeholder:text-blue-300 resize-none text-center italic"
                                    placeholder="Descreva aqui o seu motivo de clamor em detalhes (isso ficará restrito aos pastores)..."
                                    required
                                />

                                <div className="flex justify-center w-full">
                                    <button
                                        type="submit"
                                        disabled={enviando}
                                        className="bg-blue-600 text-white px-12 py-6 rounded-[3.5rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-700 transition-all flex items-center justify-center gap-4 disabled:opacity-50 shadow-xl shadow-blue-600/30 hover:scale-[1.05]"
                                    >
                                        {enviando ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                        {enviando ? "ENVIANDO..." : "ENVIAR PEDIDO"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </section>
            </main>
        </div>
    );
}