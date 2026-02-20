import { useState } from "react";
import { db } from "../../lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { HeartPulse, Pill, UserCheck, Mail, Lock, Loader2, CheckCircle2, Clock, Plus, X } from "lucide-react";

export default function InscricaoServo() {
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [novoHorario, setNovoHorario] = useState("");
  const [listaHorarios, setListaHorarios] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    email: "",
    senha: "",
    nome: "",
    cpf: "",
    primeiraVez: false,
    jaFezEncontro: false,
    problemasSaude: [] as string[],
    outroProblema: "",
    remediosControlados: "",
  });

  const problemasOpcoes = ["Diabetes", "Hipertensão", "Asma", "Alergia Alimentar", "Problemas Cardíacos"];

  const toggleProblema = (prob: string) => {
    setFormData(p => ({...p, problemasSaude: p.problemasSaude.includes(prob) ? p.problemasSaude.filter(x => x !== prob) : [...p.problemasSaude, prob]}));
  };

  const adicionarHorario = () => {
    if (novoHorario && !listaHorarios.includes(novoHorario)) {
      setListaHorarios([...listaHorarios, novoHorario].sort());
      setNovoHorario("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await addDoc(collection(db, "encontro_servos"), {
        ...formData,
        horariosMedicacao: listaHorarios.join(", "),
        status: "Pendente",
        tipo: "Servo",
        dataInscricao: serverTimestamp(),
        historicoSaude: []
      });
      setSucesso(true);
    } catch (error) {
      alert("Erro ao salvar inscrição.");
    } finally {
      setEnviando(false);
    }
  };

  if (sucesso) return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 min-h-[60vh]">
      <CheckCircle2 size={80} className="text-emerald-500" />
      <h2 className="font-display text-3xl font-bold text-slate-800">Ficha de Servo Enviada!</h2>
      <p className="text-slate-500 max-w-xs uppercase text-[10px] font-bold tracking-widest">Aguarde o contato da coordenação da Famílias Church.</p>
      <button onClick={() => setSucesso(false)} className="text-blue-600 font-black uppercase text-xs tracking-widest pt-6 border-t border-slate-100">Fazer nova inscrição</button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 pb-20 text-left">
      <div className="text-center space-y-2">
        <h2 className="font-display text-4xl font-bold text-blue-900 uppercase tracking-tighter">Ficha de Servo</h2>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Encontro 2026 • Fazenda Rio Grande</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-xl space-y-12">
        
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4"><Mail className="text-blue-600" size={20} /><h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Acesso ao Painel</h3></div>
          <div className="grid md:grid-cols-2 gap-4">
            <input type="email" placeholder="E-mail" required className="bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none text-sm" onChange={e => setFormData({...formData, email: e.target.value})} />
            <input type="password" placeholder="Senha" required className="bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none text-sm" onChange={e => setFormData({...formData, senha: e.target.value})} />
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4"><HeartPulse className="text-red-500" size={20} /><h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Informações Médicas</h3></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {problemasOpcoes.map(prob => (
              <button key={prob} type="button" onClick={() => toggleProblema(prob)} className={`p-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${formData.problemasSaude.includes(prob) ? "bg-red-50 border-red-200 text-red-700" : "bg-slate-50 border-slate-100 text-slate-500"}`}>{prob}</button>
            ))}
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={14}/> Agendar Horários de Medicação</label>
            <div className="flex gap-3">
              <input type="time" value={novoHorario} onChange={e => setNovoHorario(e.target.value)} className="bg-slate-50 p-4 rounded-xl border border-slate-100 outline-none text-sm font-bold flex-1" />
              <button type="button" onClick={adicionarHorario} className="bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition-all"><Plus size={20}/></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {listaHorarios.map(h => (
                <span key={h} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 border border-slate-800 italic">
                  {h} <button type="button" onClick={() => setListaHorarios(listaHorarios.filter(x => x !== h))}><X size={14}/></button>
                </span>
              ))}
            </div>
          </div>

          <input type="text" placeholder="Nome do(s) remédio(s)" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none text-sm font-bold" onChange={e => setFormData({...formData, remediosControlados: e.target.value})} />
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4"><UserCheck className="text-emerald-600" size={20} /><h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Experiência</h3></div>
          <div className="flex flex-col md:flex-row gap-4">
            <label className="flex-1 flex items-center justify-between p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-emerald-50"><span className="text-xs font-bold text-slate-600">Primeira vez servindo?</span><input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-emerald-600" onChange={e => setFormData({...formData, primeiraVez: e.target.checked})} /></label>
            <label className="flex-1 flex items-center justify-between p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-blue-50"><span className="text-xs font-bold text-slate-600">Já passou pelo encontro?</span><input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600" onChange={e => setFormData({...formData, jaFezEncontro: e.target.checked})} /></label>
          </div>
        </section>

        <button disabled={enviando} className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
          {enviando ? <Loader2 className="animate-spin" /> : "Finalizar Cadastro de Servo"}
        </button>
      </form>
    </div>
  );
}