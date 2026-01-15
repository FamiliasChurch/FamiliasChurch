import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, deleteDoc, doc, updateDoc
} from "firebase/firestore";
import {
  Calendar, Trash2, Plus, Loader2, Image as ImageIcon,
  Type, Edit3, Link2, Save, Camera, X, CheckCircle, AlertCircle, MapPin
} from "lucide-react";
import { useConfirm } from "../context/ConfirmContext";
import { notifyRoles, logNotificationBatch } from "../lib/notificationService";

export default function EventsManagement({ userRole }: { userRole: string }) {
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { confirm } = useConfirm();

  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'error' | 'success';
  }>({ show: false, message: "", type: 'success' });

  const showNotification = (message: string, type: 'error' | 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

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

  // --- PERMISSÕES V2 ---
  // Regra: Dev, Admin, Gerenciador e Mídia têm acesso total. 
  // Moderador NÃO tem acesso aqui (apenas Ministérios).
  const isAllowed = ["dev", "admin", "gerenciador", "midia", "mídia"].includes(userRole?.toLowerCase());

  useEffect(() => {
    if (!isAllowed) return;

    const q = query(collection(db, "agenda_eventos"), orderBy("dataReal", "asc"));
    return onSnapshot(q, (snap) => {
      setEventos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [isAllowed]);

  const handleFileUpload = async (file: File) => {
    setUploadingFile(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const data = await res.json();
      setImagemCapa(data.secure_url);
      showNotification("Imagem carregada com sucesso!", "success");
    } catch (err) {
      showNotification("Erro ao fazer upload da imagem.", "error");
    } finally {
      setUploadingFile(false);
    }
  };

  const limparCampos = () => {
    setTitulo(""); setDescricao(""); setImagemCapa(""); setEditingId(null);
    setPossuiInscricao(false); setLinkInscricao(""); setDataEvento("");
    setTipo("Cultos"); setMinisterio("Geral");
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowed) return;
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

        // 1. Notificar Membros
        await notifyRoles(
          ["Membro", "Obreiro", "Diácono", "Presbítero", "Evangelista", "Pastor", "Apóstolo", "Secretaria", "Mídia", "Dev", "Congregado", "Servo"],
          `Novo Evento: ${titulo}`,
          `Não perca! ${tipo} marcado para ${new Date(dataEvento).toLocaleDateString('pt-BR')}.`,
          "evento",
          "/eventos"
        );

        // 2. Gravar Log
        await logNotificationBatch(
          "Novo Evento Criado",
          1,
          "Sucesso"
        );

        await confirm({ title: "Evento Criado", message: "O evento já está visível na agenda e a notificação foi enviada.", variant: "success", confirmText: "Ok" });
      }
      limparCampos();
    } catch (err) {
      console.error(err);
      showNotification("Erro ao salvar o evento. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!isAllowed) return;
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
        showNotification("Evento excluído.", "success");
      } catch (e) {
        showNotification("Erro ao excluir evento.", "error");
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
      const offset = d.getTimezoneOffset() * 60000;
      const localTime = new Date(d.getTime() - offset);
      const formatada = localTime.toISOString().slice(0, 16);
      setDataEvento(formatada);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // BLOQUEIO DE SEGURANÇA VISUAL
  if (!isAllowed) return <div className="h-full flex flex-col items-center justify-center font-bold text-slate-400 uppercase tracking-widest"><AlertCircle size={48} className="mb-4 text-slate-300"/>Acesso Restrito à Gestão de Agenda</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 mt-6 animate-in fade-in duration-500 font-sans">

      {/* Toast Notification */}
      <div className={`fixed top-5 right-5 z-50 transform transition-all duration-500 ease-out ${notification.show ? "translate-x-0 opacity-100" : "translate-x-20 opacity-0 pointer-events-none"}`}>
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border backdrop-blur-sm ${notification.type === 'error' ? "bg-white/95 border-red-100 text-red-600" : "bg-white/95 border-emerald-100 text-emerald-600"}`}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <div className="flex flex-col">
            <span className="font-bold text-xs uppercase tracking-wide">{notification.type === 'error' ? 'Atenção' : 'Sucesso'}</span>
            <span className="text-slate-600 text-xs">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(prev => ({ ...prev, show: false }))} className="ml-4 text-slate-400 hover:text-slate-600"><X size={14} /></button>
        </div>
      </div>

      {/* Cabecalho */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Calendar size={24} /></div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">{editingId ? "Editando Evento" : "Gerenciar Agenda"}</h2>
          <p className="text-sm text-slate-500 font-medium">Criação e edição de cultos e eventos da igreja</p>
        </div>
      </div>

      {/* Formulário */}
      <section className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm relative animate-in slide-in-from-left-4 duration-500">
        <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
          <h3 className="text-base font-bold text-slate-700 flex items-center gap-2">
            {editingId ? <><Edit3 size={18} className="text-blue-500" /> Detalhes do Evento</> : <><Plus size={18} className="text-blue-500" /> Novo Evento</>}
          </h3>
          {editingId && (<button onClick={limparCampos} className="text-xs font-bold text-red-400 hover:text-red-600 uppercase flex items-center gap-1"><X size={14} /> Cancelar Edição</button>)}
        </div>

        <form onSubmit={handleSaveEvent} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 flex items-center gap-1"><Type size={12} /> Título</label>
              <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 text-slate-800 font-semibold transition-all" required placeholder="Ex: Culto de Celebração" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 flex items-center gap-1"><Calendar size={12} /> Data e Hora</label>
              <input value={dataEvento} onChange={(e) => setDataEvento(e.target.value)} type="datetime-local" className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 text-slate-600 font-medium transition-all" required />
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 flex items-center gap-1"><ImageIcon size={12} /> Capa</label>
                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-blue-200 transition-all overflow-hidden relative group bg-slate-50/50">
                  {imagemCapa ? <img src={imagemCapa} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center text-slate-400 group-hover:text-blue-500 transition-colors">{uploadingFile ? <Loader2 className="animate-spin" /> : <Camera size={24} />}<span className="text-[10px] font-bold mt-2 uppercase">Selecionar Imagem</span></div>}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                </label>
              </div>
              <div className="md:col-span-2 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Tipo</label>
                    <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-50">{tiposEvento.map(t => <option key={t} value={t}>{t}</option>)}</select>
                  </div>
                  {tipo === "Conferências" && (<div className="space-y-1 animate-in slide-in-from-left"><label className="text-xs font-bold text-blue-600 uppercase tracking-wide ml-1">Ministério</label><select value={ministerio} onChange={(e) => setMinisterio(e.target.value)} className="w-full bg-white p-3 rounded-xl border border-blue-200 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-50">{ministerios.filter(m => m !== "Geral").map(m => <option key={m} value={m}>{m}</option>)}</select></div>)}
                  <div className="col-span-2 space-y-1"><label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 flex items-center gap-1"><MapPin size={12} /> Local</label><input value={local} onChange={(e) => setLocal(e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 text-slate-600 font-medium transition-all" /></div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer select-none group"><div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${possuiInscricao ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>{possuiInscricao && <CheckCircle size={14} className="text-white" />}</div><input type="checkbox" checked={possuiInscricao} onChange={(e) => setPossuiInscricao(e.target.checked)} className="hidden" /><span className="text-xs font-bold uppercase text-slate-600 group-hover:text-blue-600 transition-colors">Habilitar Inscrição Online</span></label>
                  {possuiInscricao && (<div className="flex items-center gap-2 animate-in slide-in-from-top-2 duration-300"><Link2 size={16} className="text-slate-400" /><input value={linkInscricao} onChange={(e) => setLinkInscricao(e.target.value)} placeholder="Cole o link aqui (ex: Google Forms, Sympla)" className="flex-1 bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-700 outline-none focus:border-blue-400" /></div>)}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Descrição</label>
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-50 h-32 text-slate-600 text-sm leading-relaxed resize-none transition-all" placeholder="Detalhes sobre o evento..." />
          </div>

          <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-70 h-12">
            {loading ? <Loader2 className="animate-spin" size={18} /> : editingId ? <Save size={18} /> : <Plus size={18} />}
            {editingId ? "Salvar Alterações" : "Publicar Evento"}
          </button>
        </form>
      </section>

      {/* Lista de Eventos */}
      <div className="grid grid-cols-1 gap-3">
        {eventos.map(ev => (
          <div key={ev.id} className={`bg-white rounded-2xl border p-4 flex flex-col md:flex-row gap-4 items-center transition-all duration-200 group ${editingId === ev.id ? 'border-blue-300 ring-2 ring-blue-50' : 'border-slate-100 shadow-sm hover:shadow-md'}`}>
            <div className="w-full md:w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 flex-shrink-0"><img src={ev.capa} className="w-full h-full object-cover" /></div>
            <div className="flex-1 text-center md:text-left w-full">
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-1"><span className="text-[9px] font-bold uppercase bg-slate-50 text-slate-600 border border-slate-100 px-2 py-0.5 rounded-md tracking-wider">{ev.tipo}</span>{ev.possuiInscricao && <span className="text-[9px] font-bold uppercase bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-md flex items-center gap-1 tracking-wider"><Link2 size={8} /> Inscrições</span>}</div>
              <h3 className="text-base font-bold text-slate-800 leading-tight">{ev.titulo}</h3>
              <div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-1"><p className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-center md:justify-start gap-1"><Calendar size={10} /> {ev.dataReal?.toDate().toLocaleDateString('pt-BR')}</p><p className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-center md:justify-start gap-1"><MapPin size={10} /> {ev.local}</p></div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button onClick={() => prepararEdicao(ev)} className="flex-1 md:flex-none py-2 px-4 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold uppercase hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors flex items-center justify-center gap-2"><Edit3 size={14} /> Editar</button>
              <button onClick={() => handleDeleteEvent(ev.id)} className="flex-1 md:flex-none py-2 px-3 bg-white border border-rose-100 text-rose-500 rounded-lg hover:bg-rose-50 hover:border-rose-200 transition-colors flex items-center justify-center"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
        {eventos.length === 0 && (<div className="text-center py-10 text-slate-400 bg-white rounded-2xl border border-slate-100 border-dashed"><Calendar className="mx-auto mb-2 opacity-50" size={32} /><p className="text-sm">Nenhum evento agendado.</p></div>)}
      </div>
    </div>
  );
}