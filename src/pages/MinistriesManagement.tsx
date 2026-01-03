import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import {
  collection, onSnapshot, doc, updateDoc,
  arrayUnion, arrayRemove
} from "firebase/firestore";
import {
  Shield, X, Briefcase, MessageCircle, Cake, PartyPopper, Plus, Crown, Store, ChevronRight
} from "lucide-react";
import { useConfirm } from "../context/ConfirmContext";

export default function MinistriesManagement({ userRole }: { userRole: string }) {
  const [activeView, setActiveView] = useState<'obreiros' | 'ministerios'>('obreiros');
  
  const [ministerios, setMinisterios] = useState<any[]>([]);
  const [todosMembros, setTodosMembros] = useState<any[]>([]);
  const [aniversariantesMes, setAniversariantesMes] = useState<any[]>([]);
  const [minSelecionadoId, setMinSelecionadoId] = useState<string>("Louvor");

  const listaMinisterios = ["Louvor", "Famílias", "Déboras", "Jovens", "Teens", "Kids", "Dança", "Teatro"];
  const cargosObreiros = ["Dev", "Apóstolo", "Secretaria", "Pastor", "Evangelista", "Presbítero", "Diácono", "Obreiro", "Servo", "Discípulo"];
  const cargosInternos = ["Líder", "Membro"];

  const { confirm } = useConfirm();

  const eMaster = ["Dev", "Apóstolo"].includes(userRole);
  const eSecretaria = userRole === "Secretaria";
  const podeModificarGeral = eMaster || eSecretaria;

  const formatarNomeCurto = (nomeCompleto: string) => {
    if (!nomeCompleto) return "";
    const partes = nomeCompleto.trim().split(" ");
    if (partes.length <= 2) return nomeCompleto;
    return `${partes[0]} ${partes[partes.length - 1]}`;
  };

  useEffect(() => {
    const unsubMin = onSnapshot(collection(db, "ministerios_info"), (snap) => {
      setMinisterios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubMem = onSnapshot(collection(db, "contas_acesso"), (snap) => {
      const membrosData = snap.docs.map(d => ({ id: d.id, ...d.data() })); 
      setTodosMembros(membrosData);

      const hoje = new Date();
      const mesAtual = hoje.getMonth() + 1;
      const diaHoje = hoje.getDate();

      const aniversariantes = membrosData
        .filter((m: any) => {
          if (!m.nascimento) return false;
          const [ano, mes, dia] = m.nascimento.split("-");
          return parseInt(mes) === mesAtual;
        })
        .map((m: any) => {
          const [ano, mes, dia] = m.nascimento.split("-");
          return {
            ...m,
            dia: parseInt(dia),
            eHoje: parseInt(dia) === diaHoje
          };
        })
        .sort((a: any, b: any) => a.dia - b.dia);

      setAniversariantesMes(aniversariantes);
    });

    return () => { unsubMin(); unsubMem(); };
  }, []);

  const adicionarMembro = async (minId: string, user: any) => {
    await updateDoc(doc(db, "ministerios_info", minId), {
      equipe: arrayUnion({
        id: user.id,
        nome: user.nome,
        cargoInterno: "Membro",
        cargoEclesia: user.cargo,
        telefone: user.telefone || ""
      })
    });
  };

  const removerMembro = async (minId: string, membroObj: any) => {
    if (eSecretaria && !["Diácono", "Presbítero"].includes(membroObj.cargoEclesia)) {
      await confirm({ title: "Acesso Negado", message: "A Secretaria só tem permissão para remover Diáconos ou Presbíteros.", variant: "danger", confirmText: "Entendi" });
      return;
    }
    const confirmou = await confirm({ title: "Remover Integrante?", message: `Deseja remover ${membroObj.nome} do ministério ${minId}?`, variant: "danger", confirmText: "Sim, Remover" });
    if (!confirmou) return;
    await updateDoc(doc(db, "ministerios_info", minId), { equipe: arrayRemove(membroObj) });
  };

  const mudarCargoInterno = async (minId: string, equipeAtual: any[], index: number, novoCargo: string) => {
    if (!podeModificarGeral) return;
    const novaEquipe = [...equipeAtual];
    novaEquipe[index].cargoInterno = novoCargo;
    await updateDoc(doc(db, "ministerios_info", minId), { equipe: novaEquipe });
  };

  const corpoObreiros = ministerios.find(m => m.id === "Corpo de Obreiros");
  const ministerioAtual = ministerios.find(m => m.id === minSelecionadoId);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 font-sans animate-in fade-in duration-500">

      {/* HEADER: SELETOR DE MODO */}
      <div className="flex justify-center md:justify-start">
        <div className="bg-slate-100 p-1.5 rounded-2xl inline-flex w-full md:w-auto shadow-inner overflow-hidden">
            <button 
                onClick={() => setActiveView('obreiros')}
                className={`flex-1 md:flex-none px-6 md:px-10 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeView === 'obreiros' ? 'bg-white text-violet-600 shadow-md transform scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <Shield size={16} /> <span className="truncate">Obreiros</span>
            </button>
            <button 
                onClick={() => setActiveView('ministerios')}
                className={`flex-1 md:flex-none px-6 md:px-10 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeView === 'ministerios' ? 'bg-white text-emerald-600 shadow-md transform scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <Briefcase size={16} /> Ministérios
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        
        {/* === COLUNA ESQUERDA (PRINCIPAL) === */}
        <div className="xl:col-span-2 space-y-6">
            
            {/* CONTAINER PRINCIPAL */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[600px] flex flex-col overflow-hidden relative">
                
                {/* --- VISTA: CORPO DE OBREIROS --- */}
                {activeView === 'obreiros' && (
                    <>
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Liderança</h3>
                                <p className="text-xs text-slate-400 font-medium mt-1">Corpo Eclesiástico</p>
                            </div>
                            <span className="text-xs font-bold bg-violet-50 text-violet-700 px-4 py-2 rounded-xl border border-violet-100">
                                {corpoObreiros?.equipe?.length || 0} Membros
                            </span>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 max-h-[600px]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {corpoObreiros?.equipe?.map((mem: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-violet-200 hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 text-sm font-black uppercase border border-slate-100">
                                            {mem.nome.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700">{formatarNomeCurto(mem.nome)}</span>
                                            <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest">{mem.cargoEclesia}</span>
                                        </div>
                                    </div>
                                    {podeModificarGeral && (
                                    <button onClick={() => removerMembro("Corpo de Obreiros", mem)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                        <X size={18} />
                                    </button>
                                    )}
                                </div>
                                ))}
                            </div>
                        </div>

                        {podeModificarGeral && (
                            <div className="p-6 border-t border-slate-50 bg-slate-50/50">
                                <div className="relative group">
                                    <Plus className="absolute left-5 top-1/2 -translate-y-1/2 text-white pointer-events-none z-10" size={18} />
                                    <select
                                        onChange={(e) => {
                                            const u = todosMembros.find(m => m.id === e.target.value);
                                            if (u) adicionarMembro("Corpo de Obreiros", u);
                                        }}
                                        className="w-full bg-violet-600 text-white rounded-2xl py-4 pl-12 pr-6 text-xs font-black uppercase tracking-widest hover:bg-violet-700 transition-all outline-none cursor-pointer appearance-none shadow-lg shadow-violet-200"
                                    >
                                        <option value="" className="text-slate-800 bg-white">Adicionar Novo Obreiro</option>
                                        {todosMembros.filter(u => cargosObreiros.includes(u.cargo)).map(u => (
                                        <option key={u.id} value={u.id} className="text-slate-800 bg-white">{u.nome} - {u.cargo}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* --- VISTA: MINISTÉRIOS --- */}
                {activeView === 'ministerios' && (
                    <div className="flex flex-col lg:flex-row h-full">
                        
                        {/* SIDEBAR DE MINISTÉRIOS (Scroll horizontal no mobile) */}
                        <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-100 p-6 bg-slate-50/30 flex flex-col gap-3 shrink-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1 ml-1 tracking-widest hidden lg:block">Departamentos</p>
                            
                            {/* Container com scroll horizontal invisível e botões compactos */}
                            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                {listaMinisterios.map(id => (
                                    <button
                                    key={id}
                                    onClick={() => setMinSelecionadoId(id)}
                                    // PADDING REDUZIDO E SEM ICONE
                                    className={`flex-shrink-0 flex items-center justify-between px-4 py-2.5 rounded-xl font-bold text-xs uppercase transition-all whitespace-nowrap lg:w-full ${minSelecionadoId === id ? "bg-white text-emerald-600 border border-emerald-100 shadow-sm ring-1 ring-emerald-50" : "bg-transparent border border-transparent text-slate-400 hover:text-slate-600 hover:bg-white/50"}`}
                                    >
                                        <span>{id}</span>
                                        {minSelecionadoId === id && <ChevronRight size={14} className="hidden lg:block text-emerald-400" />}
                                    </button>
                                ))}
                            </div>
                        </aside>

                        {/* ÁREA DE CONTEÚDO DO MINISTÉRIO */}
                        <div className="flex-1 flex flex-col min-h-[500px]">
                            {ministerioAtual ? (
                                <>
                                    <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">{ministerioAtual.titulo}</h3>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Gestão de Equipe</p>
                                        </div>
                                        {podeModificarGeral && (
                                            <div className="relative group w-full sm:w-auto">
                                                <Plus className="absolute left-4 top-1/2 -translate-y-1/2 text-white pointer-events-none z-10" size={16} />
                                                <select
                                                    onChange={(e) => {
                                                        const u = todosMembros.find(m => m.id === e.target.value);
                                                        if (u) adicionarMembro(minSelecionadoId, u);
                                                    }}
                                                    className="w-full sm:w-auto bg-emerald-500 text-white text-xs font-black pl-10 pr-6 py-3 rounded-xl uppercase shadow-md hover:bg-emerald-600 transition-all outline-none cursor-pointer appearance-none tracking-wide"
                                                >
                                                    <option value="" className="text-slate-800 bg-white">Adicionar</option>
                                                    {todosMembros.map(u => <option key={u.id} value={u.id} className="text-slate-800 bg-white">{u.nome}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-8 grid grid-cols-1 gap-4 overflow-y-auto custom-scrollbar flex-1">
                                            {ministerioAtual.equipe?.map((mem: any, idx: number) => (
                                            <div key={idx} className="p-5 bg-white border border-slate-100 rounded-2xl hover:border-emerald-200 transition-all shadow-sm group hover:shadow-md">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-black border border-slate-100 uppercase text-sm">
                                                            {mem.nome.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-sm">{formatarNomeCurto(mem.nome)}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{mem.cargoEclesia}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {mem.telefone && <a href={`https://wa.me/55${mem.telefone.replace(/\D/g, '')}`} target="_blank" className="p-2 bg-slate-50 text-emerald-500 rounded-xl hover:bg-emerald-50 transition-colors"><MessageCircle size={16} /></a>}
                                                        {podeModificarGeral && <button onClick={() => removerMembro(minSelecionadoId, mem)} className="p-2 bg-slate-50 text-rose-400 rounded-xl hover:bg-rose-50 transition-colors"><X size={16} /></button>}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex bg-slate-50 p-1.5 rounded-xl">
                                                    {cargosInternos.map(cargo => {
                                                        const isActive = mem.cargoInterno === cargo;
                                                        let activeClass = isActive ? "bg-white shadow-sm text-emerald-600 font-black" : "text-slate-400 hover:text-slate-600 font-medium";
                                                        if (isActive && cargo === 'Líder') activeClass = "bg-white shadow-sm text-amber-600 font-black border border-amber-100";
                                                        
                                                        return (
                                                            <button
                                                                key={cargo}
                                                                disabled={!podeModificarGeral}
                                                                onClick={() => mudarCargoInterno(minSelecionadoId, ministerioAtual.equipe, idx, cargo)}
                                                                className={`flex-1 py-2 rounded-lg text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${activeClass}`}
                                                            >
                                                                {cargo === "Líder" && isActive && <Crown size={12} />}
                                                                {cargo}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                            ))}
                                            {(!ministerioAtual.equipe || ministerioAtual.equipe.length === 0) && (
                                                <div className="py-20 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
                                                    <Store size={48} className="mx-auto mb-4 opacity-20"/>
                                                    <p className="text-xs font-black uppercase tracking-widest">Lista Vazia</p>
                                                </div>
                                            )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                                    <Store size={64} className="opacity-10 mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">Selecione um departamento</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* === COLUNA DIREITA (ANIVERSARIANTES) === */}
        <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[600px] sticky top-6">
          <div className="p-8 border-b border-slate-50 flex items-center gap-5 bg-white z-10">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
                 <Cake size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Aniversariantes</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-1">Mês Atual</p>
            </div>
          </div>
          
          <div className="p-6 space-y-3 overflow-y-auto custom-scrollbar flex-1">
            {aniversariantesMes.length > 0 ? (
              aniversariantesMes.map((niver: any) => (
                <div key={niver.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all hover:scale-[1.02] ${niver.eHoje ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-sm ${niver.eHoje ? 'bg-white text-amber-600 border border-amber-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                      {niver.dia}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${niver.eHoje ? 'text-amber-900' : 'text-slate-700'}`}>{formatarNomeCurto(niver.nome)}</p>
                      {niver.eHoje ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 uppercase tracking-wide mt-0.5">
                          <PartyPopper size={12} /> É HOJE!
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Aniversário</span>
                      )}
                    </div>
                  </div>
                  {niver.telefone && (
                    <a href={`https://wa.me/55${niver.telefone.replace(/\D/g, '')}`} target="_blank" className={`p-2.5 rounded-xl transition-colors ${niver.eHoje ? 'bg-white text-amber-600 hover:bg-amber-100 shadow-sm' : 'bg-slate-50 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'}`}>
                      <MessageCircle size={18} />
                    </a>
                  )}
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <Cake size={64} className="mb-4 opacity-10" />
                <p className="text-xs font-black uppercase tracking-widest">Nenhum aniver. este mês</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}