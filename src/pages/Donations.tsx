import { useState } from "react";
import { db, storage } from "../lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Copy, Check, QrCode, Heart, Wallet, User, DollarSign, Send, Loader2, ShieldCheck, ArrowLeft, Download, Paperclip, FileText, X } from "lucide-react";

export default function Doacoes() {
  const [passo, setPasso] = useState<"form" | "sucesso">("form");
  const [enviando, setEnviando] = useState(false);
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [copiado, setCopiado] = useState(false);

  const cnpj = "00.000.000/0001-00";

  const handleIdentificacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !valor || !arquivo) return alert("O comprovante é obrigatório para identificação.");

    setEnviando(true);
    try {
      // 1. Upload do arquivo para o Firebase Storage
      const storageRef = ref(storage, `comprovantes/${Date.now()}_${arquivo.name}`);
      const uploadTask = await uploadBytes(storageRef, arquivo);
      const downloadUrl = await getDownloadURL(uploadTask.ref);

      // 2. Salva no Firestore com a URL da imagem
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
      alert("Erro ao enviar. Verifique se o Firebase Storage está ativado.");
    } finally {
      setEnviando(false);
    }
  };

  if (passo === "sucesso") {
    return (
      <div className="min-h-screen bg-n-fundo flex items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="bg-white w-full max-w-md rounded-[3rem] border border-n-borda shadow-2xl p-10 text-center space-y-8">
          <div className="flex justify-center">
            <div className="bg-green-100 text-green-600 p-6 rounded-full">
              <ShieldCheck size={48} />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-4xl uppercase tracking-tighter text-n-texto">Recebido!</h2>
            <p className="text-n-suave text-[10px] font-black uppercase tracking-widest">Semente Registrada com Sucesso</p>
          </div>
          <div className="bg-n-fundo rounded-3xl p-6 text-left space-y-4 border border-n-borda/50">
            <div className="flex justify-between border-b border-n-borda/30 pb-2">
              <span className="text-[10px] uppercase font-black text-n-suave">Nome completo</span>
              <span className="text-sm font-bold text-n-texto truncate ml-4">{nome}</span>
            </div>
            <div className="flex justify-between border-b border-n-borda/30 pb-2">
              <span className="text-[10px] uppercase font-black text-n-suave">Valor</span>
              <span className="text-sm font-bold text-primaria">R$ {parseFloat(valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
            </div>
          </div>
          <button 
            onClick={() => { setPasso("form"); setNome(""); setValor(""); setArquivo(null); }}
            className="w-full bg-n-texto text-white py-4 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primaria transition-all"
          >
            <ArrowLeft size={14} /> Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-n-fundo text-n-texto font-body pt-32 pb-20">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16 space-y-4">
          <h1 className="font-display text-8xl md:text-[10rem] uppercase tracking-tighter leading-none">
            CONTRI<span className="text-primaria">BUA</span>
          </h1>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-stretch">
          {/* ÁREA PIX - */}
          <div className="lg:col-span-3 bg-white p-10 md:p-14 rounded-[3rem] border border-n-borda shadow-sm flex flex-col justify-between">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="bg-primaria/10 p-3 rounded-2xl text-primaria"><Wallet size={28} /></div>
                <h2 className="font-display text-5xl uppercase tracking-tighter">PIX Oficial</h2>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 bg-n-fundo border border-n-borda p-5 rounded-2xl font-mono text-xl flex items-center justify-between">
                    {cnpj}
                    <button onClick={() => {navigator.clipboard.writeText(cnpj); setCopiado(true); setTimeout(()=>setCopiado(false), 2000)}} className="text-n-suave hover:text-primaria transition-colors">
                      {copiado ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gray-50 rounded-2xl border border-n-borda flex items-start gap-4">
                <Heart className="text-primaria shrink-0" size={20} />
                <p className="text-n-suave text-xs italic">Para **Ofertas**, não é necessário identificar. Use o PIX e sua semente será anônima.</p>
              </div>
            </div>
          </div>

          {/* FORMULÁRIO COM UPLOAD OBRIGATÓRIO - */}
          <div className="lg:col-span-2 bg-white p-10 md:p-12 rounded-[3rem] border border-n-borda shadow-xl">
            <div className="space-y-8">
              <div className="space-y-1">
                <h3 className="font-display text-4xl uppercase tracking-tighter">Identificar</h3>
                <p className="text-n-suave text-[9px] font-black uppercase tracking-widest opacity-60">Dízimos(Obrigatório anexar comprovante)</p>
              </div>

              <form onSubmit={handleIdentificacao} className="space-y-5">
                <input 
                  type="text" value={nome} onChange={(e) => setNome(e.target.value)} 
                  placeholder="Nome completo" required
                  className="w-full bg-n-fundo border border-n-borda p-5 rounded-2xl outline-none focus:border-primaria text-sm"
                />
                <input 
                  type="number" value={valor} onChange={(e) => setValor(e.target.value)} 
                  placeholder="Valor (R$)" required
                  className="w-full bg-n-fundo border border-n-borda p-5 rounded-2xl outline-none focus:border-primaria font-bold text-lg"
                />

                {/* CAMPO DE UPLOAD ESTILIZADO */}
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-n-suave ml-1">Comprovante Bancário</p>
                  {!arquivo ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-n-borda rounded-2xl cursor-pointer hover:bg-gray-50 transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Paperclip className="text-n-suave mb-2" size={20} />
                        <p className="text-[10px] text-n-suave font-bold uppercase">Anexar Comprovante</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => setArquivo(e.target.files?.[0] || null)} />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between bg-primaria/5 border border-primaria/20 p-4 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <FileText className="text-primaria" size={20} />
                        <span className="text-[10px] font-bold text-n-texto truncate max-w-[150px]">{arquivo.name}</span>
                      </div>
                      <button type="button" onClick={() => setArquivo(null)} className="text-red-500 hover:bg-red-50 p-1 rounded-full"><X size={16} /></button>
                    </div>
                  )}
                </div>

                <button 
                  disabled={enviando || !arquivo}
                  className="w-full bg-primaria text-white py-5 rounded-full font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {enviando ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
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