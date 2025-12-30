import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { ExternalLink, Sparkles, Share2, BookOpen, ScrollText, Layout, Quote } from "lucide-react";

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
        // Ao mudar de aba, limpamos a seleção para o container sumir
        setSelectedId(null);

        const q = query(
            collection(db, "estudos_biblicos"),
            where("tipo", "==", activeTab),
            orderBy("data", "desc")
        );

        const unsub = onSnapshot(q, (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setPublicacoes(docs);
            // REMOVIDO: A linha que auto-selecionava o primeiro item (docs[0])
            setLoading(false);
        });
        return () => unsub();
    }, [activeTab]);

    // ALTERADO: Removemos o "|| publicacoes[0]" para garantir que seja null se nada for clicado
    const selectedData = publicacoes.find(p => p.id === selectedId);

    const linkLifeChurch = (item: any) => item
        ? `https://www.bible.com/pt/bible/1840/${item.livroRef}.${item.capituloRef}.${item.versiculoRef || '1'}`
        : "#";

    return (
        <div className="min-h-screen bg-slate-50 pt-32 md:pt-40 pb-10 px-4 md:px-8 font-body">
            <div className="max-w-[1800px] mx-auto space-y-8">

                {/* SELETOR DE ABAS */}
                <div className="flex justify-center">
                    <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
                        {["devocional", "estudo"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab as any); setSelectedId(null); }}
                                className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"}`}
                            >
                                {tab === "devocional" ? <ScrollText size={16} /> : <Layout size={16} />}
                                {tab === "devocional" ? "Devocionais" : "Estudos Bíblicos"}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* ESQUERDA: LISTA */}
                    <main className="xl:col-span-7 space-y-6">
                        {loading ? (
                            <div className="flex justify-center py-20 animate-pulse"><div className="h-8 w-8 bg-emerald-200 rounded-full"></div></div>
                        ) : (
                            publicacoes.map((e) => (
                                <div key={e.id} className="space-y-4">
                                    <article
                                        onClick={() => setSelectedId(e.id)}
                                        className={`bg-white rounded-[2.5rem] border cursor-pointer overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col md:flex-row ${selectedId === e.id ? 'ring-4 ring-emerald-500/10 border-emerald-500 transform scale-[1.01]' : 'border-slate-100'}`}
                                    >
                                        <div className="md:w-1/4 h-48 md:h-auto overflow-hidden">
                                            <img src={e.capa} className="w-full h-full object-cover" alt={e.titulo} />
                                        </div>
                                        <div className="p-8 flex flex-col justify-center flex-1">
                                            <span className="text-[9px] font-black text-emerald-600 uppercase mb-2 tracking-widest">{e.cargoAutor}</span>
                                            <h2 className="text-2xl font-display font-bold text-slate-800 uppercase italic leading-none">{e.titulo}</h2>
                                            <p className="text-slate-400 text-xs italic mt-3 line-clamp-1">"{e.conteudo}"</p>
                                        </div>
                                    </article>

                                    {/* MOBILE: REFERÊNCIA (Já estava correto, mantém aparecendo só se selecionado) */}
                                    {selectedId === e.id && (
                                        <div className="xl:hidden animate-in fade-in slide-in-from-top-4 duration-500">
                                            <div className="bg-emerald-600 rounded-[2rem] p-6 text-white shadow-lg flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <BookOpen size={20} />
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80 italic">Referência NAA</p>
                                                        <h4 className="text-xl font-display font-black uppercase italic leading-none">
                                                            {infoLivros[e.livroRef]?.nome || e.livroRef} {e.capituloRef}:{e.versiculoRef || '1'}
                                                        </h4>
                                                    </div>
                                                </div>
                                                <a href={linkLifeChurch(e)} target="_blank" className="bg-white text-emerald-600 p-3 rounded-xl shadow-md"><ExternalLink size={18} /></a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </main>

                    {/* DIREITA: DESKTOP */}
                    <aside className="xl:col-span-5 hidden xl:block">
                        <div className="sticky top-28">
                            {/* ADICIONADO: Verifica se selectedData existe antes de renderizar o card */}
                            {selectedData ? (
                                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden flex flex-col min-h-[500px] relative animate-in fade-in slide-in-from-right-8 duration-700">

                                    <div className="p-10 flex flex-col items-center justify-center flex-1 text-center space-y-6">
                                        <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100 mb-2">
                                            <Sparkles size={14} className="text-emerald-500" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-50 italic">Base Bíblica</span>
                                        </div>

                                        <div className="space-y-1">
                                            <h4 className="text-4xl font-display font-black text-slate-900 uppercase italic leading-none tracking-tighter">
                                                {infoLivros[selectedData.livroRef]?.nome || selectedData.livroRef}
                                            </h4>
                                            <p className="text-xl font-display font-bold text-emerald-600 italic">
                                                {selectedData.capituloRef}:{selectedData.versiculoRef || '1'}
                                            </p>
                                        </div>

                                        <div className="max-w-xs relative py-6 border-y border-slate-50 mt-4">
                                            <Quote size={16} className="text-emerald-100 absolute -top-2 -left-2" />
                                            <p className="text-slate-600 text-sm font-serif italic leading-relaxed">
                                                "{selectedData.textoVersiculo || "Acesse o link abaixo para ler o capítulo completo."}"
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-slate-50 border-t border-slate-100 grid grid-cols-4 gap-4">
                                        <a
                                            href={linkLifeChurch(selectedData)}
                                            target="_blank" rel="noopener noreferrer"
                                            className="col-span-3 bg-slate-900 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-xl"
                                        >
                                            LER NA LIFE.CHURCH <ExternalLink size={14} />
                                        </a>

                                        <button
                                            className="col-span-1 bg-white border border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-all"
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
                            ): (
                                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden flex flex-col items-center justify-center p-20 text-center text-slate-400 italic animate-in fade-in slide-in-from-right-8 duration-700">
                                    <BookOpen size={48} className="mb-6" />
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}