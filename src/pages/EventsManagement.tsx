import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { 
  collection, addDoc, query, orderBy, onSnapshot, 
  serverTimestamp, deleteDoc, doc, updateDoc 
} from "firebase/firestore";
import { 
  Calendar, Trash2, MapPin, Plus, Loader2, Image as ImageIcon, 
  Type, Layout, Sparkles, Camera, Tags, X, Edit3, Link2, Save
} from "lucide-react";
// Import do Modal
import { useConfirm } from "../context/ConfirmContext";

export default function EventsManagement({ userRole }: { userRole: string }) {
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Instância do Modal
  const { confirm } = useConfirm();

  // Estados do Formulário
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("Cultos");
  const [ministerio, setMinisterio] = useState("Geral");
  const [dataEvento, setDataEvento] = useState("");
  const [local, setLocal] = useState("Sede Fazenda Rio Grande");
  const [imagemCapa, setImagemCapa] = useState("");
  const [possuiInscricao, setPossuiInscricao] = useState(false);
  const [linkInscricao, setLinkInscricao] = useState("");

  const CLOUD_NAME = "ddndbv7do"; 
  const UPLOAD_PRESET = "ddndbv7do"; 
  const tiposEvento = ["Cultos", "Encontros com Deus", "Conferências", "Encontro de Casais"];
  const ministerios = ["Geral", "Déboras", "Jovens", "Teens", "Kids"];

  useEffect(() => {
    const q = query(collection(db, "agenda_eventos"), orderBy("dataReal", "asc"));
    return onSnapshot(q, (snap) => {
      setEventos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const handleFileUpload = async (file: File) => {
    setUploadingFile(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const data = await res.json();
      setImagemCapa(data.secure_url);
      return data.secure_url;
    } catch (err) { alert("Erro no upload"); return null; }
    finally { setUploadingFile(false); }
  };

  const limparCampos = () => {
    setTitulo(""); setDescricao(""); setImagemCapa(""); setEditingId(null);
    setPossuiInscricao(false); setLinkInscricao(""); setDataEvento("");
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const dados = {
      titulo, descricao, tipo, 
      ministerio: tipo === "Conferências" ? ministerio : "Geral",
      dataReal: new Date(dataEvento),
      local,
      capa: imagemCapa || "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073",
      possuiInscricao,
      linkInscricao: possuiInscricao ? linkInscricao : "",
      atualizado_em: serverTimestamp()
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "agenda_eventos", editingId), dados);
        await confirm({ title: "Evento Atualizado", message: "As informações foram salvas com sucesso.", variant: "success", confirmText: "Ok" });
      } else {
        await addDoc(collection(db, "agenda_eventos"), { ...dados, galeria: [], criado_em: serverTimestamp() });
        await confirm({ title: "Evento Criado", message: "O evento já está visível na agenda.", variant: "success", confirmText: "Ok" });
      }
      limparCampos();
    } catch (err) { 
        alert("Erro ao salvar."); // Erro técnico mantém alert simples
    } finally { 
        setLoading(false); 
    }
  };

  const handleDeleteEvent = async (id: string) => {
    // --- SUBSTITUIÇÃO DO DELETE DIRETO ---
    const confirmou = await confirm({
        title: "Excluir Evento?",
        message: "Tem certeza que deseja remover este evento da agenda? Isso não pode ser desfeito.",
        variant: "danger",
        confirmText: "Sim, Excluir",
        cancelText: "Cancelar"
    });

    if (confirmou) {
        try {
            await deleteDoc(doc(db, "agenda_eventos", id));
        } catch (e) {
            alert("Erro ao excluir.");
        }
    }
  };

  const prepararEdicao = (ev: any) => {
    setEditingId(ev.id);
    setTitulo(ev.titulo);
    setDescricao(ev.descricao);
    setTipo(ev.tipo);
    setMinisterio(ev.ministerio || "Geral");
    setLocal(ev.local);
    setImagemCapa(ev.capa);
    setPossuiInscricao(ev.possuiInscricao || false);
    setLinkInscricao(ev.linkInscricao || "");
    
    if (ev.dataReal?.toDate) {
      const d = ev.dataReal.toDate();
      const formatada = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setDataEvento(formatada);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!["Mídia", "Apóstolo", "Pastor", "Dev"].includes(userRole)) return <div className="h-screen flex items-center justify-center font-black text-red-600 uppercase">Acesso Negado</div>;

  return (
    <div className="min-h-screen bg-blue-50/30 pt-32 pb-20 px-6 font-body">
      <div className="container mx-auto max-w-6xl space-y-12">
        <h1 className="font-display text-7xl md:text-8xl text-blue-900 tracking-tighter uppercase text-center">
          {editingId ? "Editar" : "Gerenciar"} <span className="text-blue-500">Agenda</span>
        </h1>

        {/* FORMULÁRIO DINÂMICO */}
        <section className="bg-white p-10 rounded-[3.5rem] border border-blue-100 shadow-2xl relative">
          <form onSubmit={handleSaveEvent} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-blue-400 ml-2 flex items-center gap-2"><Type size={12}/> Título</label>
                <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full bg-blue-50/50 p-5 rounded-2xl border border-blue-100 outline-none focus:border-blue-500 text-blue-900" required />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-blue-400 ml-2 flex items-center gap-2"><Calendar size={12}/> Data e Hora</label>
                <input value={dataEvento} onChange={(e) => setDataEvento(e.target.value)} type="datetime-local" className="w-full bg-blue-50/50 p-5 rounded-2xl border border-blue-100 outline-none focus:border-blue-500 text-blue-900" required />
              </div>

              {/* UPLOAD DE CAPA DINÂMICO */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase text-blue-400 ml-2 flex items-center gap-2"><ImageIcon size={12}/> Capa do Evento</label>
                   <label className="flex flex-col items-center justify-center h-44 border-2 border-dashed border-blue-100 rounded-2xl cursor-pointer hover:bg-blue-50 transition-all overflow-hidden relative">
                      {imagemCapa ? (
                        <img src={imagemCapa} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-blue-300">
                           {uploadingFile ? <Loader2 className="animate-spin" /> : <Camera size={24} />}
                           <span className="text-[8px] font-black mt-2">SUBIR IMAGEM</span>
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                   </label>
                </div>

                <div className="md:col-span-2 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-blue-400 ml-2">Tipo</label>
                      <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full bg-blue-50/50 p-5 rounded-2xl border border-blue-100 font-bold">
                        {tiposEvento.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    {tipo === "Conferências" && (
                      <div className="space-y-2 animate-in slide-in-from-left">
                        <label className="text-[9px] font-black uppercase text-blue-600 ml-2">Ministério</label>
                        <select value={ministerio} onChange={(e) => setMinisterio(e.target.value)} className="w-full bg-blue-50 p-5 rounded-2xl border border-blue-200 font-bold">
                          {ministerios.filter(m => m !== "Geral").map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* SISTEMA DE INSCRIÇÃO */}
                  <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={possuiInscricao} onChange={(e) => setPossuiInscricao(e.target.checked)} className="w-5 h-5 accent-blue-600 rounded" />
                      <span className="text-[10px] font-black uppercase text-blue-900 tracking-widest">Inscrição Online?</span>
                    </label>
                    {possuiInscricao && (
                      <div className="flex items-center gap-2 animate-in zoom-in duration-300">
                        <Link2 size={16} className="text-blue-400" />
                        <input value={linkInscricao} onChange={(e) => setLinkInscricao(e.target.value)} placeholder="Cole o link (Google Forms, Sympla, etc)" className="flex-1 bg-white p-3 rounded-xl border border-blue-200 text-xs" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-blue-400 ml-2">Descrição Completa</label>
              <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full bg-blue-50/50 p-5 rounded-2xl border border-blue-100 outline-none focus:border-blue-500 h-32" />
            </div>

            <div className="flex gap-4">
              <button disabled={loading} type="submit" className="flex-1 bg-blue-600 text-white py-6 rounded-full font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-xl">
                {loading ? <Loader2 className="animate-spin" /> : editingId ? <Save size={18} /> : <Plus size={18} />}
                {editingId ? "SALVAR ALTERAÇÕES" : "PUBLICAR EVENTO"}
              </button>
              {editingId && (
                <button type="button" onClick={limparCampos} className="px-8 bg-slate-100 text-slate-400 rounded-full font-black uppercase text-[10px] hover:bg-red-50 hover:text-red-500 transition-all">CANCELAR</button>
              )}
            </div>
          </form>
        </section>

        {/* LISTAGEM PARA EDIÇÃO */}
        <div className="grid grid-cols-1 gap-6">
          {eventos.map(ev => (
            <div key={ev.id} className={`bg-white rounded-[3rem] border p-6 flex flex-col md:flex-row gap-6 items-center transition-all ${editingId === ev.id ? 'border-blue-500 ring-4 ring-blue-100 scale-[1.01]' : 'border-blue-100 shadow-sm'}`}>
              <img src={ev.capa} className="w-24 h-24 rounded-2xl object-cover shadow-md" />
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-1">
                  <span className="text-[8px] font-black uppercase bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{ev.tipo}</span>
                  {ev.possuiInscricao && <span className="text-[8px] font-black uppercase bg-green-50 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1"><Link2 size={8}/> Inscrições</span>}
                </div>
                <h3 className="text-xl font-bold text-blue-900 leading-tight">{ev.titulo}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{ev.dataReal?.toDate().toLocaleString('pt-BR')}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => prepararEdicao(ev)} className="p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={20}/></button>
                <button onClick={() => handleDeleteEvent(ev.id)} className="p-4 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={20}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}