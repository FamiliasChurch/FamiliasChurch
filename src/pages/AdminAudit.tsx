import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, orderBy, query } from "firebase/firestore";
import { Eye, Check, X, TrendingUp, AlertCircle } from "lucide-react";

export default function AdminAudit({ userRole }: { userRole: string }) {
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [pendencias, setPendencias] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  // BUSCA DADOS EM TEMPO REAL
  useEffect(() => {
    const q = query(collection(db, "registros_dizimos"), orderBy("data", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      setTransacoes(docs);
      
      // Filtra pendentes
      setPendencias(docs.filter((d: any) => d.status === "Pendente" || d.status === "Pendente Verificação"));

      // Processa dados para o gráfico (Últimos 6 meses)
      processarGrafico(docs);
    });
    return () => unsub();
  }, []);

  // Lógica manual para agrupar por mês (Sem bibliotecas extras)
  const processarGrafico = (dados: any[]) => {
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const hoje = new Date();
    const dadosGrafico = [];

    // Pega os últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesNome = meses[d.getMonth()];
      
      // Soma valores deste mês (apenas aprovados)
      const totalMes = dados
        .filter((item: any) => {
           if (!item.data || item.status !== "Aprovado") return false;
           // Converte timestamp do firebase para Date
           const itemDate = item.data.toDate ? item.data.toDate() : new Date(item.data);
           return itemDate.getMonth() === d.getMonth() && itemDate.getFullYear() === d.getFullYear();
        })
        .reduce((acc: number, cur: any) => acc + Number(cur.valor), 0);

      dadosGrafico.push({ mes: mesNome, valor: totalMes });
    }
    setMonthlyData(dadosGrafico);
  };

  const handleAprovar = async (id: string) => {
    if(!window.confirm("Confirmar entrada deste valor no caixa?")) return;
    try {
      await updateDoc(doc(db, "registros_dizimos", id), {
        status: "Aprovado"
      });
    } catch (e) {
      alert("Erro ao aprovar.");
    }
  };

  const handleRejeitar = async (id: string) => {
    if(!window.confirm("ATENÇÃO: Rejeitar irá EXCLUIR este registro permanentemente. Continuar?")) return;
    try {
      await deleteDoc(doc(db, "registros_dizimos", id));
    } catch (e) {
      alert("Erro ao rejeitar/excluir.");
    }
  };

  // Encontrar o maior valor para escalar o gráfico
  const maxValor = Math.max(...monthlyData.map(d => d.valor), 100); // Mínimo 100 para não dividir por zero

  return (
    <div className="space-y-10 -p-16 -pt-24 bg-background min-h-screen text-white">
      
      {/* --- GRÁFICO DE EVOLUÇÃO --- */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
         <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
               <TrendingUp size={24} />
            </div>
            <h3 className="font-display text-xl font-bold uppercase text-slate-800">Evolução Financeira Mensal</h3>
         </div>

         <div className="h-64 flex items-end justify-between gap-2 md:gap-4">
            {monthlyData.map((d, index) => {
               // Calcula altura em porcentagem (max 100%)
               const altura = Math.round((d.valor / maxValor) * 100);
               return (
                 <div key={index} className="flex flex-col items-center gap-3 w-full group">
                    <div className="relative w-full bg-slate-100 rounded-t-2xl rounded-b-lg overflow-hidden flex items-end h-48 group-hover:bg-slate-200 transition-colors">
                       <div 
                         style={{ height: `${altura}%` }} 
                         className="w-full bg-emerald-500 rounded-t-xl transition-all duration-1000 group-hover:bg-emerald-400 relative"
                       >
                          {/* Tooltip de Valor */}
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                             R$ {d.valor.toLocaleString('pt-BR')}
                          </div>
                       </div>
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-400">{d.mes}</span>
                 </div>
               )
            })}
         </div>
      </div>

      {/* --- LISTA DE PENDÊNCIAS --- */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
           <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <AlertCircle size={24} />
           </div>
           <h3 className="font-display text-2xl font-bold uppercase text-slate-800">
             Pendências <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full ml-2 align-middle">{pendencias.length}</span>
           </h3>
        </div>

        {pendencias.length === 0 ? (
           <div className="text-center py-10 opacity-50">
             <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Nenhuma pendência para análise</p>
           </div>
        ) : (
          <div className="space-y-4">
            {pendencias.map((item) => (
              <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-50 border border-slate-200 rounded-3xl hover:border-slate-300 transition-colors">
                
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{item.tipo || "Dízimo"}</p>
                  <h4 className="text-lg font-bold text-slate-800">{item.nome}</h4>
                  <p className="font-mono text-xl font-bold text-emerald-600 mt-1">
                    R$ {parseFloat(item.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Botão Ver Anexo */}
                  {item.comprovanteUrl && (
                    <a 
                      href={item.comprovanteUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-100 transition-colors"
                    >
                      <Eye size={16} /> Ver Anexo
                    </a>
                  )}

                  {/* Botão Aprovar */}
                  <button 
                    onClick={() => handleAprovar(item.id)}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-800 transition-colors shadow-lg shadow-emerald-900/20"
                  >
                    <Check size={16} /> Aprovar
                  </button>

                  {/* Botão Rejeitar (Excluir) */}
                  <button 
                    onClick={() => handleRejeitar(item.id)}
                    title="Rejeitar e Excluir"
                    className="flex items-center justify-center w-12 h-12 bg-red-50 text-red-500 border border-red-100 rounded-xl hover:bg-red-100 hover:border-red-200 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}