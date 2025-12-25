import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, addDoc, orderBy, serverTimestamp } from "firebase/firestore";
import { Clock, CheckCircle, Shield, Mail } from "lucide-react";

// Interface para garantir a tipagem correta no TypeScript
interface Servo {
  id: string;
  nome: string;
  email: string;
}

export default function VolunteerScales({ userRole }: { userRole: string }) {
  const [servosDisponiveis, setServosDisponiveis] = useState<Servo[]>([]);
  const [ministerios, setMinisterios] = useState<any[]>([]);
  const [escalas, setEscalas] = useState<any[]>([]);
  
  const [dataCulto, setDataCulto] = useState("");
  const [minId] = useState("");
  // Agora guardamos o objeto completo do servo selecionado
  const [servosSelecionados, setServosSelecionados] = useState<Servo[]>([]);

  const podeGerenciar = ["Mídia", "Apóstolo", "Dev"].includes(userRole);

  useEffect(() => {
    // Busca os dados completos dos servos (incluindo e-mail)
    const unsubServos = onSnapshot(collection(db, "usuarios"), (snap) => {
      setServosDisponiveis(snap.docs.map(d => ({ id: d.id, ...d.data() } as Servo)));
    });

    const unsubMin = onSnapshot(collection(db, "ministerios_info"), (snap) => {
      setMinisterios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const q = query(collection(db, "escalas_servos"), orderBy("dataCulto", "asc"));
    const unsubEscalas = onSnapshot(q, (snap) => {
      setEscalas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubServos(); unsubMin(); unsubEscalas(); };
  }, []);

  const salvarEscala = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataCulto || !minId || servosSelecionados.length === 0) return;

    // Salvamos a lista de nomes e a lista de e-mails para a Netlify Function
    await addDoc(collection(db, "escalas_servos"), {
      dataCulto,
      ministerio: ministerios.find(m => m.id === minId)?.titulo,
      servosNomes: servosSelecionados.map(s => s.nome),
      servosEmails: servosSelecionados.map(s => s.email), // Campo crucial para a notificação
      criadoEm: serverTimestamp()
    });

    setServosSelecionados([]);
    alert("Escala publicada! Os servos receberão o lembrete 24h antes.");
  };

  const toggleServo = (servo: Servo) => {
    setServosSelecionados(prev => 
      prev.find(s => s.id === servo.id) 
        ? prev.filter(s => s.id !== servo.id) 
        : [...prev, servo]
    );
  };

  return (
    <div className="min-h-screen bg-background text-white p-6 pt-32 font-body">
      <div className="container mx-auto space-y-16">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-10">
          <div className="space-y-2">
            <h1 className="font-display text-7xl md:text-8xl tracking-tighter text-gradient uppercase leading-none">Escalas</h1>
            <p className="text-white/40 uppercase tracking-[0.4em] text-[10px] font-bold">Automação de Notificações Ativa</p>
          </div>
          <div className="glass px-6 py-4 rounded-full flex items-center gap-4">
            <Shield className="text-destaque" size={20} />
            <p className="text-[10px] font-black uppercase tracking-widest">Painel {userRole}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* FORMULÁRIO */}
          {podeGerenciar && (
            <div className="lg:col-span-1">
              <div className="glass p-10 rounded-[3.5rem] border border-destaque/20 sticky top-32">
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                  <Mail className="text-destaque" /> Escala Inteligente
                </h2>
                
                <form onSubmit={salvarEscala} className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-bold text-white/30 ml-2">Data do Culto</p>
                    <input type="date" value={dataCulto} onChange={e => setDataCulto(e.target.value)}
                      className="glass w-full p-4 rounded-2xl outline-none focus:border-destaque/50" />
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-bold text-white/30 ml-2">Selecionar Servos ({servosSelecionados.length})</p>
                    <div className="glass p-4 rounded-2xl max-h-60 overflow-y-auto space-y-2">
                      {servosDisponiveis.map(s => (
                        <div key={s.id} onClick={() => toggleServo(s)}
                          className={`p-3 rounded-xl cursor-pointer transition-all flex justify-between items-center ${
                            servosSelecionados.find(sel => sel.id === s.id) ? 'bg-destaque text-primaria' : 'hover:bg-white/5 text-white/40'
                          }`}>
                          <div>
                            <p className="text-[10px] font-black uppercase">{s.nome}</p>
                            <p className="text-[8px] opacity-70 italic">{s.email}</p>
                          </div>
                          {servosSelecionados.find(sel => sel.id === s.id) && <CheckCircle size={14} />}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button className="w-full bg-white text-primaria py-5 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-glow">
                    Publicar e Agendar Avisos
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* LISTAGEM */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-4">
              <Clock className="text-destaque" /> Escalas Confirmadas
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {escalas.map(escala => (
                <div key={escala.id} className="glass p-8 rounded-[3rem] border border-white/5 group">
                  <div className="flex justify-between mb-6">
                    <div className="bg-destaque/10 px-4 py-2 rounded-2xl">
                      <p className="text-[10px] font-black text-destaque uppercase">{new Date(escala.dataCulto).toLocaleDateString('pt-BR', { weekday: 'long' })}</p>
                      <p className="text-xl font-black">{new Date(escala.dataCulto).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-2xl font-bold uppercase tracking-tighter text-gradient">{escala.ministerio}</h4>
                    <div className="flex flex-wrap gap-2">
                      {escala.servosNomes?.map((nome: string, idx: number) => (
                        <div key={idx} className="bg-white/5 px-3 py-2 rounded-full border border-white/5 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-destaque" />
                          <span className="text-[9px] font-bold uppercase text-white/60">{nome}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}