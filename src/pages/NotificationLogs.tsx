import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { History, CheckCircle, AlertCircle} from "lucide-react";

export default function NotificationLogs() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "logs_notificacoes"), orderBy("enviadoEm", "desc"), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <History className="text-destaque" size={20} />
        <h3 className="text-sm font-black uppercase tracking-widest text-white/60">Histórico de Envios</h3>
      </div>

      <div className="grid gap-3">
        {logs.map((log) => (
          <div key={log.id} className="glass p-5 rounded-3xl border border-white/5 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-full ${log.status === 'Sucesso' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {log.status === 'Sucesso' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-tight">{log.ministerio}</p>
                <p className="text-[10px] text-white/30">
                  {log.destinatarios.length} servos notificados • {log.enviadoEm?.toDate().toLocaleTimeString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[8px] font-black px-2 py-1 rounded-md uppercase ${log.status === 'Sucesso' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {log.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}