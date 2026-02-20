import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react"; 
import { 
  HeartPulse, DollarSign, LogOut, 
  CheckCircle2, AlertCircle, Loader2, CreditCard, ExternalLink, MapPin, 
  Pill, ShieldCheck, MessageCircle, CalendarCheck2, ChevronRight, Check
} from "lucide-react";

export default function DashboardEncontrista() {
  const [dados, setDados] = useState<any>(null);
  const [gerandoPagamento, setGerandoPagamento] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const sessao = localStorage.getItem("sessao_encontro");
    if (!sessao) {
      navigate("/encontro/login");
      return;
    }

    const { id, tipo } = JSON.parse(sessao);
    const colecao = tipo === "encontrista" ? "encontro_inscritos" : "encontro_servos";

    const unsub = onSnapshot(doc(db, colecao, id), (doc) => {
      if (doc.exists()) {
        setDados({ id: doc.id, ...doc.data() });
      } else {
        localStorage.removeItem("sessao_encontro");
        navigate("/encontro/login");
      }
    });

    return () => unsub();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("sessao_encontro");
    navigate("/");
  };

  const iniciarPagamento = async () => {
    setGerandoPagamento(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert("Redirecionando para o Checkout Seguro...");
    } catch (error) {
      alert("Erro ao gerar pagamento.");
    } finally {
      setGerandoPagamento(false);
    }
  };

  if (!dados) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  // Lógica para renderizar as 3 parcelas da "assinatura"
  const totalParcelas = dados.totalParcelas || 3;
  const parcelasPagas = dados.parcelasPagas || 0;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20 px-6 font-body text-left">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* CABEÇALHO */}
        <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-200 uppercase">
              {dados.nome?.charAt(0)}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Encontrista</p>
              <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tighter uppercase leading-none">{dados.nome?.split(" ")[0]}</h1>
            </div>
          </div>
          <button onClick={handleLogout} className="p-4 text-slate-300 hover:text-red-500 transition-all bg-slate-50 rounded-2xl hover:bg-red-50">
            <LogOut size={22} />
          </button>
        </div>

        {/* STATUS FINANCEIRO / QR CODE */}
        <section className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl relative overflow-hidden text-center">
          <div className={`absolute top-0 left-0 w-full h-3 ${dados.confirmado ? 'bg-emerald-500' : 'bg-orange-500'}`} />
          
          <div className="p-10 md:p-14 space-y-10">
            <div className="space-y-2">
              <h2 className="font-display text-4xl font-bold uppercase tracking-tighter text-slate-900 leading-none">
                {dados.confirmado ? "Meu Crachá" : "Aguardando"}
              </h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
                {dados.confirmado ? "Acesso liberado" : "Regularize sua inscrição"}
              </p>
            </div>

            {dados.confirmado ? (
              <div className="animate-in fade-in zoom-in duration-700 space-y-10">
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-blue-600 blur-3xl opacity-10 rounded-full" />
                    <div className="relative flex justify-center p-10 bg-white rounded-[3.5rem] border-4 border-slate-50 shadow-inner mx-auto w-fit">
                        <QRCodeSVG value={dados.tokenAcesso} size={200} />
                    </div>
                </div>
                <div className="flex justify-center gap-3">
                   <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase border border-emerald-100 shadow-sm"><ShieldCheck size={18}/> Inscrição Ativa</div>
                   {dados.chegouNoLocal && <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase shadow-lg animate-pulse"><CheckCircle2 size={18}/> Presente</div>}
                </div>
              </div>
            ) : (
              <button 
                onClick={iniciarPagamento}
                disabled={gerandoPagamento}
                className="w-full bg-blue-600 text-white py-8 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl shadow-blue-600/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {gerandoPagamento ? <Loader2 className="animate-spin" size={24} /> : <><CreditCard size={24} /> Pagar Mensalidade</>}
              </button>
            )}
          </div>
        </section>

        {/* --- NOVA SEÇÃO: HISTÓRICO DE MENSALIDADES (ASSINATURA) --- */}
        <section className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-900">
                    <div className="p-2 bg-slate-900 text-white rounded-xl shadow-md"><CalendarCheck2 size={20} /></div>
                    <span className="text-xs font-black uppercase tracking-widest">Cronograma Financeiro</span>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Progresso</p>
                    <p className="text-sm font-bold text-blue-600 leading-none mt-1">{parcelasPagas} de {totalParcelas}</p>
                </div>
            </div>

            <div className="space-y-3">
                {Array.from({ length: totalParcelas }).map((_, idx) => {
                    const numero = idx + 1;
                    const estaPaga = numero <= parcelasPagas;
                    const eAProxima = numero === parcelasPagas + 1;

                    return (
                        <div key={idx} className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${estaPaga ? 'bg-emerald-50/50 border-emerald-100' : (eAProxima ? 'bg-white border-blue-200 shadow-md ring-1 ring-blue-100' : 'bg-slate-50/50 border-slate-100 opacity-60')}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${estaPaga ? 'bg-emerald-500 text-white' : (eAProxima ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400')}`}>
                                    0{numero}
                                </div>
                                <div>
                                    <p className={`text-xs font-bold uppercase ${estaPaga ? 'text-emerald-700' : (eAProxima ? 'text-blue-900' : 'text-slate-400')}`}>Mensalidade {numero}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Vencimento Estimado</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {estaPaga ? (
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                        <Check size={10}/> Quitado
                                    </span>
                                ) : (
                                    eAProxima ? (
                                        <button onClick={iniciarPagamento} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-blue-700">
                                            Pagar <ChevronRight size={10}/>
                                        </button>
                                    ) : (
                                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic">Aguardando</span>
                                    )
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>

        {/* INFO SAÚDE E PLANO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-lg space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-2 bg-red-50 rounded-xl"><HeartPulse size={20} /></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Saúde Ativa</span>
            </div>
            {dados.horariosMedicacao ? (
                <div className="flex flex-wrap gap-2">
                    {dados.horariosMedicacao.split(",").map((h: string) => (
                        <span key={h} className="px-3 py-1 bg-slate-50 text-slate-600 border border-slate-100 rounded-lg text-[9px] font-black italic">{h.trim()}</span>
                    ))}
                </div>
            ) : <p className="text-xs font-bold text-slate-700">Sem observações.</p>}
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-lg space-y-4 flex flex-col justify-between">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="p-2 bg-emerald-50 rounded-xl"><DollarSign size={20} /></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Minha Inscrição</span>
            </div>
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                {dados.opcaoPagamento === 'total' ? 'Valor Integral' : 'Plano de Reserva (Sinal)'}
            </h4>
          </div>
        </div>

        <a 
          href={`https://wa.me/5541987481002?text=Olá, sou o ${dados.nome} e tenho uma dúvida`}
          target="_blank" rel="noreferrer"
          className="w-full bg-slate-900 text-white py-7 rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-4 hover:bg-blue-600 transition-all group"
        >
          <MessageCircle size={20} className="group-hover:animate-bounce"/> Fale com a Organização
        </a>

      </div>
    </div>
  );
}