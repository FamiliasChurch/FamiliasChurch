import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { db } from "../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { 
  QrCode, ShieldCheck, ShieldAlert, HeartPulse, 
  DollarSign, User, XCircle, Loader2, Camera
} from "lucide-react";

export default function ValidadorQR() {
  const [resultado, setResultado] = useState<any>(null);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { 
      fps: 10, 
      qrbox: { width: 250, height: 250 } 
    }, false);

    scanner.render(onScanSuccess, onScanFailure);

    async function onScanSuccess(decodedText: string) {
      // Evita múltiplas buscas simultâneas
      if (buscando) return;
      
      setBuscando(true);
      setErro("");
      
      try {
        // Regra 2: Buscar pelo tokenAcesso gerado na inscrição
        const q = query(collection(db, "encontro_inscritos"), where("tokenAcesso", "==", decodedText));
        const snap = await getDocs(q);

        if (snap.empty) {
          setErro("Inscrição não encontrada ou QR Code inválido.");
          setResultado(null);
        } else {
          setResultado(snap.docs[0].data());
        }
      } catch (err) {
        setErro("Erro ao conectar com o banco de dados.");
      } finally {
        setBuscando(false);
      }
    }

    function onScanFailure(error: any) {
       // Silencioso
    }

    // Função de limpeza corrigida
    return () => {
      scanner.clear().catch(error => {
        console.error("Erro ao limpar o scanner:", error);
      });
    };
    
  }, [buscando]); // <--- O ERRO ESTAVA AQUI: Faltava fechar o useEffect antes do return do HTML

  return (
    <div className="min-h-screen bg-slate-900 text-white pt-24 pb-12 px-6 font-body">
      <div className="max-w-md mx-auto space-y-8">
        
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-600/20 rounded-2xl text-blue-400 mb-2">
            <QrCode size={32} />
          </div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tighter">Check-in <span className="text-blue-500">Retiro</span></h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Validação em Tempo Real</p>
        </div>

        {/* ÁREA DA CÂMERA */}
        <div className="relative overflow-hidden rounded-[2.5rem] border-2 border-slate-800 bg-slate-800/50 shadow-2xl">
          <div id="reader" className="w-full"></div>
          {buscando && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-10">
              <Loader2 className="animate-spin text-blue-500" size={40} />
            </div>
          )}
        </div>

        {/* RESULTADO DA VALIDAÇÃO (Regra 2) */}
        {resultado && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`p-8 rounded-[2.5rem] border-2 shadow-2xl space-y-6 ${resultado.confirmado ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
              
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-2xl font-display font-bold uppercase leading-none">{resultado.nome}</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status de Pagamento</p>
                </div>
                {resultado.confirmado ? (
                  <ShieldCheck size={32} className="text-emerald-500" />
                ) : (
                  <XCircle size={32} className="text-red-500" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 mb-1 text-blue-400">
                    <DollarSign size={14} />
                    <span className="text-[9px] font-black uppercase">Finanças</span>
                  </div>
                  <p className="text-xs font-bold">{resultado.statusFinanceiro}</p>
                </div>

                <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 mb-1 text-red-400">
                    <HeartPulse size={14} />
                    <span className="text-[9px] font-black uppercase">Saúde</span>
                  </div>
                  <p className="text-xs font-bold">
                    {resultado.problemasSaude?.length > 0 ? 'Atenção Médica' : 'Sem restrições'}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setResultado(null)}
                className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                Próximo Escaneamento
              </button>
            </div>
          </div>
        )}

        {erro && (
          <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-2xl flex items-center gap-3 text-red-200 animate-in shake duration-500">
            <ShieldAlert size={20} />
            <p className="text-xs font-bold uppercase tracking-tight">{erro}</p>
          </div>
        )}

      </div>
    </div>
  );
}