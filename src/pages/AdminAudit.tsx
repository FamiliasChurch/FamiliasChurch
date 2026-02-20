import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, where, orderBy, doc, deleteDoc } from "firebase/firestore";
import { 
  TrendingUp, Hand, Coins, Calendar, Clock, FileText, Eye, Trash2, ShieldAlert, CheckCircle2 
} from "lucide-react";

export default function AdminAudit({ userRole }: { userRole: string }) {
  const [tab, setTab] = useState<"Dízimos" | "Ofertas">("Dízimos");
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    const umAnoAtras = new Date();
    umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);

    // Requer índice composto no Firestore: data (DESC) + status (filtros)
    const q = query(
      collection(db, "registros_financeiros_validados"), 
      where("data", ">=", umAnoAtras),
      orderBy("data", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransacoes(docs);
      processarGrafico(docs);
    });
    return () => unsub();
  }, []);

  const totalOfertasValidadas = transacoes
    .filter(t => t.tipo === "Oferta" && t.status?.includes("Aprovado"))
    .reduce((acc, cur) => acc + (Number(cur.valorLido) || 0), 0);

  const processarGrafico = (dados: any[]) => {
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const hoje = new Date();
    const dadosGrafico = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesNome = meses[d.getMonth()];
      const totalMes = dados
        .filter((item: any) => {
           if (!item.data || !item.status?.includes("Aprovado")) return false;
           const itemDate = item.data.toDate ? item.data.toDate() : new Date(item.data);
           return itemDate.getMonth() === d.getMonth() && itemDate.getFullYear() === d.getFullYear();
        })
        .reduce((acc: number, cur: any) => acc + (Number(cur.valorLido) || 0), 0);
      dadosGrafico.push({ mes: mesNome, valor: totalMes });
    }
    setMonthlyData(dadosGrafico);
  };

  // 🗑️ FUNÇÃO DE EXCLUSÃO MANUAL PARA A TESOURARIA
  const handleDelete = async (id: string, doador: string) => {
    const confirmou = window.confirm(`ATENÇÃO: Deseja apagar definitivamente o comprovante de ${doador}?`);
    if (confirmou) {
      try {
        await deleteDoc(doc(db, "registros_financeiros_validados", id));
      } catch (error) {
        console.error("Erro ao excluir registro:", error);
      }
    }
  };

  const renderComprovante = (item: any) => {
    const itemDate = item.data?.toDate ? item.data.toDate() : new Date(item.data);
    const difHoras = (new Date().getTime() - itemDate.getTime()) / (1000 * 60 * 60);
    const limite = item.tipo === "Dízimo" ? 168 : 24;

    if (difHoras > limite) {
      return (
        <div className="flex items-center gap-2 px-4 py-3 text-slate-400 bg-slate-100 border border-slate-200 rounded-xl text-[9px] font-black uppercase italic">
          <Clock size={14} /> Arquivado
        </div>
      );
    }

    return (
      <a href={item.comprovanteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-3 text-blue-600 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-md transition-all">
        {item.comprovanteUrl?.includes(".pdf") ? <FileText size={16}/> : <Eye size={16} />} 
        Ver Comprovante
      </a>
    );
  };

  // Restringe a lixeira apenas para administradores
  const podeDeletar = ["admin", "gerenciador", "dev"].includes(userRole?.toLowerCase());
  const maxValor = Math.max(...monthlyData.map(d => d.valor), 100);

  // Componente extraído para não repetir o código da lista em Dízimos e Ofertas
  const renderListaTransacoes = (tipo: "Dízimo" | "Oferta") => (
    <div className="grid gap-4">
      {transacoes.filter(t => t.tipo === tipo).map((item) => (
        <div key={item.id} className="flex flex-col md:flex-row justify-between md:items-center p-6 bg-slate-50 border border-slate-200 rounded-3xl gap-4">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase">
              <Calendar size={12} /> {item.data?.toDate ? item.data.toDate().toLocaleString('pt-BR') : "S/ Data"}
            </div>
            <h4 className="text-lg font-bold text-slate-800 uppercase flex items-center gap-2">
              {item.doador} 
              {/* SINALIZADOR VISUAL DA AUDITORIA DO PYTHON */}
              {item.status?.includes("Aprovado") ? (
                <span className="flex items-center gap-1 text-[9px] text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full"><CheckCircle2 size={12}/> Válido</span>
              ) : (
                <span className="flex items-center gap-1 text-[9px] text-red-600 bg-red-100 px-2 py-0.5 rounded-full"><ShieldAlert size={12}/> Rejeitado (Alerta)</span>
              )}
            </h4>
            <p className="text-2xl font-black text-emerald-600">
              R$ {(Number(item.valorLido) || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {renderComprovante(item)}
            {podeDeletar && (
              <button onClick={() => handleDelete(item.id, item.doador)} className="p-3 text-red-400 bg-white border border-slate-200 hover:border-red-100 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all shadow-sm" title="Excluir Registro">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-10 bg-background min-h-screen pt-10 text-left">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
         <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><TrendingUp size={24} /></div>
            <h3 className="font-display text-xl font-bold uppercase text-slate-800 tracking-tighter">Entradas Totais (6 meses)</h3>
         </div>
         <div className="h-64 flex items-end justify-between gap-4">
            {monthlyData.map((d, index) => (
              <div key={index} className="flex flex-col items-center gap-3 w-full group">
                <div className="relative w-full bg-slate-100 rounded-t-2xl overflow-hidden flex items-end h-48">
                  <div style={{ height: `${(d.valor / maxValor) * 100}%` }} className="w-full bg-blue-600 rounded-t-xl transition-all duration-1000 group-hover:bg-blue-500 shadow-lg" />
                </div>
                <span className="text-[10px] font-black uppercase text-slate-400">{d.mes}</span>
              </div>
            ))}
         </div>
      </div>

      <div className="flex justify-center">
        <div className="bg-white p-2 rounded-[2rem] border border-slate-200 shadow-xl flex gap-2 w-full max-w-md relative">
            <div className={`absolute top-2 bottom-2 w-[calc(50%-12px)] bg-blue-600 rounded-3xl transition-all duration-500 ${tab === 'Ofertas' ? 'left-[50%]' : 'left-2'}`} />
            <button onClick={() => setTab("Dízimos")} className={`flex-1 py-4 z-10 text-[10px] font-black uppercase ${tab === 'Dízimos' ? 'text-white' : 'text-slate-400'}`}>Dízimos</button>
            <button onClick={() => setTab("Ofertas")} className={`flex-1 py-4 z-10 text-[10px] font-black uppercase ${tab === 'Ofertas' ? 'text-white' : 'text-slate-400'}`}>Ofertas</button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[3.5rem] border border-slate-200 shadow-sm">
        {tab === "Ofertas" ? (
          <div className="space-y-8">
              <div className="flex flex-col items-center py-6 border-b border-slate-50 mb-4">
                  <h2 className="text-5xl font-black text-blue-900 tracking-tighter">
                    {totalOfertasValidadas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Total de Ofertas Válidas</p>
              </div>
              {renderListaTransacoes("Oferta")}
          </div>
        ) : (
          renderListaTransacoes("Dízimo")
        )}
      </div>
    </div>
  );
}