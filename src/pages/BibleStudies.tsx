import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { BookOpen, Send, Camera, Loader2, Link2, Layout, ScrollText, Quote, AlertCircle, Trash2, Edit2, List, PlusCircle } from "lucide-react";

export default function BibleStudies({ userRole, userName }: { userRole: string, userName: string }) {
  // Estado para controlar a aba ativa: 'form' (criar/editar) ou 'list' (gerenciar)
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');
  
  const [estudo, setEstudo] = useState({ 
    titulo: "", conteudo: "", livro: "JHN", capitulo: 1, versiculo: 1, textoVersiculo: "", tipo: "devocional" 
  });
  const [imagem, setImagem] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [limiteSugerido, setLimiteSugerido] = useState<number | null>(null);

  const CLOUD_NAME = "ddndbv7do"; 
  const UPLOAD_PRESET = "ddndbv7do"; 

  // Lista de Livros (Resumida para visualização, mantenha a completa de 66 livros)
  const livrosBiblia = [
    { id: "GEN", nome: "Gênesis", caps: 50 }, { id: "EXO", nome: "Êxodo", caps: 40 },
    // ... adicione os outros livros aqui (LEV, NUM, DEU, etc...) ...
    { id: "MAT", nome: "Mateus", caps: 28 }, { id: "JHN", nome: "João", caps: 21 },
    { id: "REV", nome: "Apocalipse", caps: 22 }
  ];

  // Carrega lista em tempo real
  useEffect(() => {
    const q = query(collection(db, "estudos_biblicos"), orderBy("data", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setHistorico(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Sugestão de limite de versículos
  useEffect(() => {
    let slug = estudo.livro.toLowerCase();
    if (slug === "jhn") slug = "jn"; 
    fetch(`https://www.abibliadigital.com.br/api/verses/naa/${slug}/${estudo.capitulo}`)
      .then(res => res.json())
      .then(data => { if (data.chapter) setLimiteSugerido(data.chapter.verses); })
      .catch(() => setLimiteSugerido(null));
  }, [estudo.livro, estudo.capitulo]);

  const handlePublicarOuEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estudo.titulo || !estudo.conteudo) return;
    setLoading(true);

    try {
      let imageUrl = editingId ? historico.find(h => h.id === editingId)?.capa : "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=2070";

      if (imagem) {
        const formData = new FormData();
        formData.append("file", imagem);
        formData.append("upload_preset", UPLOAD_PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
        const data = await res.json();
        imageUrl = data.secure_url;
      }

      const dadosPost = {
        titulo: estudo.titulo,
        conteudo: estudo.conteudo,
        livroRef: estudo.livro,
        capituloRef: estudo.capitulo,
        versiculoRef: estudo.versiculo,
        textoVersiculo: estudo.textoVersiculo, 
        tipo: estudo.tipo,
        capa: imageUrl,
        autor: userName,
        cargoAutor: userRole,
        data: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, "estudos_biblicos", editingId), dadosPost);
        alert("Atualizado com sucesso!");
        setEditingId(null);
      } else {
        await addDoc(collection(db, "estudos_biblicos"), dadosPost);
        alert("Publicado com sucesso!");
      }

      setEstudo({ titulo: "", conteudo: "", livro: "JHN", capitulo: 1, versiculo: 1, textoVersiculo: "", tipo: "devocional" });
      setImagem(null);
      
      // Se estava editando, volta para a lista para ver o resultado
      if(editingId) setActiveTab('list');

    } catch { alert("Erro ao salvar."); } finally { setLoading(false); }
  };

  const handleExcluir = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta publicação?")) {
      try {
        await deleteDoc(doc(db, "estudos_biblicos", id));
      } catch { alert("Erro ao excluir."); }
    }
  };

  const handleCarregarEdicao = (post: any) => {
    setEstudo({
      titulo: post.titulo,
      conteudo: post.conteudo,
      livro: post.livroRef,
      capitulo: post.capituloRef,
      versiculo: post.versiculoRef,
      textoVersiculo: post.textoVersiculo || "",
      tipo: post.tipo
    });
    setEditingId(post.id);
    setActiveTab('form'); // Muda automaticamente para a aba de formulário
  };

  const livroAtual = livrosBiblia.find(l => l.id === estudo.livro);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      
      {/* CABEÇALHO COM ABAS DE NAVEGAÇÃO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-900 text-white rounded-2xl shadow-lg"><BookOpen size={24} /></div>
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-800 uppercase italic">Painel da Palavra</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Estudos e Devocionais</p>
          </div>
        </div>

        {/* Botões de Alternância entre Criar e Listar */}
        <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm self-start">
          <button 
            onClick={() => { setActiveTab('form'); setEditingId(null); setEstudo({ titulo: "", conteudo: "", livro: "JHN", capitulo: 1, versiculo: 1, textoVersiculo: "", tipo: "devocional" }); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'form' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <PlusCircle size={14} /> Novo Conteúdo
          </button>
          <button 
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'list' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <List size={14} /> Gerenciar ({historico.length})
          </button>
        </div>
      </div>

      {/* ÁREA 1: FORMULÁRIO DE CRIAÇÃO/EDIÇÃO (SÓ APARECE SE A ABA FOR 'FORM') */}
      {activeTab === 'form' && (
        <section className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-200 shadow-sm space-y-8 animate-in slide-in-from-left-4 duration-500">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
              {editingId ? <><Edit2 size={18} className="text-emerald-500"/> Editando Publicação</> : <><PlusCircle size={18} className="text-emerald-500"/> Nova Publicação</>}
            </h3>
            {/* Seletor de Tipo */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {["devocional", "estudo"].map(t => (
                <button key={t} type="button" onClick={() => setEstudo({...estudo, tipo: t})} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${estudo.tipo === t ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handlePublicarOuEditar} className="space-y-6">
            <input required placeholder="Título da Mensagem" value={estudo.titulo} onChange={e => setEstudo({...estudo, titulo: e.target.value})} className="w-full bg-slate-50 p-6 rounded-2xl outline-none focus:border-emerald-500 border border-transparent font-bold text-slate-700 italic text-lg" />
            
            <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100 space-y-5">
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2"><Link2 size={14}/> Referência Manual</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select value={estudo.livro} onChange={e => setEstudo({...estudo, livro: e.target.value})} className="bg-white p-4 rounded-xl border border-emerald-200 text-xs font-bold text-slate-600 outline-none">
                  {livrosBiblia.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                </select>
                <div className="relative">
                  <input type="number" value={estudo.capitulo} onChange={e => setEstudo({...estudo, capitulo: Number(e.target.value)})} className="w-full bg-white p-4 rounded-xl border border-emerald-200 text-xs font-bold text-slate-600 outline-none" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-300 uppercase">Sugestão: 1-{livroAtual?.caps}</span>
                </div>
                <div className="relative group">
                  <input type="number" value={estudo.versiculo} onChange={e => setEstudo({...estudo, versiculo: Number(e.target.value)})} className={`w-full p-4 rounded-xl border text-xs font-bold outline-none transition-all ${limiteSugerido && estudo.versiculo > limiteSugerido ? 'border-amber-400 bg-amber-50 text-amber-700' : 'bg-white border-emerald-200 text-slate-600'}`} />
                  {limiteSugerido && estudo.versiculo > limiteSugerido && <div className="absolute -top-8 right-0 bg-amber-100 text-amber-700 text-[9px] font-bold px-3 py-1 rounded-lg shadow-sm flex items-center gap-1"><AlertCircle size={10} /> Comum até {limiteSugerido}</div>}
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-300 uppercase">Versículo</span>
                </div>
              </div>
              <div className="relative">
                <input required placeholder="Cole o texto do versículo aqui..." value={estudo.textoVersiculo} onChange={e => setEstudo({...estudo, textoVersiculo: e.target.value})} className="w-full bg-white p-4 pl-12 rounded-xl border border-emerald-200 text-xs font-serif italic text-slate-600 outline-none" />
                <Quote size={16} className="text-emerald-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-[2rem] cursor-pointer hover:bg-slate-50 transition-all">
              {imagem ? <span className="text-xs font-bold text-emerald-600">{imagem.name}</span> : <div className="flex flex-col items-center text-slate-400"><Camera size={24} className="mb-2" /><span className="text-[10px] font-black uppercase">Capa da Postagem</span></div>}
              <input type="file" className="hidden" accept="image/*" onChange={e => setImagem(e.target.files?.[0] || null)} />
            </label>

            <textarea required placeholder="Conteúdo da mensagem..." value={estudo.conteudo} onChange={e => setEstudo({...estudo, conteudo: e.target.value})} className="w-full bg-slate-50 p-8 rounded-[2.5rem] outline-none focus:border-emerald-500 border border-transparent h-64 text-slate-600 italic leading-relaxed shadow-inner" />
            
            <button disabled={loading} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl hover:bg-emerald-600 transition-all disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={20} /> : editingId ? <Edit2 size={20} /> : <Send size={20} />} 
              {editingId ? "SALVAR ALTERAÇÕES" : "PUBLICAR AGORA"}
            </button>
          </form>
        </section>
      )}

      {/* ÁREA 2: LISTA DE GERENCIAMENTO (SÓ APARECE SE A ABA FOR 'LIST') */}
      {activeTab === 'list' && (
        <section className="space-y-6 animate-in slide-in-from-right-4 duration-500">
          <div className="grid gap-4">
            {historico.length === 0 ? (
              <div className="text-center py-20 text-slate-400">Nenhuma publicação encontrada.</div>
            ) : (
              historico.map((post) => (
                <div key={post.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-emerald-200 transition-all">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
                      <img src={post.capa} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md mb-1 inline-block ${post.tipo === 'devocional' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{post.tipo}</span>
                      <h4 className="font-bold text-slate-800 italic text-lg leading-tight">{post.titulo}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{post.livroRef} {post.capituloRef}:{post.versiculoRef}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 w-full md:w-auto">
                    <button 
                      onClick={() => handleCarregarEdicao(post)}
                      className="flex-1 md:flex-none py-3 px-6 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-50 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit2 size={14} /> Editar
                    </button>
                    <button 
                      onClick={() => handleExcluir(post.id)}
                      className="flex-1 md:flex-none py-3 px-4 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}