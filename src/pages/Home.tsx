import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import {
    collection, query, orderBy, onSnapshot, limit, addDoc,
    serverTimestamp, where, doc, updateDoc, increment, arrayUnion
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    Heart, MapPin, Quote, Send, Loader2, Calendar, Clock,
    Sparkles, ArrowRight, Share2, User, HeartHandshake, Check, 
    ExternalLink, CheckCircle, AlertCircle, X 
} from "lucide-react";
import { Link } from "react-router-dom";
import HighlightPopup from "../components/HighlightPopup"; 

// SERVIÇO DE NOTIFICAÇÃO (SININHO)
import { notifyRoles, GROUPS } from "../lib/notificationService";

import fotoApostolo from "../assets/Ap.webp";

export default function Home() {
    const [activeState, setActiveState] = useState('pr');
    const [user, setUser] = useState<any>(null);

    const [nome, setNome] = useState("");
    const [pedido, setPedido] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [oracoesAprovadas, setOracoesAprovadas] = useState<any[]>([]);

    const [eventos, setEventos] = useState<any[]>([]);
    const [hojePalavra, setHojePalavra] = useState<any>(null);
    
    // --- ESTADO DA NOTIFICAÇÃO VISUAL (TOAST) ---
    const [notification, setNotification] = useState<{
        show: boolean;
        message: string;
        type: 'success' | 'error';
    }>({ show: false, message: "", type: 'success' });

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
    };

    // Links de Mapas
    const linksMapasInternos: { [key: string]: string } = {
        pr: "https://maps.app.goo.gl/DA8DkCYrG65Bs1U5A",
        sc: "https://maps.app.goo.gl/aASBavLhgZ7SbS6e7"
    };

    const linksMapasEmbed: { [key: string]: string } = {
        pr: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14388.2788154374!2d-49.29341399999995!3d-25.635812!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94dcff4864409997%3A0xf448de238c4c8eee!2sR.%20Cassuarina%2C%20219%20-%20Eucaliptos%2C%20Fazenda%20Rio%20Grande%20-%20PR%2C%2083820-710%2C%20Brasil!5e0!3m2!1spt-BR!2sus!4v1767456317353!5m2!1spt-BR!2sus",
        sc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1829530.128245692!2d-50.33183777500007!3d-26.413760440466728!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94d8a96303c235b1%3A0x7d230727e24660fc!2sR.%20Ant%C3%B4nio%20Leal%2C%2061%20-%20Centro%2C%20Tijucas%20-%20SC%2C%2088200-000%2C%20Brasil!5e0!3m2!1spt-BR!2sus!4v1767456373957!5m2!1spt-BR!2sus"
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsub();
    }, []);

    // Carregar Eventos
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

    // Carregar Palavra do Dia
    useEffect(() => {
        const q = query(collection(db, "estudos_biblicos"), orderBy("data", "desc"), limit(1));
        const unsub = onSnapshot(q, (snap) => {
            if (!snap.empty) {
                setHojePalavra({ id: snap.docs[0].id, ...snap.docs[0].data() });
            }
        });
        return () => unsub();
    }, []);

    // Carregar Orações Aprovadas
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
                // ATUALIZADO: Toast em vez de alert
                showNotification("Link copiado para área de transferência!", "success");
            }
        } catch (err) { console.error(err); }
    };

    // --- ENVIAR PEDIDO AO ALTAR (ATUALIZADO) ---
    const enviarAoAltar = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validação com Toast
        if (!pedido.trim() || !nome.trim()) {
            showNotification("Por favor, preencha seu nome e o pedido.", "error");
            return;
        }

        setEnviando(true);
        try {
            // 1. Salvar no Banco
            await addDoc(collection(db, "pedidos_oracao"), {
                nome,
                conteudo: pedido,
                status: "pendente",
                notaPublica: "",
                intercessoes: 0,
                intercessores: [],
                data: serverTimestamp()
            });

            // 2. Notificar Pastores (Sininho) - Tenta, mas não trava se falhar
            try {
                await notifyRoles(
                    GROUPS.ORACAO,
                    "Novo Clamor no Altar",
                    `${nome} enviou um novo pedido de oração.`,
                    "devocional",
                    "/admin?tab=intercessao"
                );
            } catch (error) { console.error("Erro ao notificar admin", error); }

            setPedido("");
            setNome("");
            
            // 3. Feedback Visual Bonito (Substituindo o alert)
            showNotification("Seu clamor foi entregue no altar.", "success");

        } catch (err) {
            console.error(err);
            showNotification("Erro ao enviar. Tente novamente.", "error");
        } finally {
            setEnviando(false);
        }
    };

    const handleInterceder = async (id: string, listaIntercessores: string[]) => {
        if (!user) {
            // ATUALIZADO: Toast de erro
            showNotification("Faça login para interceder.", "error");
            return;
        }
        if (listaIntercessores && listaIntercessores.includes(user.uid)) {
            return; // Já intercedeu, não faz nada
        }
        try {
            const oracaoRef = doc(db, "pedidos_oracao", id);
            await updateDoc(oracaoRef, {
                intercessoes: increment(1),
                intercessores: arrayUnion(user.uid)
            });
            // ATUALIZADO: Toast de sucesso
            showNotification("Sua intercessão foi registrada!", "success");
        } catch (error) {
            console.error("Erro ao interceder", error);
            showNotification("Não foi possível registrar a intercessão.", "error");
        }
    };

    return (
        <div className="min-h-screen bg-blue-50/30 text-slate-900 font-body selection:bg-blue-500/10 relative">
            
            {/* --- COMPONENTE POPUP DE DESTAQUE --- */}
            <HighlightPopup />

            {/* --- COMPONENTE DE NOTIFICAÇÃO (TOAST BONITO) --- */}
            <div 
                className={`fixed top-24 right-5 z-[9999] transform transition-all duration-500 ease-out ${
                notification.show ? "translate-x-0 opacity-100" : "translate-x-20 opacity-0 pointer-events-none"
                }`}
            >
                <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md ${
                notification.type === 'error' 
                    ? "bg-white/95 border-red-100 text-red-600" 
                    : "bg-white/95 border-emerald-100 text-emerald-600"
                }`}>
                    {notification.type === 'error' ? <AlertCircle size={24} /> : <CheckCircle size={24} />}
                    <div className="flex flex-col">
                        <span className="font-black text-[10px] uppercase tracking-widest opacity-60">
                        {notification.type === 'error' ? 'Atenção' : 'Sucesso'}
                        </span>
                        <span className="text-slate-700 text-xs font-bold mt-0.5">{notification.message}</span>
                    </div>
                    <button 
                        onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                        className="ml-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            <main id="inicio">
                {/* HERO SECTION */}
                <section className="relative h-screen flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073')] bg-cover opacity-5 grayscale" />
                    <div className="relative z-10 text-center space-y-8 px-6">
                        <h1 className="text-slate-900 font-display text-7xl md:text-[10rem] leading-none uppercase tracking-tighter">
                            FAMÍLIAS <span className="text-blue-500">CHURCH</span>
                        </h1>
                        <p className="text-xl md:text-3xl text-blue-900/60 font-light tracking-widest italic">"Restaurar, Cuidar e Amar"</p>
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
                            <h3 className="font-display text-5xl leading-none uppercase text-blue-900">Ap. José Roberto Couto</h3>
                            <p className="text-blue-500 tracking-widest uppercase text-[10px] mt-2 font-black">Fundador e Presidente</p>
                        </div>
                    </div>
                </section>

                {/* SEÇÃO DE CULTOS */}
                <section id="cultos" className="py-24 bg-blue-50/50">
                    <div className="container mx-auto px-6 space-y-12">
                        <div className="text-center space-y-6">
                            <h2 className="font-display text-5xl md:text-7xl uppercase tracking-tighter text-blue-900 text-center">Nossas <span className="text-blue-500">igrejas</span></h2>
                            <div className="flex justify-center gap-3">
                                {['pr', 'sc'].map((state) => (
                                    <button
                                        key={state}
                                        onClick={() => setActiveState(state)}
                                        className={`px-6 md:px-10 py-3 rounded-full font-black uppercase text-[9px] md:text-[10px] tracking-[0.2em] transition-all ${activeState === state ? 'bg-blue-600 text-white shadow-xl scale-105' : 'bg-white text-blue-400 border border-blue-100'
                                            }`}
                                    >
                                        {state === 'pr' ? 'Paraná' : 'Santa Catarina'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-10 items-start">
                            <div className="space-y-6">
                                <h3 className="font-display text-4xl md:text-5xl text-blue-600 uppercase tracking-tighter mb-4 text-center md:text-left">
                                    {activeState === 'pr' ? 'Fazenda Rio Grande' : 'Tijucas'}
                                </h3>
                                
                                <div className="grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-4">
                                    <div className="bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] flex flex-col md:flex-row justify-between items-center border border-blue-50 shadow-sm group hover:border-blue-400 transition-all hover:shadow-xl text-center md:text-left">
                                        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6">
                                            <div className="bg-blue-50 p-3 md:p-4 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <Calendar size={20} className="md:w-6 md:h-6" />
                                            </div>
                                            <div>
                                                <p className="font-black text-blue-400 text-[8px] md:text-[10px] tracking-widest uppercase italic">Domingo</p>
                                                <p className="text-xs md:text-xl font-bold text-blue-900 uppercase leading-tight">Culto da Família</p>
                                            </div>
                                        </div>
                                        <span className="text-2xl md:text-4xl font-display text-blue-900 opacity-60 md:opacity-30 group-hover:opacity-100 mt-2 md:mt-0">19:00</span>
                                    </div>
                                    <div className="bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] flex flex-col md:flex-row justify-between items-center border border-blue-50 shadow-sm group hover:border-blue-400 transition-all hover:shadow-xl text-center md:text-left">
                                        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6">
                                            <div className="bg-blue-50 p-3 md:p-4 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <Clock size={20} className="md:w-6 md:h-6" />
                                            </div>
                                            <div>
                                                <p className="font-black text-blue-400 text-[8px] md:text-[10px] tracking-widest uppercase italic">Quinta-Feira</p>
                                                <p className="text-xs md:text-xl font-bold text-blue-900 uppercase leading-tight">Ensino Bíblico</p>
                                            </div>
                                        </div>
                                        <span className="text-2xl md:text-4xl font-display text-blue-900 opacity-60 md:opacity-30 group-hover:opacity-100 mt-2 md:mt-0">20:00</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <a 
                                    href={linksMapasInternos[activeState]} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block relative bg-white p-3 rounded-[3rem] md:rounded-[4rem] overflow-hidden h-[300px] md:h-[450px] border border-blue-100 shadow-2xl group"
                                >
                                    <iframe
                                        src={linksMapasEmbed[activeState]}
                                        title="Localização Famílias Church"
                                        className="w-full h-full rounded-[2rem] md:rounded-[3rem] grayscale brightness-110 opacity-80 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700 pointer-events-none md:pointer-events-auto"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-blue-900/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity md:hidden">
                                        <div className="bg-white/90 px-6 py-3 rounded-full flex items-center gap-2 shadow-xl">
                                            <ExternalLink size={18} className="text-blue-600" />
                                            <span className="font-bold text-blue-900 text-xs uppercase">Ver no Maps</span>
                                        </div>
                                    </div>
                                </a>
                                <a 
                                    href={linksMapasInternos[activeState]}
                                    target="_blank"
                                    className="flex md:hidden items-center justify-center gap-2 w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                >
                                    <MapPin size={16} /> Como Chegar (Google Maps)
                                </a>
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

                                                <button
                                                    onClick={() => handleInterceder(oracao.id, oracao.intercessores)}
                                                    disabled={!user || jaIntercedeu}
                                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide transition-all ${!user
                                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-70' 
                                                            : jaIntercedeu
                                                                ? 'bg-blue-600 text-white cursor-default' 
                                                                : 'bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white cursor-pointer' 
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

                        {/* FORMULÁRIO DE PEDIDO - CORREÇÃO DO AUTOCOMPLETE AQUI */}
                        <form onSubmit={enviarAoAltar} className="text-center space-y-12">
                            <div className="space-y-4">
                                <h2 className="font-display text-6xl md:text-8xl uppercase tracking-tighter text-blue-400 leading-none text-center">
                                    Faça um pedido de <span className="font-display text-blue-900">Oração</span> <br className="hidden md:block" /> você também
                                </h2>
                                <p className="text-blue-400 uppercase tracking-[0.5em] text-[10px] font-black">Sua causa levada à presença do Pai</p>
                            </div>

                            <div className="space-y-6 bg-white p-2 rounded-[4.5rem] shadow-2xl border border-blue-100">
                                <div className="relative">
                                    <div className="absolute top-6 left-8 text-blue-200">
                                        <User size={24} />
                                    </div>
                                    <input
                                        name="nome_oracao" // Adicionado
                                        id="nome_oracao"   // Adicionado
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        className="w-full bg-transparent p-6 pl-20 rounded-[4rem] outline-none text-xl font-bold uppercase text-blue-600 placeholder:text-blue-600 placeholder:font-normal"
                                        placeholder="nome completo"
                                        required
                                        autoComplete="name" // Ajuda o navegador
                                    />
                                </div>

                                <div className="h-[1px] w-full bg-blue-50 mx-auto max-w-[90%]"></div>

                                <textarea
                                    name="pedido_oracao" // Adicionado
                                    id="pedido_oracao"   // Adicionado
                                    value={pedido}
                                    onChange={(e) => setPedido(e.target.value)}
                                    className="w-full bg-transparent p-8 rounded-[4rem] outline-none text-xl text-blue-900 min-h-[250px] placeholder:text-blue-300 resize-none text-center italic"
                                    placeholder="Descreva aqui o seu motivo de clamor em detalhes (isso ficará restrito aos pastores)..."
                                    required
                                    autoComplete="off"
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