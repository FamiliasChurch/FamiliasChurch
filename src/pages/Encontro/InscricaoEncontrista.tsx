import { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { db } from "../../lib/firebase"; 
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { 
  HeartPulse, User, CreditCard, Smartphone, ShieldAlert, Loader2, Clock, Plus, Trash2, X
} from "lucide-react";

export default function InscricaoEncontrista() {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [novoHorario, setNovoHorario] = useState("");
  const [listaHorarios, setListaHorarios] = useState<string[]>([]);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    senha: "",
    nome: "",
    cpf: "",
    dataNascimento: "",
    telefone: "",
    problemasSaude: [] as string[],
    descricaoOutros: "",
    remediosControlados: "",
    alergias: "",
    opcaoPagamento: "sinal",
  });

  const opcoesSaude = ["Diabetes", "Hipertensão", "Asma", "Epilepsia", "Alergia Alimentar", "Depressão/Ansiedade"];

  const adicionarHorario = () => {
    if (novoHorario && !listaHorarios.includes(novoHorario)) {
      setListaHorarios([...listaHorarios, novoHorario].sort());
      setNovoHorario("");
    }
  };

  const removerHorario = (h: string) => {
    setListaHorarios(listaHorarios.filter(item => item !== h));
  };

  const handleInscricao = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro("");

    try {
      const q = query(collection(db, "encontro_inscritos"), where("cpf", "==", formData.cpf));
      const snap = await getDocs(q);
      if (!snap.empty) throw new Error("Este CPF já possui uma inscrição ativa.");

      const tokenAcesso = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

      const docRef = await addDoc(collection(db, "encontro_inscritos"), {
        ...formData,
        horariosMedicacao: listaHorarios.join(", "), // Salva no formato que o painel lê
        tokenAcesso,
        confirmado: false,
        statusFinanceiro: "Aguardando Pagamento",
        valorPago: 0,
        dataInscricao: serverTimestamp(),
        historicoSaude: []
      });

      localStorage.setItem("sessao_encontro", JSON.stringify({
        id: docRef.id,
        nome: formData.nome,
        email: formData.email,
        tipo: "encontrista"
      }));

      navigate("/encontro/dashboard");
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pt-20 pb-32 px-6 font-body">
      <div className="max-w-4xl mx-auto space-y-10 text-left">
        <div className="text-center space-y-3">
          <h1 className="font-display text-6xl md:text-7xl font-bold text-blue-900 uppercase tracking-tighter leading-none">Vou ao <span className="text-blue-500">Encontro</span></h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">Famílias Church • Fazenda Rio Grande</p>
        </div>

        <form onSubmit={handleInscricao} className="bg-white rounded-[3.5rem] p-8 md:p-14 border border-slate-100 shadow-2xl space-y-12">
          
          <section className="p-8 bg-blue-50/30 rounded-[2.5rem] border border-blue-50 space-y-6">
            <div className="flex items-center gap-3">
              <ShieldAlert className="text-blue-600" size={20} />
              <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Acesso Exclusivo</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <input type="email" placeholder="E-mail para login" required className="bg-white p-4 rounded-xl border border-slate-100 text-sm outline-none focus:border-blue-400" onChange={e => setFormData({...formData, email: e.target.value})} />
              <input type="password" placeholder="Crie uma senha" required className="bg-white p-4 rounded-xl border border-slate-100 text-sm outline-none focus:border-blue-400" onChange={e => setFormData({...formData, senha: e.target.value})} />
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="flex items-center gap-3 font-bold text-slate-800 uppercase text-xs tracking-wider border-b border-slate-50 pb-4"><User size={18} className="text-blue-600" /> Identificação</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <input type="text" placeholder="Nome Completo" required className="bg-slate-50 p-4 rounded-xl border border-slate-100 outline-none text-sm font-bold" onChange={e => setFormData({...formData, nome: e.target.value})} />
              <input type="text" placeholder="CPF" required className="bg-slate-50 p-4 rounded-xl border border-slate-100 outline-none text-sm font-bold" onChange={e => setFormData({...formData, cpf: e.target.value})} />
              <input type="date" required className="bg-slate-50 p-4 rounded-xl border border-slate-100 outline-none text-sm font-bold" onChange={e => setFormData({...formData, dataNascimento: e.target.value})} />
              <input type="tel" placeholder="WhatsApp" required className="bg-slate-50 p-4 rounded-xl border border-slate-100 outline-none text-sm font-bold" onChange={e => setFormData({...formData, telefone: e.target.value})} />
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="flex items-center gap-3 font-bold text-slate-800 uppercase text-xs tracking-wider border-b border-slate-50 pb-4"><HeartPulse size={18} className="text-red-500" /> Ficha Médica</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {opcoesSaude.map(op => (
                <button type="button" key={op} onClick={() => setFormData(p => ({...p, problemasSaude: p.problemasSaude.includes(op) ? p.problemasSaude.filter(x => x !== op) : [...p.problemasSaude, op]}))} className={`p-3 rounded-xl border text-[9px] font-black uppercase transition-all ${formData.problemasSaude.includes(op) ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>{op}</button>
              ))}
            </div>
            
            <div className="space-y-4 pt-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={14}/> Horários de Medicação (Se houver)</label>
              <div className="flex gap-3">
                <input type="time" value={novoHorario} onChange={e => setNovoHorario(e.target.value)} className="bg-slate-50 p-4 rounded-xl border border-slate-100 outline-none text-sm font-bold flex-1" />
                <button type="button" onClick={adicionarHorario} className="bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition-all"><Plus size={20}/></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {listaHorarios.map(h => (
                  <span key={h} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-xs font-black flex items-center gap-2 border border-blue-100 italic">
                    {h} <button type="button" onClick={() => removerHorario(h)}><X size={14}/></button>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
               <textarea placeholder="Quais remédios você toma?" className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm outline-none" rows={2} onChange={e => setFormData({...formData, remediosControlados: e.target.value})} />
               <textarea placeholder="Alergias importantes..." className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm outline-none" rows={2} onChange={e => setFormData({...formData, alergias: e.target.value})} />
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="flex items-center gap-3 font-bold text-slate-800 uppercase text-xs tracking-wider border-b border-slate-50 pb-4"><CreditCard size={18} className="text-emerald-500" /> Garantia de Vaga</h3>
            <div className="grid md:grid-cols-2 gap-4">
               <button type="button" onClick={() => setFormData({...formData, opcaoPagamento: 'sinal'})} className={`p-6 rounded-3xl border-2 transition-all text-left ${formData.opcaoPagamento === 'sinal' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 bg-slate-50 opacity-60'}`}><span className="block font-black text-[10px] uppercase text-blue-600 tracking-widest">Pagar Sinal</span><span className="text-xs font-bold text-slate-400">Reserva de vaga imediata</span></button>
               <button type="button" onClick={() => setFormData({...formData, opcaoPagamento: 'total'})} className={`p-6 rounded-3xl border-2 transition-all text-left ${formData.opcaoPagamento === 'total' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 bg-slate-50 opacity-60'}`}><span className="block font-black text-[10px] uppercase text-blue-600 tracking-widest">Valor Integral</span><span className="text-xs font-bold text-slate-400">Quitação total</span></button>
            </div>
          </section>

          <button disabled={enviando} className="w-full bg-blue-600 text-white py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.01] transition-all flex items-center justify-center gap-3">
            {enviando ? <Loader2 className="animate-spin" /> : <Smartphone size={18} />} Finalizar Inscrição
          </button>
        </form>
      </div>
    </div>
  );
}