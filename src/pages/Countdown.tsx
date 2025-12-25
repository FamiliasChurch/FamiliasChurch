import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";
import {  Star } from "lucide-react";

export default function EventCountdown() {
  const [proximoEvento, setProximoEvento] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState({
    dias: 0, horas: 0, minutos: 0, segundos: 0
  });

  useEffect(() => {
    // Busca apenas o próximo evento que ainda não aconteceu
    const hoje = new Date();
    const q = query(
      collection(db, "eventos"),
      where("data", ">=", hoje),
      orderBy("data", "asc"),
      limit(1)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setProximoEvento({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!proximoEvento) return;

    const timer = setInterval(() => {
      const dataEvento = proximoEvento.data?.toDate().getTime();
      const agora = new Date().getTime();
      const diferenca = dataEvento - agora;

      if (diferenca > 0) {
        setTimeLeft({
          dias: Math.floor(diferenca / (1000 * 60 * 60 * 24)),
          horas: Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutos: Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60)),
          segundos: Math.floor((diferenca % (1000 * 60)) / 1000),
        });
      } else {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [proximoEvento]);

  if (!proximoEvento) return null;

  return (
    <section className="py-20 flex justify-center">
      <div className="glass p-12 rounded-[4rem] border border-destaque/20 max-w-5xl w-full relative overflow-hidden shadow-glow">
        
        {/* Elementos Decorativos */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-destaque/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-destaque/5 rounded-full blur-3xl" />

        <div className="relative z-10 text-center space-y-10">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 text-destaque">
              <Star size={16} className="animate-spin-slow" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em]">Próximo Grande Momento</span>
              <Star size={16} className="animate-spin-slow" />
            </div>
            <h2 className="font-display text-6xl md:text-8xl tracking-tighter leading-none uppercase">
              {proximoEvento.titulo}
            </h2>
          </div>

          {/* CONTADOR */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <TimeUnit value={timeLeft.dias} label="Dias" />
            <TimeUnit value={timeLeft.horas} label="Horas" />
            <TimeUnit value={timeLeft.minutos} label="Minutos" />
            <TimeUnit value={timeLeft.segundos} label="Segundos" />
          </div>

          <div className="pt-6">
            <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold">
              Local: {proximoEvento.local || "Sede Fazenda Rio Grande"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function TimeUnit({ value, label }: { value: number, label: string }) {
  return (
    <div className="glass p-6 rounded-[2.5rem] border border-white/5 group hover:border-destaque/30 transition-all">
      <p className="text-5xl md:text-7xl font-black tabular-nums tracking-tighter text-gradient leading-none">
        {value.toString().padStart(2, '0')}
      </p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mt-2 group-hover:text-destaque transition-colors">
        {label}
      </p>
    </div>
  );
}