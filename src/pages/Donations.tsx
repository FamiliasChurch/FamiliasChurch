import { useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Copy, Check, Wallet, Heart, Send, Loader2, ShieldCheck, ArrowLeft, Paperclip, FileText, X } from "lucide-react";

export default function Doacoes() {
  const [passo, setPasso] = useState<"form" | "sucesso">("form");
  const [enviando, setEnviando] = useState(false);
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [copiado, setCopiado] = useState(false);

  // --- CONFIGURAÇÃO DO CLOUDINARY ---
  const CLOUD_NAME = "ddndbv7do"; 
  const UPLOAD_PRESET = "ddndbv7do"; 

  const cnpj = "00.000.000/0001-00";

  const handleIdentificacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !valor || !arquivo) return alert("O comprovante é obrigatório para identificação.");

    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append("file", arquivo);
      formData.append("upload_preset", UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Erro no upload");

      const downloadUrl = data.secure_url;

      await addDoc(collection(db, "registros_dizimos"), {
        nome,
        valor,
        comprovanteUrl: downloadUrl,
        tipo: "Dízimo",
        status: "Pendente Verificação",
        data: serverTimestamp()
      });
      
      setPasso("sucesso");
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar comprovante.");
    } finally {
      setEnviando(false);
    }
  };

  if (passo === "sucesso") {
    return (
      <div className="min-h-screen bg-blue-50/30 flex items-center justify-center p-6 animate-in fade-in duration-500 font-body">
        <div className="bg-white w-full max-w-md rounded-[3.5rem] border border-blue-100 shadow-2xl p-10 text-center space-y-8">
          <div className="flex justify-center">
            <div className="bg-blue-100 text-blue-600 p-6 rounded-full">
              <ShieldCheck size={48} />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-4xl uppercase tracking-tighter text-blue-900 leading-none">Recebido!</h2>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Semente Registrada com Sucesso</p>
          </div>
          <div className="bg-blue-50/50 rounded-[2.5rem] p-6 text-left space-y-4 border border-blue-100">
            <div className="flex justify-between border-b border-blue-100 pb-2">
              <span className="text-[10px] uppercase font-black text-blue-300">Doador</span>
              <span className="text-sm font-bold text-blue-900 truncate ml-4">{nome}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-[10px] uppercase font-black text-blue-300">Valor</span>
              <span className="text-sm font-bold text-blue-600">R$ {parseFloat(valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
            </div>
          </div>
          <button 
            onClick={() => { setPasso("form"); setNome(""); setValor(""); setArquivo(null); }}
            className="w-full bg-blue-600 text-white py-5 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20"
          >
            <ArrowLeft size={14} /> Voltar para doações
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50/30 text-blue-900 font-body pt-5 pb-20 selection:bg-blue-200">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-12 space-y-4">
          <h1 className="font-display text-9xl md:text-9xl uppercase tracking-tighter leading-none text-blue-900">
            CONTRI<span className="text-blue-500">BUA</span>
          </h1>
          <p className="text-blue-400 font-black uppercase tracking-[0.4em] text-[10px]">Participe da obra de Deus em nossa casa</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-stretch">
          {/* ÁREA PIX */}
          <div className="lg:col-span-3 bg-white p-10 md:p-14 rounded-[3.5rem] border border-blue-100 shadow-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 group-hover:scale-110 transition-transform duration-1000" />
            
            <div className="space-y-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-4 rounded-2xl text-blue-600"><Wallet size={28} /></div>
                <h2 className="font-display text-5xl uppercase tracking-tighter text-blue-900">PIX Oficial</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex-1 bg-blue-50/30 border border-blue-100 p-6 rounded-[2rem] font-mono text-xl md:text-2xl flex flex-col md:flex-row gap-4 items-center justify-between text-blue-800">
                  <span className="tracking-widest">{cnpj}</span>
                  <button onClick={() => {navigator.clipboard.writeText(cnpj); setCopiado(true); setTimeout(()=>setCopiado(false), 2000)}} className="p-3 bg-white rounded-xl shadow-sm hover:text-blue-600 transition-colors">
                    {copiado ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
                  </button>
                </div>
              </div>

              <div className="p-8 bg-blue-900 rounded-[2.5rem] flex items-start gap-5 shadow-2xl shadow-blue-900/20">
                <Heart className="text-blue-400 shrink-0 fill-blue-400/20" size={24} />
                <p className="text-blue-100 text-sm leading-relaxed italic">
                  Para <strong>Ofertas</strong>, não é necessário identificar. Use o PIX acima e sua semente será registrada como oferta voluntária anônima.
                </p>
              </div>
            </div>
          </div>

          {/* FORMULÁRIO */}
          <div className="lg:col-span-2 bg-white p-10 md:p-12 rounded-[3.5rem] border border-blue-100 shadow-xl relative overflow-hidden">
            <div className="space-y-8 relative z-10">
              <div className="space-y-1">
                <h3 className="font-display text-4xl uppercase tracking-tighter text-blue-900 leading-none">Identificar</h3>
                <p className="text-blue-400 text-[9px] font-black uppercase tracking-widest">Dízimos e Ofertas com Comprovante</p>
              </div>

              <form onSubmit={handleIdentificacao} className="space-y-5">
                <input 
                  type="text" value={nome} onChange={(e) => setNome(e.target.value)} 
                  placeholder="Seu nome completo" required
                  className="w-full bg-blue-50/30 border border-blue-100 p-5 rounded-2xl outline-none focus:border-blue-400 text-blue-900 placeholder:text-blue-300 transition-all font-bold uppercase text-xs tracking-wide"
                />
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-display text-blue-300 text-xl font-bold">R$</span>
                  <input 
                    type="number" value={valor} onChange={(e) => setValor(e.target.value)} 
                    placeholder="0,00" required
                    className="w-full bg-blue-50/30 border border-blue-100 p-5 pl-12 rounded-2xl outline-none focus:border-blue-400 text-blue-900 text-2xl font-black transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-blue-300 ml-2">Anexo obrigatório</p>
                  {!arquivo ? (
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-blue-100 rounded-[2rem] cursor-pointer hover:bg-blue-50/50 hover:border-blue-300 transition-all group bg-blue-50/20">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Paperclip className="text-blue-200 mb-2 group-hover:text-blue-400 transition-colors" size={24} />
                        <p className="text-[10px] text-blue-300 font-black uppercase tracking-widest">Anexar Comprovante</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => setArquivo(e.target.files?.[0] || null)} />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between bg-blue-600 p-4 rounded-2xl text-white shadow-lg">
                      <div className="flex items-center gap-3">
                        <FileText size={20} />
                        <span className="text-[10px] font-bold truncate max-w-[120px] uppercase">{arquivo.name}</span>
                      </div>
                      <button type="button" onClick={() => setArquivo(null)} className="bg-white/20 hover:bg-white/40 p-1.5 rounded-full transition-colors"><X size={14} /></button>
                    </div>
                  )}
                </div>

                <button 
                  disabled={enviando || !arquivo}
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 hover:scale-[1.02]"
                >
                  {enviando ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                  Confirmar Semente
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}