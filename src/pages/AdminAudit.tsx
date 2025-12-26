import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from "firebase/firestore";
import { CheckCircle, Eye, Loader2, DollarSign, TrendingUp, AlertCircle } from "lucide-react";

export default function AdminAudit({ userRole }: { userRole: string }) {
  const [registros, setRegistros] = useState<any[]>([]);
  const [dadosGrafico, setDadosGrafico] = useState<{ mes: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Bloqueio de Segurança: Apenas cargos autorizados
  const temAcesso = ["Tesoureira", "Apóstolo", "Dev"].includes(userRole);

  useEffect(() => {
    if (!temAcesso) return;

    // Busca todos os registros para calcular o gráfico e listar pendentes
    const q = query(collection(db, "registros_dizimos"), orderBy("data", "desc"));
    
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRegistros(docs);

      // 2. Lógica do Gráfico de Crescimento (Sementes já aprovadas/conferidas)
      const meses: { [key: string]: number } = {};
      docs.forEach((reg: any) => {
        if (reg.status === "Aprovado" || reg.status === "Conferido") {
          const mesAno = reg.data?.toDate().toLocaleString('pt-BR', { month: 'short' }).toUpperCase() || "S/D";
          meses[mesAno] = (meses[mesAno] || 0) + parseFloat(reg.valor);
        }
      });
      setDadosGrafico(Object.entries(meses).map(([mes, total]) => ({ mes, total })).slice(-6));
      setLoading(false);
    });

    return () => unsub();
  }, [temAcesso]);

  const aprovarSemente = async (id: string) => {
    const docRef = doc(db, "registros_dizimos", id);
    // Atualiza para o status que define o sucesso no teu fluxo
    await updateDoc(docRef, { status: "Aprovado" });
  };

  if (!temAcesso) return <div className="h-screen flex items-center justify-center font-black text-red-600 uppercase tracking-widest">Acesso Restrito</div>;
  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primaria" /></div>;

  // Filtra apenas o que ainda precisa de atenção para a lista de auditoria
  const pendentes = registros.filter(r => r.status === "Pendente" || r.status === "Pendente Verificação");

  return (
    <div className="min-h-screen bg-n-fundo pt-28 pb-12 px-6 space-y-10">
      <div className="container mx-auto max-w-6xl space-y-10">
        
        {/* DASHBOARD DE CRESCIMENTO (Visão do Apóstolo) */}
        <div className="bg-white p-10 rounded-[3rem] border border-n-borda shadow-xl">
          <div className="flex items-center gap-2 text-primaria font-black text-[10px] uppercase tracking-widest mb-8">
            <TrendingUp size={14} /> Evolução Financeira Mensal
          </div>
          <div className="flex items-end justify-between h-48 gap-4">
            {dadosGrafico.map((d) => (
              <div key={d.mes} className="flex-1 flex flex-col items-center gap-3 group">
                <div className="text-[9px] font-bold text-n-suave opacity-0 group-hover:opacity-100 transition-opacity">
                  R$ {d.total.toLocaleString('pt-BR')}
                </div>
                <div className="w-full bg-gray-100 rounded-t-xl relative overflow-hidden" 
                     style={{ height: `${(d.total / Math.max(...dadosGrafico.map(g => g.total), 1)) * 100}%` }}>
                  <div className="absolute inset-0 bg-primaria transition-all duration-1000" />
                </div>
                <span className="text-[10px] font-black text-n-suave">{d.mes}</span>
              </div>
            ))}
          </div>
        </div>

        {/* LISTA DE AUDITORIA (Visão da Tesouraria) */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 border-l-4 border-primaria pl-6">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-n-texto">Pendências</h2>
            <span className="bg-primaria text-white text-[10px] font-black px-3 py-1 rounded-full">{pendentes.length}</span>
          </div>

          <div className="grid gap-4">
            {pendentes.length === 0 ? (
              <div className="p-20 text-center bg-white rounded-[3rem] border border-n-borda border-dashed opacity-40">
                <p className="uppercase font-black text-xs tracking-widest">Tudo em ordem na Sede Fazenda Rio Grande</p>
              </div>
            ) : (
              pendentes.map(item => (
                <div key={item.id} className="bg-white p-8 rounded-[2.5rem] border border-n-borda flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm hover:shadow-md transition-all">
                  <div className="text-left space-y-1">
                    <p className="text-[9px] uppercase font-black text-primaria tracking-widest">{item.tipo}</p>
                    <h3 className="text-xl font-bold text-n-texto leading-none">{item.nome}</h3>
                    <p className="text-2xl font-display font-black text-n-texto">
                      R$ {parseFloat(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <a 
                      href={item.comprovanteUrl} 
                      target="_blank" 
                      className="flex-1 md:flex-none p-4 bg-n-fundo border border-n-borda rounded-2xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase text-n-texto"
                    >
                      <Eye size={16} /> Ver Anexo
                    </a>

                    <button 
                      onClick={() => aprovarSemente(item.id)}
                      className="flex-1 md:flex-none p-4 bg-n-texto text-white rounded-2xl hover:bg-primaria transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase shadow-lg shadow-n-texto/10"
                    >
                      <CheckCircle size={16} /> Aprovar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}