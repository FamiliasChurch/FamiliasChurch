import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Calendar, MapPin, Sparkles, X, History, Tags, ChevronDown, ChevronUp } from "lucide-react";

export default function Eventos() {
    const [eventosFuturos, setEventosFuturos] = useState<any[]>([]);
    const [eventosAntigos, setEventosAntigos] = useState<any[]>([]);
    const [filtroAtivo, setFiltroAtivo] = useState("Todos");
    const [subFiltroAtivo, setSubFiltroAtivo] = useState("Todos");
    const [loading, setLoading] = useState(true);
    const [eventoSelecionado, setEventoSelecionado] = useState<any>(null);
    
    // Estado para controlar a abertura do menu mobile
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const categorias = ["Todos", "Cultos", "Encontros com Deus", "Conferências", "Encontro de Casais"];
    const subCategorias = ["Todos", "Déboras", "Jovens", "Teens", "Kids"];

    useEffect(() => {
        const q = query(collection(db, "agenda_eventos"), orderBy("dataReal", "asc"));
        const unsub = onSnapshot(q, (snap) => {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            setEventosFuturos(lista.filter((ev: any) => ev.dataReal?.toDate() >= hoje));
            setEventosAntigos(lista.filter((ev: any) => ev.dataReal?.toDate() < hoje).reverse());
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const filtrar = (lista: any[]) => lista.filter(ev => {
        const matchPrincipal = filtroAtivo === "Todos" || ev.tipo === filtroAtivo;
        const matchSub = filtroAtivo === "Conferências" 
            ? (subFiltroAtivo === "Todos" || ev.ministerio === subFiltroAtivo)
            : true;
        return matchPrincipal && matchSub;
    });

    const futurosFiltrados = filtrar(eventosFuturos);
    const passadosFiltrados = filtrar(eventosAntigos);

    const encontroFixo = filtroAtivo === "Todos" 
        ? futurosFiltrados.find(ev => ev.tipo === "Encontros com Deus") 
        : null;

    const proximoDestaque = futurosFiltrados.find(ev => ev.id !== encontroFixo?.id);
    const gridFuturos = futurosFiltrados.filter(ev => ev.id !== encontroFixo?.id && ev.id !== proximoDestaque?.id);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-blue-50/30"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    const EventCard = ({ ev, isSmall = false }: { ev: any, isSmall?: boolean }) => (
        <div className="bg-white rounded-[2.5rem] p-4 border border-blue-50 hover:shadow-2xl transition-all duration-500 group flex flex-col h-full italic cursor-pointer" onClick={() => setEventoSelecionado(ev)}>
            <div className={`${isSmall ? 'h-40' : 'h-48'} rounded-[2rem] overflow-hidden relative mb-4`}>
                <img src={ev.capa} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={ev.titulo} />
                {ev.tipo !== "Cultos" && (
                    <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase shadow-sm italic">
                        {ev.tipo}
                    </div>
                )}
            </div>
            <div className="px-2 pb-2 flex-1 flex flex-col">
                <span className="text-[9px] font-bold text-blue-400 uppercase flex items-center gap-1 mb-2 italic">
                    <Calendar size={10} /> {ev.dataReal?.toDate().toLocaleDateString('pt-BR')}
                </span>
                <h4 className={`font-bold text-blue-900 uppercase tracking-tighter leading-tight mb-4 ${isSmall ? 'text-sm line-clamp-2' : 'text-lg'}`}>{ev.titulo}</h4>
                <button className="mt-auto w-full py-3 rounded-xl border border-blue-100 text-[9px] font-black uppercase text-blue-600 hover:bg-blue-600 hover:text-white transition-all">
                    Ver Detalhes
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-blue-50/30 pt-32 md:pt-40 px-6 font-body relative">
            <div className="container mx-auto max-w-7xl space-y-16">
                
                {/* CABEÇALHO E FILTROS */}
                <div className="text-center space-y-8 max-w-4xl mx-auto">
          <h1 className="font-display text-8xl md:text-9xl uppercase tracking-tighter leading-none text-blue-900">Nossa <span className="text-blue-500">Agenda</span></h1>
                    
                    {/* FILTROS - MOBILE (DROPDOWN) */}
                    <div className="md:hidden relative max-w-xs mx-auto z-30">
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`w-full flex items-center justify-between bg-white border-2 ${isDropdownOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-blue-100'} text-blue-900 px-6 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-md transition-all active:scale-95`}
                        >
                            <span className="flex-1 text-center">{filtroAtivo}</span>
                            {isDropdownOpen ? <ChevronUp size={18} className="text-blue-500" /> : <ChevronDown size={18} className="text-blue-500" />}
                        </button>

                        {isDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                                <div className="absolute top-full mt-1 left-0 w-full bg-white rounded-xl border border-blue-50 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 z-20">
                                    {categorias.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => {
                                                setFiltroAtivo(cat);
                                                setSubFiltroAtivo("Todos");
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full py-3 text-[10px] font-bold uppercase tracking-widest transition-colors border-b border-slate-50 last:border-0 ${
                                                filtroAtivo === cat 
                                                ? 'bg-blue-50 text-blue-600' 
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-blue-500'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* FILTROS - DESKTOP */}
                    <div className="hidden md:flex flex-wrap justify-center gap-3">
                        {categorias.map(cat => (
                            <button key={cat} onClick={() => { setFiltroAtivo(cat); setSubFiltroAtivo("Todos"); }}
                                className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${filtroAtivo === cat ? 'bg-blue-600 text-white border-blue-600 shadow-xl scale-105' : 'bg-white text-blue-400 border-blue-100 hover:bg-blue-50'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>

                    {filtroAtivo === "Conferências" && (
                        <div className="animate-in slide-in-from-top-4 duration-500 bg-white/60 backdrop-blur-sm p-6 rounded-[2.5rem] border border-blue-100 space-y-4 shadow-sm">
                            <div className="flex items-center justify-center gap-2 text-blue-900/40 italic">
                                <Tags size={14} />
                                <span className="text-[9px] font-black uppercase tracking-widest italic">Filtrar por Ministério</span>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2">
                                {subCategorias.map(sub => (
                                    <button key={sub} onClick={() => setSubFiltroAtivo(sub)}
                                        className={`px-5 py-2 rounded-xl text-[9px] font-bold uppercase transition-all ${subFiltroAtivo === sub ? 'bg-blue-900 text-white shadow-md' : 'bg-white/80 text-blue-400 border border-blue-50 hover:bg-white'}`}>
                                        {sub}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* SEÇÃO DE DESTAQUES */}
                {futurosFiltrados.length > 0 && (
                    <div className={`grid gap-8 ${encontroFixo ? 'lg:grid-cols-3' : 'grid-cols-1'}`}>
                        <div className={encontroFixo ? 'lg:col-span-2' : 'w-full'}>
                            {proximoDestaque && (
                                <div className="bg-white rounded-[4rem] overflow-hidden border border-blue-100 shadow-2xl flex flex-col md:flex-row h-full relative group min-h-[450px]">
                                    <div className="md:w-1/2 h-64 md:h-auto relative overflow-hidden">
                                        <img src={proximoDestaque.capa} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Destaque" />
                                        <div className="absolute top-6 left-6 bg-blue-600 text-white px-5 py-2 rounded-2xl flex items-center gap-2 shadow-xl animate-pulse">
                                            <Sparkles size={14} />
                                            <span className="text-[10px] font-black uppercase">Próximo Evento</span>
                                        </div>
                                    </div>
                                    <div className="md:w-1/2 p-10 lg:p-14 flex flex-col justify-center space-y-6 italic text-left">
                                        <div>
                                            <span className="text-blue-500 font-black text-[10px] uppercase tracking-widest italic">{proximoDestaque.tipo}</span>
                                            <h2 className="text-4xl lg:text-5xl font-display font-bold text-blue-900 uppercase leading-[0.9] tracking-tighter text-left">{proximoDestaque.titulo}</h2>
                                        </div>
                                        <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed">"{proximoDestaque.descricao}"</p>
                                        <button onClick={() => setEventoSelecionado(proximoDestaque)} className="w-fit px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 italic">Ver Mensagem Completa</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {encontroFixo && (
                            <div className="bg-blue-600 rounded-[3.5rem] p-10 text-white flex flex-col justify-between relative overflow-hidden shadow-2xl border-4 border-white/20 group h-full italic animate-in slide-in-from-right duration-700">
                                <img src={encontroFixo.capa} className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-110 transition-transform duration-1000" alt="Encontro" />
                                <div className="relative z-10 space-y-6">
                                    <div className="bg-white/20 backdrop-blur w-fit px-4 py-1 rounded-full text-[9px] font-black uppercase">Encontro com Deus</div>
                                    <h2 className="text-4xl lg:text-5xl font-display font-bold uppercase tracking-tighter leading-tight text-left">{encontroFixo.titulo}</h2>
                                    <div className="flex flex-col gap-3 text-white/80">
                                        <span className="flex items-center gap-2 text-xs font-bold font-body uppercase"><Calendar size={14}/> {encontroFixo.dataReal?.toDate().toLocaleDateString('pt-BR')}</span>
                                        <span className="flex items-center gap-2 text-xs font-bold font-body uppercase"><MapPin size={14}/> {encontroFixo.local}</span>
                                    </div>
                                </div>
                                <button onClick={() => setEventoSelecionado(encontroFixo)} className="relative z-10 w-full py-5 bg-white text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all mt-10 shadow-lg italic">Inscrições & Informações</button>
                            </div>
                        )}
                    </div>
                )}

                {gridFuturos.length > 0 && (
                    <div className="space-y-8 pt-10 border-t border-blue-100">
                        <h3 className="text-xl font-display font-bold text-blue-900/40 uppercase tracking-widest italic">Próximas Datas</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 italic">
                            {gridFuturos.map(ev => <EventCard key={ev.id} ev={ev} isSmall />)}
                        </div>
                    </div>
                )}

                {passadosFiltrados.length > 0 && (
                    <div className="space-y-8 pt-20 border-t border-blue-100 opacity-60 grayscale hover:grayscale-0 transition-all duration-700 italic">
                        <div className="flex items-center gap-4 text-slate-400">
                            <History size={24} />
                            <h3 className="text-xl font-display font-bold uppercase tracking-widest italic">Veja nossos Eventos que já passaram</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 italic">
                            {passadosFiltrados.map(ev => <EventCard key={ev.id} ev={ev} isSmall />)}
                        </div>
                    </div>
                )}
            </div>

            {eventoSelecionado && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-md" onClick={() => setEventoSelecionado(null)} />
                    <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-[4rem] relative z-10 overflow-hidden shadow-2xl flex flex-col italic">
                        <button onClick={() => setEventoSelecionado(null)} className="absolute top-8 right-8 p-3 bg-blue-50 text-blue-600 rounded-full hover:bg-red-50 hover:text-red-500 transition-all z-20"><X size={24} /></button>
                        <div className="p-10 lg:p-16 overflow-y-auto custom-scrollbar space-y-8">
                            <div className="space-y-2 text-left">
                                <span className="text-blue-500 font-black text-xs uppercase tracking-widest">{eventoSelecionado.tipo} {eventoSelecionado.ministerio !== 'Geral' && `• ${eventoSelecionado.ministerio}`}</span>
                                <h2 className="text-4xl lg:text-6xl font-display font-bold text-blue-900 uppercase tracking-tighter leading-none text-left">{eventoSelecionado.titulo}</h2>
                                <p className="text-slate-500 text-lg leading-relaxed pt-4 border-t border-blue-50 mt-4">"{eventoSelecionado.descricao}"</p>
                            </div>
                            {eventoSelecionado.galeria?.length > 0 && (
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em] italic text-left">Galeria de Recordações</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 italic">
                                        {eventoSelecionado.galeria.map((img: string, i: number) => (
                                            <div key={i} className="aspect-square rounded-[2rem] overflow-hidden border-4 border-blue-50 shadow-sm transition-transform hover:scale-105">
                                                <img src={img} className="w-full h-full object-cover" alt="Galeria" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}