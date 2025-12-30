import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { BookOpen, Send, Camera, Loader2, Link2, Layout, ScrollText, Quote, AlertCircle, Trash2, Edit2, List, PlusCircle, CheckCircle } from "lucide-react";
// Import do Modal
import { useConfirm } from "../context/ConfirmContext";

export default function BibleStudies({ userRole, userName }: { userRole: string, userName: string }) {
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');
  
  const [estudo, setEstudo] = useState({ 
    titulo: "", conteudo: "", livro: "JHN", capitulo: 1, versiculo: 1, textoVersiculo: "", tipo: "devocional" 
  });
  const [imagem, setImagem] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [limiteSugerido, setLimiteSugerido] = useState<number | null>(null);

  // Instância do Modal
  const { confirm } = useConfirm();

  const CLOUD_NAME = "ddndbv7do"; 
  const UPLOAD_PRESET = "ddndbv7do"; 

  const livrosBiblia = [
    { id: "GEN", nome: "Gênesis", caps: 50 }, { id: "EXO", nome: "Êxodo", caps: 40 },
    { id: "MAT", nome: "Mateus", caps: 28 }, { id: "JHN", nome: "João", caps: 21 },
    { id: "REV", nome: "Apocalipse", caps: 22 }
  ];

  useEffect(() => {
    const q = query(collection(db, "estudos_biblicos"), orderBy("data", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setHistorico(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

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
        await confirm({ title: "Sucesso!", message: "Conteúdo atualizado.", variant: "success", confirmText: "Ok" });
        setEditingId(null);
      } else {
        await addDoc(collection(db, "estudos_biblicos"), dadosPost);
        await confirm({ title: "Publicado!", message: "Seu estudo já está online.", variant: "success", confirmText: "Amém" });
      }

      setEstudo({ titulo: "", conteudo: "", livro: "JHN", capitulo: 1, versiculo: 1, textoVersiculo: "", tipo: "devocional" });
      setImagem(null);
      
      if(editingId) setActiveTab('list');

    } catch { 
        alert("Erro ao salvar.");
    } finally { 
        setLoading(false); 
    }
  };

  const handleExcluir = async (id: string) => {
    const confirmou = await confirm({
        title: "Excluir Publicação?",
        message: "Tem certeza que deseja apagar este estudo? Ele será removido permanentemente do site e do aplicativo.",
        variant: "danger",
        confirmText: "Sim, Excluir",
        cancelText: "Cancelar"
    });

    if (confirmou) {
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
    setActiveTab('form'); 
  };

  const livroAtual = livrosBiblia.find(l => l.id === estudo.livro);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500 mt-6">
      
      {/* CABEÇALHO */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <BookOpen size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Painel da Palavra</h2>
            <p className="text-sm text-slate-500 font-medium">Gestão de Estudos e Devocionais</p>
          </div>
        </div>

        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-sm self-start md:self-auto">
          <button 
            onClick={() => { setActiveTab('form'); setEditingId(null); setEstudo({ titulo: "", conteudo: "", livro: "JHN", capitulo: 1, versiculo: 1, textoVersiculo: "", tipo: "devocional" }); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'form' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <PlusCircle size={14} /> Novo Conteúdo
          </button>
          <button 
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <List size={14} /> Gerenciar ({historico.length})
          </button>
        </div>
      </div>

      {/* ÁREA 1: FORMULÁRIO */}
      {activeTab === 'form' && (
        <section className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm animate-in slide-in-from-left-4 duration-500">
          <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-4">
            <h3 className="text-base font-bold text-slate-700 flex items-center gap-2">
              {editingId ? <><Edit2 size={18} className="text-emerald-500"/> Editando Publicação</> : <><PlusCircle size={18} className="text-emerald-500"/> Criar Nova Publicação</>}
            </h3>
            <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
              {["devocional", "estudo"].map(t => (
                <button key={t} type="button" onClick={() => setEstudo({...estudo, tipo: t})} className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${estudo.tipo === t ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handlePublicarOuEditar} className="space-y-6">
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Título</label>
                <input required placeholder="Ex: A Vitória da Cruz" value={estudo.titulo} onChange={e => setEstudo({...estudo, titulo: e.target.value})} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-50 font-semibold text-slate-700 text-base transition-all" />
            </div>
            
            <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 space-y-4">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-2 mb-2"><Link2 size={14}/> Referência Bíblica</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Livro</label>
                    <select value={estudo.livro} onChange={e => setEstudo({...estudo, livro: e.target.value})} className="w-full bg-white p-3 rounded-xl border border-emerald-200 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-100">
                    {livrosBiblia.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                    </select>
                </div>
                
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Capítulo</label>
                    <input type="number" value={estudo.capitulo} onChange={e => setEstudo({...estudo, capitulo: Number(e.target.value)})} className="w-full bg-white p-3 rounded-xl border border-emerald-200 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-100" />
                </div>

                <div className="space-y-1 relative group">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Versículo</label>
                  <input type="number" value={estudo.versiculo} onChange={e => setEstudo({...estudo, versiculo: Number(e.target.value)})} className={`w-full p-3 rounded-xl border text-sm font-medium outline-none focus:ring-2 transition-all ${limiteSugerido && estudo.versiculo > limiteSugerido ? 'border-amber-300 bg-amber-50 text-amber-700 focus:ring-amber-100' : 'bg-white border-emerald-200 text-slate-700 focus:ring-emerald-100'}`} />
                  {limiteSugerido && estudo.versiculo > limiteSugerido && <div className="absolute -top-6 right-0 bg-amber-100 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1"><AlertCircle size={10} /> Max: {limiteSugerido}</div>}
                </div>
              </div>
              
              <div className="relative">
                <input required placeholder="Cole o texto do versículo aqui..." value={estudo.textoVersiculo} onChange={e => setEstudo({...estudo, textoVersiculo: e.target.value})} className="w-full bg-white p-3 pl-10 rounded-xl border border-emerald-200 text-sm font-serif italic text-slate-600 outline-none focus:ring-2 focus:ring-emerald-100" />
                <Quote size={14} className="text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Conteúdo</label>
                    <textarea required placeholder="Escreva sua mensagem aqui..." value={estudo.conteudo} onChange={e => setEstudo({...estudo, conteudo: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl outline-none focus:bg-white focus:border-emerald-300 border border-slate-200 h-48 text-slate-600 text-sm leading-relaxed resize-none transition-all" />
                </div>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Capa</label>
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-emerald-200 transition-all group">
                        {imagem ? <span className="text-xs font-bold text-emerald-600 px-2 text-center truncate w-full">{imagem.name}</span> : <div className="flex flex-col items-center text-slate-400 group-hover:text-emerald-500"><Camera size={24} className="mb-2" /><span className="text-[9px] font-bold uppercase">Upload Imagem</span></div>}
                        <input type="file" className="hidden" accept="image/*" onChange={e => setImagem(e.target.files?.[0] || null)} />
                        </label>
                    </div>

                    <button disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-slate-200 hover:bg-emerald-600 hover:shadow-emerald-200 transition-all disabled:opacity-70 h-12 mt-auto">
                        {loading ? <Loader2 className="animate-spin" size={16} /> : editingId ? <CheckCircle size={16} /> : <Send size={16} />} 
                        {editingId ? "Salvar" : "Publicar"}
                    </button>
                </div>
            </div>
          </form>
        </section>
      )}

      {/* ÁREA 2: LISTA */}
      {activeTab === 'list' && (
        <section className="space-y-4 animate-in slide-in-from-right-4 duration-500">
          <div className="grid gap-3">
            {historico.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 border-dashed">
                  <BookOpen className="mx-auto text-slate-200 mb-4" size={48} />
                  <p className="text-slate-400 font-medium">Nenhum estudo publicado.</p>
              </div>
            ) : (
              historico.map((post) => (
                <div key={post.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 group hover:shadow-md transition-all">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
                      <img src={post.capa} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-1 inline-block border ${post.tipo === 'devocional' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>{post.tipo}</span>
                      <h4 className="font-bold text-slate-800 text-base leading-tight">{post.titulo}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-1"><BookOpen size={10}/> {post.livroRef} {post.capituloRef}:{post.versiculoRef}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 w-full md:w-auto">
                    <button 
                      onClick={() => handleCarregarEdicao(post)}
                      className="flex-1 md:flex-none py-2 px-4 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold uppercase hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit2 size={14} /> Editar
                    </button>
                    <button 
                      onClick={() => handleExcluir(post.id)}
                      className="flex-1 md:flex-none py-2 px-3 bg-white border border-rose-100 text-rose-500 rounded-lg hover:bg-rose-50 hover:border-rose-200 transition-colors flex items-center justify-center"
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