import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { History, CheckCircle, AlertCircle, Clock, ShieldAlert } from "lucide-react";

// Recebe userRole (opcional para compatibilidade, mas ideal passar sempre)
export default function NotificationsLog({ userRole }: { userRole?: string }) {
  const [logs, setLogs] = useState<any[]>([]);

  // Regra de Permissão: Quem pode ver histórico de disparos?
  // Dev/Admin (Total), Gerenciador e Mídia (Gestão de Comunicação/Eventos)
  // Publicador e Moderador NÃO veem logs de sistema.
  const isAllowed = ["dev", "admin", "gerenciador", "midia", "mídia"].includes((userRole || "").toLowerCase());

  useEffect(() => {
    // Se não tiver permissão, não gasta leitura no Firebase
    if (!isAllowed) return;

    const q = query(collection(db, "logs_notificacoes"), orderBy("enviadoEm", "desc"), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [isAllowed]);

  if (!isAllowed) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-4 px-2">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <History size={20} />
        </div>
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Histórico de Envios</h3>
      </div>

      <div className="grid gap-3">
        {logs.map((log) => (
          <div key={log.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-full ${log.status === 'Sucesso' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                {log.status === 'Sucesso' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-tight text-slate-700">{log.titulo || "Notificação"}</p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md border border-slate-200">
                        {log.destinatarios} Destinatários
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock size={10} />
                        {log.enviadoEm?.toDate().toLocaleDateString('pt-BR')} às {log.enviadoEm?.toDate().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider ${log.status === 'Sucesso' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                {log.status}
              </span>
            </div>
          </div>
        ))}

        {logs.length === 0 && (
            <div className="text-center py-8 text-slate-300 text-xs font-bold uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-2xl">
                Nenhum registro encontrado
            </div>
        )}
      </div>
    </div>
  );
}