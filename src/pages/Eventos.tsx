import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { 
    Calendar, MapPin, Sparkles, X, History, 
    ChevronRight, Link2, ExternalLink 
} from "lucide-react";

export default function Eventos() {
    const [eventosFuturos, setEventosFuturos] = useState<any[]>([]);
    const [eventosAntigos, setEventosAntigos] = useState<any[]>([]);
    const [filtroAtivo, setFiltroAtivo] = useState("Todos");
    const [loading, setLoading] = useState(true);
    const [eventoSelecionado, setEventoSelecionado] = useState<any>(null);

    const categorias = ["Todos", "Cultos", "Encontros com Deus", "Conferências", "Encontro de Casais"];

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

    // 🛡️ FILTRO COM EXCLUSÃO (Blindagem de Categoria)
    const filtrar = (lista: any[]) => lista.filter(ev => {
        const tipoEV = (ev.tipo || "").toLowerCase();
        const f = filtroAtivo.toLowerCase();
        if (f === "todos") return true;
        if (f.includes("casais")) return tipoEV.includes("casais");
        if (f.includes("encontros com deus") || f === "encontro com deus") {
            return tipoEV.includes("encontro") && !tipoEV.includes("casais");
        }
        return tipoEV === f;
    });

    const futurosFiltrados = filtrar(eventosFuturos);
    const passadosFiltrados = filtrar(eventosAntigos);

    // 🧩 LÓGICA DE POSICIONAMENTO ASSIMÉTRICO (ABA TODOS)
    const destaquePrincipal = futurosFiltrados[0]; // Próximo evento geral
    const encontroDestaque = futurosFiltrados.find(ev => 
        ev.id !== destaquePrincipal?.id && ev.tipo?.toLowerCase().includes("encontro com deus")
    );
    const proximoSubDestaque = futurosFiltrados.find(ev => 
        ev.id !== destaquePrincipal?.id && ev.id !== encontroDestaque?.id
    );

    // Grid de próximos eventos (exclui os 3 destaques acima)
    const gridFuturos = futurosFiltrados.filter(ev => 
        ev.id !== destaquePrincipal?.id && 
        ev.id !== encontroDestaque?.id && 
        ev.id !== proximoSubDestaque?.id
    );

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-blue-50/30"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="min-h-screen bg-blue-50/30 pt-32 md:pt-40 px-6 font-body relative">
            <div className="container mx-auto max-w-7xl space-y-20">
                
                {/* CABEÇALHO E FILTROS */}
                <div className="text-center space-y-8 max-w-4xl mx-auto">
                    <h1 className="font-display text-8xl md:text-9xl uppercase tracking-tighter leading-none text-blue-900">Nossa <span className="text-blue-500">Agenda</span></h1>
                    <div className="flex flex-wrap justify-center gap-3">
                        {categorias.map(cat => (
                            <button key={cat} onClick={() => { setFiltroAtivo(cat); }}
                                className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${filtroAtivo === cat ? 'bg-blue-600 text-white border-blue-600 shadow-xl scale-105' : 'bg-white text-blue-400 border-blue-100 hover:bg-blue-50'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 🎯 SEÇÃO 1: DESTAQUE TRIPLO (APENAS ABA TODOS) */}
                {filtroAtivo === "Todos" && destaquePrincipal && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        
                        {/* DESTAQUE PRINCIPAL (ESQUERDA - GRANDÃO) */}
                        <div className="lg:col-span-8 bg-white rounded-[4rem] overflow-hidden border border-blue-100 shadow-2xl flex flex-col relative group min-h-[600px] italic">
                            <div className="absolute inset-0">
                                <img src={destaquePrincipal.capa} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/20 to-transparent" />
                            </div>
                            <div className="relative mt-auto p-10 lg:p-16 space-y-6 text-white text-left">
                                <div className="flex items-center gap-2 bg-blue-600 w-fit px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                                    <Sparkles size={14}/> Próximo Evento
                                </div>
                                <h2 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter leading-[0.8]">{destaquePrincipal.titulo}</h2>
                                <div className="flex flex-wrap gap-6 text-white/80">
                                    <span className="flex items-center gap-2 text-sm font-bold uppercase"><Calendar size={18}/> {destaquePrincipal.dataReal?.toDate().toLocaleDateString('pt-BR')}</span>
                                    <span className="flex items-center gap-2 text-sm font-bold uppercase"><MapPin size={18}/> {destaquePrincipal.local}</span>
                                </div>
                                <button onClick={() => setEventoSelecionado(destaquePrincipal)} className="px-10 py-5 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-50 transition-all shadow-xl">Ver Detalhes do Evento</button>
                            </div>
                        </div>

                        {/* COLUNA DA DIREITA (OS DOIS MENORES) */}
                        <div className="lg:col-span-4 flex flex-col gap-8">
                            {/* ENCONTRO COM DEUS (TOP RIGHT) */}
                            {encontroDestaque && (
                                <div className="bg-blue-600 rounded-[3.5rem] p-8 text-white relative overflow-hidden shadow-xl border-4 border-white/10 group h-1/2 flex flex-col justify-end italic">
                                    <img src={encontroDestaque.capa} className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-110 transition-all duration-1000" />
                                    <div className="relative z-10 space-y-4 text-left">
                                        <div className="bg-white/20 backdrop-blur w-fit px-3 py-1 rounded-full text-[8px] font-black uppercase">Próximo Encontro</div>
                                        <h3 className="text-3xl font-display font-bold uppercase tracking-tighter leading-tight">{encontroDestaque.titulo}</h3>
                                        <button onClick={() => setEventoSelecionado(encontroDestaque)} className="w-full py-3 bg-white text-blue-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-50 transition-all">Inscrições</button>
                                    </div>
                                </div>
                            )}

                            {/* EVENTO MAIS PRÓXIMO (BOTTOM RIGHT) */}
                            {proximoSubDestaque && (
                                <div className="bg-white rounded-[3.5rem] p-8 border border-blue-100 shadow-xl group h-1/2 flex flex-col justify-end relative overflow-hidden italic">
                                    <div className="relative z-10 space-y-4 text-left">
                                        <span className="text-blue-500 font-black text-[9px] uppercase tracking-widest">{proximoSubDestaque.tipo}</span>
                                        <h3 className="text-3xl font-display font-bold text-blue-900 uppercase tracking-tighter leading-tight">{proximoSubDestaque.titulo}</h3>
                                        <p className="text-blue-400 text-[10px] font-bold uppercase flex items-center gap-1">
                                            <Calendar size={12}/> {proximoSubDestaque.dataReal?.toDate().toLocaleDateString('pt-BR')}
                                        </p>
                                        <button onClick={() => setEventoSelecionado(proximoSubDestaque)} className="w-full py-3 border border-blue-100 text-blue-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Saiba Mais</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 🎯 SEÇÃO 2: LAYOUT ESTILO HOME (PARA ABAS ESPECÍFICAS) */}
                {filtroAtivo !== "Todos" && destaquePrincipal && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500 italic">
                        {/* Destaque da Esquerda (Hero) */}
                        <div className="lg:col-span-7 bg-white rounded-[4rem] overflow-hidden border border-blue-100 shadow-2xl relative min-h-[500px]">
                            <img src={destaquePrincipal.capa} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent flex flex-col justify-end p-12 text-left">
                                <h2 className="text-5xl font-display font-bold text-white uppercase tracking-tighter leading-none">{destaquePrincipal.titulo}</h2>
                                <button onClick={() => setEventoSelecionado(destaquePrincipal)} className="mt-6 w-fit px-10 py-4 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Ver Mensagem</button>
                            </div>
                        </div>
                        {/* Outros Eventos da Aba (Direita) */}
                        <div className="lg:col-span-5 space-y-6">
                            <h3 className="text-[10px] font-black uppercase text-blue-300 tracking-[0.4em] text-left">Outros Eventos em {filtroAtivo}</h3>
                            <div className="space-y-4">
                                {gridFuturos.slice(0, 3).map(ev => (
                                    <div key={ev.id} onClick={() => setEventoSelecionado(ev)} className="bg-white p-6 rounded-[2.5rem] border border-blue-50 flex items-center gap-5 hover:translate-x-2 transition-all cursor-pointer group">
                                        <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-blue-50">
                                            <img src={ev.capa} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest italic">{ev.dataReal?.toDate().toLocaleDateString('pt-BR')}</p>
                                            <h4 className="font-bold text-blue-900 uppercase text-sm leading-tight group-hover:text-blue-600 transition-colors">{ev.titulo}</h4>
                                        </div>
                                        <ChevronRight className="ml-auto text-blue-100" size={24}/>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 📅 GRID: PRÓXIMAS DATAS (Aparece em todas as abas para os demais eventos) */}
                {(filtroAtivo === "Todos" ? gridFuturos : gridFuturos.slice(3)).length > 0 && (
                    <div className="space-y-8 pt-10 border-t border-blue-100">
                        <h3 className="text-xl font-display font-bold text-blue-900/40 uppercase tracking-widest italic text-left">Mais Eventos na Agenda</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {(filtroAtivo === "Todos" ? gridFuturos : gridFuturos.slice(3)).map(ev => (
                                <div key={ev.id} className="bg-white rounded-[2.5rem] p-4 border border-blue-50 hover:shadow-xl transition-all group cursor-pointer text-left italic" onClick={() => setEventoSelecionado(ev)}>
                                    <div className="h-40 rounded-[2rem] overflow-hidden mb-4"><img src={ev.capa} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" /></div>
                                    <span className="text-[9px] font-bold text-blue-400 uppercase italic">{ev.dataReal?.toDate().toLocaleDateString('pt-BR')}</span>
                                    <h4 className="font-bold text-blue-900 uppercase text-sm line-clamp-2 mt-1 mb-4">{ev.titulo}</h4>
                                    <button className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-black text-[9px] uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white transition-all">Detalhes</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ⏳ HISTÓRICO: APENAS NA ABA TODOS */}
                {filtroAtivo === "Todos" && passadosFiltrados.length > 0 && (
                    <div className="space-y-8 pt-20 border-t border-blue-100 opacity-60 grayscale hover:grayscale-0 transition-all duration-700 italic text-left">
                        <div className="flex items-center gap-4 text-slate-400">
                            <History size={24} />
                            <h3 className="text-xl font-display font-bold uppercase tracking-widest">Eventos que marcaram nossa história</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {passadosFiltrados.map(ev => (
                                <div key={ev.id} className="bg-white rounded-[2.5rem] p-4 border border-blue-50 flex flex-col h-full grayscale opacity-70">
                                     <div className="h-32 rounded-[2rem] overflow-hidden mb-4"><img src={ev.capa} className="w-full h-full object-cover" /></div>
                                     <h4 className="font-bold text-slate-500 uppercase text-xs line-clamp-2">{ev.titulo}</h4>
                                     <p className="text-[9px] font-bold text-slate-300 mt-2">{ev.dataReal?.toDate().toLocaleDateString('pt-BR')}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL DETALHES (Mantido) */}
            {eventoSelecionado && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-md" onClick={() => setEventoSelecionado(null)} />
                    <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-[4rem] relative z-10 overflow-hidden shadow-2xl flex flex-col italic transition-all">
                        <button onClick={() => setEventoSelecionado(null)} className="absolute top-8 right-8 p-3 bg-blue-50 text-blue-600 rounded-full hover:bg-red-50 hover:text-red-500 transition-all z-20"><X size={24} /></button>
                        <div className="p-10 lg:p-16 overflow-y-auto custom-scrollbar space-y-8 text-left">
                            <div className="space-y-2">
                                <span className="text-blue-500 font-black text-xs uppercase tracking-widest">{eventoSelecionado.tipo}</span>
                                <h2 className="text-4xl lg:text-6xl font-display font-bold text-blue-900 uppercase tracking-tighter leading-none">{eventoSelecionado.titulo}</h2>
                                <p className="text-slate-500 text-lg leading-relaxed pt-4 border-t border-blue-50 mt-4">"{eventoSelecionado.descricao}"</p>
                            </div>
                            {eventoSelecionado.possuiInscricao && eventoSelecionado.linkInscricao && (
                                <a href={eventoSelecionado.linkInscricao} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-blue-700 transition-all no-underline">
                                    <ExternalLink size={20}/> Clique para Fazer sua Inscrição
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}