import { useState, useEffect } from "react";
import { db, auth, storage } from "../lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
// 1. IMPORTAMOS O deleteObject AQUI:
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { 
  Copy, Check, Wallet, Heart, Send, Loader2, ArrowLeft, Paperclip, 
  FileText, X, UserCheck, ShieldAlert, Coins, Hand 
} from "lucide-react";
import { notifyRoles, GROUPS } from "../lib/notificationService";

export default function Doacoes() {
  const [passo, setPasso] = useState<"form" | "sucesso">("form");
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [tipo, setTipo] = useState<"Dízimo" | "Oferta">("Oferta"); 
  const [nomeManual, setNomeManual] = useState(""); 
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [erroValidacao, setErroValidacao] = useState("");
  const [valorLido, setValorLido] = useState(0);

  const cnpjOficial = "33.206.513/0001-02";

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((loggedUser) => setUser(loggedUser));
    return () => unsub();
  }, []);

  const handleIdentificacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivo) return;

    setEnviando(true);
    setErroValidacao("");
    setProgresso(0);

    try {
      // 1. Upload para Firebase Storage
      const storageRef = ref(storage, `comprovantes/${Date.now()}_${arquivo.name}`);
      const uploadTask = uploadBytesResumable(storageRef, arquivo);

      const downloadUrl = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setProgresso(pct * 0.5); // 50% do progresso é o upload
          },
          (error) => reject(error),
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });

      setProgresso(60);

      // 2. Registro no Firestore
      const docRef = await addDoc(collection(db, "registros_financeiros_validados"), {
        doador: user ? (user.displayName || user.email) : (nomeManual || "Anônimo"),
        userId: user ? user.uid : "visitante",
        tipo: tipo, 
        status: "Processando...",
        comprovanteUrl: downloadUrl,
        data: serverTimestamp()
      });

      setProgresso(80);

      // 3. Chamada para o Backend Python
      const responseFunc = await fetch("http://127.0.0.1:8000/validar-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { downloadUrl, registroId: docRef.id }
        })
      });

      const resultado = await responseFunc.json();
      const dadosRetorno = resultado.data || resultado;

      // 4. VALIDAÇÃO E FAXINA (Se falhar, deleta o arquivo)
      if (!dadosRetorno.success) {
        // O Python já deletou o registro no Banco. Agora apagamos o PDF/Imagem do Storage.
        await deleteObject(storageRef).catch(e => console.error("Erro ao apagar arquivo do Storage:", e));
        
        throw new Error(dadosRetorno.message || "Dados do PIX não conferem. Arquivo rejeitado e deletado.");
      }

      setProgresso(100);
      setValorLido(dadosRetorno.valor);
      
      await notifyRoles(
        GROUPS.FINANCEIRO,
        `${tipo} Validado: R$ ${dadosRetorno.valor.toFixed(2)}`,
        `Processado para ${user?.displayName || nomeManual || 'Visitante'}.`,
        "financeiro",
        downloadUrl
      );

      setPasso("sucesso");

    } catch (error: any) {
      console.error("Erro capturado:", error);
      setErroValidacao(error instanceof Error ? error.message : "Falha na validação.");
      setProgresso(0);
    } finally {
      setEnviando(false);
    }
  };

  if (passo === "sucesso") {
    return (
      <div className="min-h-screen bg-blue-50/30 pt-32 md:pt-48 px-6 font-body flex flex-col items-center text-center">
          <div className="max-w-md w-full space-y-8 animate-in zoom-in">
            <h2 className="font-display text-5xl uppercase text-blue-900 leading-none">Validado!</h2>
            <div className="bg-white rounded-[2.5rem] p-10 space-y-6 shadow-xl relative text-left">
                <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-2xl text-[8px] font-black uppercase tracking-widest ${tipo === 'Dízimo' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {tipo}
                </div>
                <div className="flex justify-between border-b border-blue-50 pb-4">
                    <span className="text-[10px] uppercase font-black text-blue-300">Doador</span>
                    <span className="text-sm font-bold text-blue-900 uppercase truncate ml-4">{user ? (user.displayName || user.email) : (nomeManual || "Anônimo")}</span>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Valor identificado:</p>
                  <div className="text-4xl font-black text-blue-600">
                    {valorLido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </div>
                </div>
            </div>
            <button onClick={() => {setPasso("form"); setArquivo(null);}} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition-all">
                <ArrowLeft size={16} /> Nova Doação
            </button>
          </div>
      </div>
    );
  } 

  return (
    <div className="min-h-screen bg-blue-50/30 text-blue-900 font-body pt-32 md:pt-40 pb-20 text-left">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid lg:grid-cols-5 gap-8 items-stretch">
          <div className="lg:col-span-3 bg-white p-8 md:p-14 rounded-[3.5rem] border border-blue-100 shadow-xl space-y-8 relative overflow-hidden">
            <div className="flex items-center gap-4 relative z-10">
              <div className="bg-blue-50 p-4 rounded-2xl text-blue-600"><Wallet size={28} /></div>
              <h2 className="font-display text-5xl uppercase text-blue-900">PIX Oficial</h2>
            </div>
            <div className="bg-blue-50/30 border border-blue-100 p-6 rounded-[1.5rem] font-mono flex items-center justify-between text-blue-800 relative z-10">
              <span className="tracking-widest text-xl font-bold">{cnpjOficial}</span>
              <button onClick={() => {navigator.clipboard.writeText(cnpjOficial); setCopiado(true); setTimeout(()=>setCopiado(false), 2000)}} className="p-2 bg-white rounded-lg hover:text-blue-600 transition-colors">
                {copiado ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
              </button>
            </div>
            <div className="p-8 bg-blue-900 rounded-[2.5rem] flex items-start gap-5 shadow-2xl relative z-10">
              <Heart className="text-blue-400 shrink-0 fill-blue-400/20" size={24} />
              <p className="text-blue-100 text-xs md:text-sm leading-relaxed italic">Use o PIX acima para suas sementes na Fazenda Rio Grande.</p>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-8 md:p-12 rounded-[3.5rem] border border-blue-100 shadow-xl">
            <div className="space-y-8">
              <div className="space-y-1">
                <h3 className="font-display text-3xl md:text-4xl uppercase text-blue-900">Validar Pix</h3>
                <p className="text-blue-400 text-[9px] font-black uppercase tracking-widest">Escolha o tipo e anexe o comprovante</p>
              </div>

              <div className="bg-slate-100 p-1.5 rounded-2xl flex relative h-16 shadow-inner">
                <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-md transition-all ${tipo === 'Oferta' ? 'left-1.5' : 'left-[50%]'}`} />
                <button type="button" onClick={() => setTipo("Oferta")} className={`flex-1 flex items-center justify-center gap-2 z-10 text-[10px] font-black uppercase ${tipo === 'Oferta' ? 'text-blue-600' : 'text-slate-400'}`}>
                  <Coins size={14} /> Oferta
                </button>
                <button type="button" onClick={() => setTipo("Dízimo")} className={`flex-1 flex items-center justify-center gap-2 z-10 text-[10px] font-black uppercase ${tipo === 'Dízimo' ? 'text-blue-600' : 'text-slate-400'}`}>
                  <Hand size={14} /> Dízimo
                </button>
              </div>

              <form onSubmit={handleIdentificacao} className="space-y-5">
                {user ? (
                  <div className="w-full bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex items-center gap-3">
                    <UserCheck className="text-emerald-600" size={20} />
                    <div>
                      <p className="text-[8px] font-black uppercase text-emerald-400">Doador Identificado</p>
                      <p className="text-sm font-bold text-emerald-700 uppercase truncate">{user.displayName || user.email}</p>
                    </div>
                  </div>
                ) : (
                  <input type="text" value={nomeManual} onChange={(e) => setNomeManual(e.target.value)} placeholder="Seu nome (Opcional)" className="w-full bg-blue-50/30 border border-blue-100 p-5 rounded-2xl outline-none text-blue-900 font-bold uppercase text-xs" />
                )}

                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase text-blue-300 ml-2">Anexar Comprovante (PDF ou Imagem)</p>
                  {!arquivo ? (
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-blue-100 rounded-[2rem] cursor-pointer hover:bg-blue-50/50 bg-blue-50/20 group transition-all">
                      <Paperclip className="text-blue-200 mb-2 group-hover:text-blue-400" size={24} />
                      <p className="text-[10px] text-blue-300 font-black uppercase text-center">Ler Comprovante de {tipo}</p>
                      <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => setArquivo(e.target.files?.[0] || null)} />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between bg-blue-600 p-4 rounded-2xl text-white shadow-lg animate-in fade-in">
                      <div className="flex items-center gap-3">
                        <FileText size={20} /><span className="text-[10px] font-bold uppercase truncate max-w-[120px]">{arquivo.name}</span>
                      </div>
                      <button type="button" onClick={() => setArquivo(null)} className="bg-white/20 p-1.5 rounded-full"><X size={14} /></button>
                    </div>
                  )}
                </div>

                {enviando && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-blue-400">
                      <span>{progresso < 50 ? "Fazendo Upload..." : "Validando Comprovante..."}</span>
                      <span>{progresso}%</span>
                    </div>
                    <div className="w-full bg-blue-50 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${progresso}%` }} />
                    </div>
                  </div>
                )}

                {erroValidacao && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-bounce">
                    <ShieldAlert size={18} /><span className="text-[10px] font-black uppercase">{erroValidacao}</span>
                  </div>
                )}

                <button disabled={enviando || !arquivo} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-70 hover:bg-blue-700">
                  {enviando ? <><Loader2 className="animate-spin" size={18} /> Processando...</> : <><Send size={18} /> Confirmar {tipo}</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}