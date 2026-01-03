import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { ExternalLink, Sparkles, Share2, BookOpen, ScrollText, Layout, Quote, ChevronRight } from "lucide-react";

export default function Devocionais() {
    const [publicacoes, setPublicacoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"devocional" | "estudo">("devocional");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const infoLivros: { [key: string]: { nome: string } } = {
        "GEN": { nome: "Gênesis" }, "EXO": { nome: "Êxodo" }, "LEV": { nome: "Levítico" },
        "NUM": { nome: "Números" }, "DEU": { nome: "Deuteronômio" }, "PSA": { nome: "Salmos" },
        "PRO": { nome: "Provérbios" }, "MAT": { nome: "Mateus" }, "MRK": { nome: "Marcos" },
        "LUK": { nome: "Lucas" }, "JHN": { nome: "João" }, "ACT": { nome: "Atos" },
        "ROM": { nome: "Romanos" }, "REV": { nome: "Apocalipse" },
    };

    useEffect(() => {
        setLoading(true);
        setSelectedId(null);

        const q = query(
            collection(db, "estudos_biblicos"),
            where("tipo", "==", activeTab),
            orderBy("data", "desc")
        );

        const unsub = onSnapshot(q, (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setPublicacoes(docs);
            setLoading(false);
        });
        return () => unsub();
    }, [activeTab]);

    const selectedData = publicacoes.find(p => p.id === selectedId);

    const linkLifeChurch = (item: any) => item
        ? `https://www.bible.com/pt/bible/1840/${item.livroRef}.${item.capituloRef}.${item.versiculoRef || '1'}`
        : "#";

    return (
        <div className="min-h-screen bg-blue-50/30 pt-32 md:pt-5 px-6 font-body">
            <div className="container mx-auto max-w-7xl space-y-12">

                {/* CABEÇALHO */}
                <div className="text-center space-y-4">
                    <h1 className="font-display text-9xl md:text-9xl uppercase tracking-tighter leading-none text-blue-900">
                        Palavra <span className="text-blue-500">Viva</span>
                    </h1>

                    {/* SELETOR DE ABAS */}
                    <div className="flex justify-center mt-8">
                        <div className="flex flex-wrap justify-center gap-3">
                            {["devocional", "estudo"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab as any); setSelectedId(null); }}
                                    className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${activeTab === tab
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-xl scale-105'
                                            : 'bg-white text-blue-400 border-blue-100 hover:bg-blue-50'
                                        }`}
                                >
                                    {tab === "devocional" ? <ScrollText size={14} /> : <Layout size={14} />}
                                    {tab === "devocional" ? "Devocionais" : "Estudos Bíblicos"}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* ESQUERDA: LISTA */}
                    <main className="xl:col-span-7 space-y-6">
                        {loading ? (
                            <div className="flex justify-center py-20 animate-pulse"><div className="h-10 w-10 bg-blue-200 rounded-full"></div></div>
                        ) : (
                            publicacoes.map((e) => (
                                <div key={e.id} className="space-y-4">
                                    <article
                                        onClick={() => setSelectedId(e.id)}
                                        className={`bg-white rounded-[2.5rem] border cursor-pointer overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col md:flex-row group ${selectedId === e.id ? 'border-blue-500 ring-4 ring-blue-100 scale-[1.01]' : 'border-blue-50'}`}
                                    >
                                        <div className="md:w-1/3 h-48 md:h-auto overflow-hidden relative">
                                            <img src={e.capa} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={e.titulo} />
                                            <div className="absolute inset-0 bg-blue-900/10 group-hover:bg-transparent transition-colors"></div>
                                        </div>
                                        <div className="p-8 flex flex-col justify-center flex-1">
                                            <span className="text-[9px] font-black text-blue-500 uppercase mb-2 tracking-widest bg-blue-50 w-fit px-3 py-1 rounded-full">{e.cargoAutor}</span>
                                            <h2 className="text-2xl font-display font-bold text-blue-900 uppercase leading-none tracking-tight group-hover:text-blue-600 transition-colors">{e.titulo}</h2>
                                            <p className="text-slate-400 text-xs italic mt-3 line-clamp-2">"{e.conteudo}"</p>
                                            <div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-blue-400 uppercase tracking-widest">
                                                Ler Agora <ChevronRight size={12} />
                                            </div>
                                        </div>
                                    </article>

                                    {/* MOBILE: REFERÊNCIA */}
                                    {selectedId === e.id && (
                                        <div className="xl:hidden animate-in fade-in slide-in-from-top-4 duration-500">
                                            <div className="bg-blue-600 rounded-[2rem] p-6 text-white shadow-xl flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <BookOpen size={24} />
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Referência NAA</p>
                                                        <h4 className="text-2xl font-display font-bold uppercase leading-none mt-1">
                                                            {infoLivros[e.livroRef]?.nome || e.livroRef} {e.capituloRef}:{e.versiculoRef || '1'}
                                                        </h4>
                                                    </div>
                                                </div>
                                                <a href={linkLifeChurch(e)} target="_blank" className="bg-white text-blue-600 p-3 rounded-xl shadow-md hover:scale-110 transition-transform"><ExternalLink size={20} /></a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </main>

                    {/* DIREITA: DESKTOP (STICKY) */}
                    <aside className="xl:col-span-5 hidden xl:block">
                        <div className="sticky top-28">
                            {selectedData ? (
                                <div className="bg-white rounded-[3.5rem] border border-blue-100 shadow-2xl overflow-hidden flex flex-col min-h-[500px] relative animate-in fade-in slide-in-from-right-8 duration-700">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50" />

                                    <div className="p-12 flex flex-col items-center justify-center flex-1 text-center space-y-8 relative z-10">
                                        <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full border border-blue-100">
                                            <Sparkles size={14} className="text-blue-500" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Base Bíblica</span>
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className="text-5xl font-display font-bold text-blue-900 uppercase leading-none tracking-tighter">
                                                {infoLivros[selectedData.livroRef]?.nome || selectedData.livroRef}
                                            </h4>
                                            <p className="text-2xl font-display font-bold text-blue-500">
                                                {selectedData.capituloRef}:{selectedData.versiculoRef || '1'}
                                            </p>
                                        </div>

                                        <div className="w-full relative py-8 border-y border-blue-50">
                                            <Quote size={24} className="text-blue-100 absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2" />
                                            <p className="text-slate-500 text-lg font-serif italic leading-relaxed">
                                                "{selectedData.textoVersiculo || "Acesse o link abaixo para ler o capítulo completo."}"
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-blue-50/50 border-t border-blue-100 grid grid-cols-4 gap-4">
                                        <a
                                            href={linkLifeChurch(selectedData)}
                                            target="_blank" rel="noopener noreferrer"
                                            className="col-span-3 bg-blue-900 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-xl"
                                        >
                                            LER NA LIFE.CHURCH <ExternalLink size={14} />
                                        </a>

                                        <button
                                            className="col-span-1 bg-white border border-blue-100 text-blue-300 rounded-2xl flex items-center justify-center hover:bg-white hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
                                            onClick={() => {
                                                const ref = `${infoLivros[selectedData.livroRef]?.nome} ${selectedData.capituloRef}:${selectedData.versiculoRef || '1'}`;
                                                const txt = selectedData.textoVersiculo ? `"${selectedData.textoVersiculo}"` : "";
                                                navigator.clipboard.writeText(`📖 ${ref} (NAA)\n${txt}\nLeia em: ${linkLifeChurch(selectedData)}`);
                                                alert("Copiado!");
                                            }}
                                        >
                                            <Share2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white/50 rounded-[3.5rem] border border-blue-100 border-dashed shadow-sm flex flex-col items-center justify-center p-20 text-center text-blue-300 animate-in fade-in duration-700 h-[500px]">
                                    <BookOpen size={48} className="mb-4 opacity-50" />
                                    <p className="text-xs font-black uppercase tracking-widest">Selecione um devocional</p>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}