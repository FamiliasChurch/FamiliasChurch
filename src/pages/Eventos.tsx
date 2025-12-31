import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { 
    Calendar, 
    MapPin, 
    ChevronDown, 
    Search, 
    Clock, 
    ArrowRight,
    ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Events() {
    // Estado do filtro começando com "Todos" por padrão
    const [filtro, setFiltro] = useState("Todos");
    const [eventos, setEventos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const categorias = ["Todos", "Cultos", "Encontros com Deus", "Conferências", "Encontro de Casais"];

    useEffect(() => {
        const q = query(collection(db, "agenda_eventos"), orderBy("dataReal", "asc"));
        const unsub = onSnapshot(q, (snap) => {
            setEventos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // Lógica de filtragem
    const eventosFiltrados = filtro === "Todos" 
        ? eventos 
        : eventos.filter(ev => ev.tipo === filtro);

    return (
        <div className="min-h-screen bg-blue-50/30 pt-32 pb-20 font-sans">
            <div className="container mx-auto px-6">
                
                {/* CABEÇALHO DA PÁGINA */}
                <div className="text-center mb-16 space-y-4">
                    <h1 className="font-display text-6xl md:text-8xl uppercase tracking-tighter text-blue-900">
                        Agenda <span className="text-blue-500">Igreja</span>
                    </h1>
                    <p className="text-blue-400 uppercase tracking-[0.3em] text-[10px] font-black">
                        Fique por dentro de tudo que acontece
                    </p>
                </div>

                {/* FILTROS - MOBILE (DROPDOWN) */}
                <div className="md:hidden relative max-w-xs mx-auto mb-12 group">
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-blue-500">
                        <ChevronDown size={20} />
                    </div>
                    <select 
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                        className="w-full appearance-none bg-white border-2 border-blue-100 text-blue-900 px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest cursor-pointer outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all shadow-lg text-center"
                    >
                        {categorias.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* FILTROS - DESKTOP (BOTÕES) */}
                <div className="hidden md:flex flex-wrap justify-center gap-3 mb-16">
                    {categorias.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFiltro(cat)}
                            className={`px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all border ${
                                filtro === cat 
                                ? 'bg-blue-600 text-white shadow-xl scale-110 border-blue-600' 
                                : 'bg-white text-blue-400 hover:bg-blue-50 border-blue-100'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* GRID DE EVENTOS */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-blue-500" size={40} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {eventosFiltrados.length > 0 ? (
                            eventosFiltrados.map((ev) => (
                                <div key={ev.id} className="bg-white rounded-[3rem] overflow-hidden border border-blue-50 shadow-sm hover:shadow-2xl transition-all group flex flex-col">
                                    <div className="relative h-64 overflow-hidden">
                                        <img 
                                            src={ev.capa || "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073"} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                            alt={ev.titulo} 
                                        />
                                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-1 rounded-full shadow-sm">
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{ev.tipo}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="p-8 flex-1 flex flex-col space-y-4">
                                        <div className="flex items-center gap-4 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} />
                                                {ev.dataReal?.toDate().toLocaleDateString('pt-BR')}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={14} />
                                                {ev.dataReal?.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        
                                        <h3 className="text-2xl font-black text-blue-900 uppercase tracking-tight leading-tight">
                                            {ev.titulo}
                                        </h3>
                                        
                                        <p className="text-slate-500 text-sm italic line-clamp-3">
                                            {ev.descricao}
                                        </p>

                                        <div className="pt-4 mt-auto">
                                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-6">
                                                <MapPin size={14} className="text-blue-300" />
                                                {ev.local}
                                            </div>
                                            
                                            {ev.possuiInscricao && ev.linkInscricao ? (
                                                <a 
                                                    href={ev.linkInscricao} 
                                                    target="_blank" 
                                                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                                                >
                                                    Fazer Inscrição <ExternalLink size={14} />
                                                </a>
                                            ) : (
                                                <div className="w-full bg-blue-50 text-blue-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                                                    Entrada Livre
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-32 text-center border-2 border-dashed border-blue-100 rounded-[4rem] bg-blue-50/20">
                                <p className="uppercase tracking-widest font-black text-xs text-blue-300">
                                    Nenhum evento encontrado nesta categoria
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Componente auxiliar Loader (caso não tenha importado)
function Loader2({ className, size }: { className?: string, size?: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size || 24}
            height={size || 24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`animate-spin ${className}`}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    );
}
