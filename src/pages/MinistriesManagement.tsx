import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import {
  collection, onSnapshot, doc, updateDoc,
  arrayUnion, arrayRemove
} from "firebase/firestore";
import {
  Shield, X, LayoutGrid, ChevronRight, Briefcase, MessageCircle, Cake, PartyPopper, Plus, Crown, User, Store
} from "lucide-react";
// Import do Modal
import { useConfirm } from "../context/ConfirmContext";

export default function MinistriesManagement({ userRole }: { userRole: string }) {
  const [activeView, setActiveView] = useState<'obreiros' | 'ministerios'>('obreiros');
  
  const [ministerios, setMinisterios] = useState<any[]>([]);
  const [todosMembros, setTodosMembros] = useState<any[]>([]);
  const [aniversariantesMes, setAniversariantesMes] = useState<any[]>([]);
  const [minSelecionadoId, setMinSelecionadoId] = useState<string>("Louvor");

  const listaMinisterios = ["Louvor", "Famílias", "Déboras", "Jovens", "Teens", "Kids", "Dança", "Teatro"];
  const cargosObreiros = ["Dev", "Apóstolo", "Secretaria", "Pastor", "Evangelista", "Presbítero", "Diácono", "Obreiro", "Servo", "Discípulo"];
  
  // REMOVIDO "LIDERADO" CONFORME SOLICITADO
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
    <div className="max-w-7xl mx-auto space-y-6 pb-20 mt-6 font-sans animate-in fade-in duration-500">

      {/* HEADER REMOVIDO, FICAM APENAS OS BOTÕES */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* === COLUNA ESQUERDA === */}
        <div className="xl:col-span-2 space-y-6">
            
            {/* BOTÕES DE ALTERNÂNCIA (NOVO HEADER) */}
            <div className="bg-slate-100 p-1.5 rounded-xl inline-flex w-full md:w-auto -mt-3">
                <button 
                    onClick={() => setActiveView('obreiros')}
                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold uppercase transition-all flex items-center justify-center gap-2 ${activeView === 'obreiros' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Shield size={16} /> Corpo de Obreiros
                </button>
                <button 
                    onClick={() => setActiveView('ministerios')}
                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold uppercase transition-all flex items-center justify-center gap-2 ${activeView === 'ministerios' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Briefcase size={16} /> Ministérios
                </button>
            </div>

            {/* CONTEÚDO (CARD BRANCO) */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm min-h-[500px] flex flex-col">
                
                {activeView === 'obreiros' && (
                    <>
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-700">Oficiais e Lideranças</h3>
                            <span className="text-xs font-bold bg-violet-50 text-violet-700 px-3 py-1 rounded-lg border border-violet-100">
                                {corpoObreiros?.equipe?.length || 0} Membros
                            </span>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 max-h-[600px]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {corpoObreiros?.equipe?.map((mem: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 hover:border-violet-200 hover:shadow-sm transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 text-xs font-bold uppercase border border-slate-100">
                                            {mem.nome.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700">{formatarNomeCurto(mem.nome)}</span>
                                            <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wide">{mem.cargoEclesia}</span>
                                        </div>
                                    </div>
                                    {podeModificarGeral && (
                                    <button onClick={() => removerMembro("Corpo de Obreiros", mem)} className="p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                                        <X size={16} />
                                    </button>
                                    )}
                                </div>
                                ))}
                            </div>
                        </div>

                        {podeModificarGeral && (
                            <div className="p-4 border-t border-slate-50 bg-slate-50/50 rounded-b-2xl">
                                <div className="relative group">
                                    <Plus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-violet-500 transition-colors" size={16} />
                                    <select
                                        onChange={(e) => {
                                            const u = todosMembros.find(m => m.id === e.target.value);
                                            if (u) adicionarMembro("Corpo de Obreiros", u);
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-slate-500 uppercase hover:border-violet-300 hover:text-violet-600 transition-all outline-none cursor-pointer appearance-none"
                                    >
                                        <option value="">+ Adicionar Novo Obreiro</option>
                                        {todosMembros.filter(u => cargosObreiros.includes(u.cargo)).map(u => (
                                        <option key={u.id} value={u.id}>{u.nome} - {u.cargo}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeView === 'ministerios' && (
                    <div className="flex flex-col lg:flex-row h-full">
                        <aside className="w-full lg:w-56 border-b lg:border-b-0 lg:border-r border-slate-100 p-4 bg-slate-50/30">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-3 ml-2 tracking-widest">Áreas</p>
                            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                                {listaMinisterios.map(id => (
                                    <button
                                    key={id}
                                    onClick={() => setMinSelecionadoId(id)}
                                    className={`flex-shrink-0 lg:w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs uppercase transition-all ${minSelecionadoId === id ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-white border border-transparent text-slate-400 hover:text-slate-600 hover:bg-white"}`}
                                    >
                                    <div className="flex items-center gap-2">
                                        <Store size={16} className={minSelecionadoId === id ? "text-emerald-500" : "text-slate-300"} />
                                        {id}
                                    </div>
                                    {minSelecionadoId === id && <ChevronRight size={14} className="hidden lg:block text-emerald-400" />}
                                    </button>
                                ))}
                            </div>
                        </aside>

                        <div className="flex-1 flex flex-col min-h-[500px]">
                            {ministerioAtual ? (
                                <>
                                    <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">{ministerioAtual.titulo}</h3>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Gestão de Equipe</p>
                                        </div>
                                        {podeModificarGeral && (
                                            <div className="relative">
                                                <Plus className="absolute left-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" size={14} />
                                                <select
                                                    onChange={(e) => {
                                                    const u = todosMembros.find(m => m.id === e.target.value);
                                                    if (u) adicionarMembro(minSelecionadoId, u);
                                                    }}
                                                    className="bg-emerald-500 text-white text-[10px] font-black pl-8 pr-4 py-2 rounded-lg uppercase shadow-sm hover:bg-emerald-600 transition-all outline-none cursor-pointer appearance-none"
                                                >
                                                    <option value="">Adicionar</option>
                                                    {todosMembros.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-6 grid grid-cols-1 gap-4 overflow-y-auto custom-scrollbar flex-1">
                                        {ministerioAtual.equipe?.map((mem: any, idx: number) => (
                                        <div key={idx} className="p-4 bg-white border border-slate-100 rounded-xl hover:border-emerald-200 transition-all shadow-sm group">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-bold border border-slate-100 uppercase text-xs">
                                                        {mem.nome.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{formatarNomeCurto(mem.nome)}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase">{mem.cargoEclesia}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    {mem.telefone && <a href={`https://wa.me/55${mem.telefone.replace(/\D/g, '')}`} target="_blank" className="p-1.5 bg-slate-50 text-emerald-500 rounded-md hover:bg-emerald-50"><MessageCircle size={14} /></a>}
                                                    {podeModificarGeral && <button onClick={() => removerMembro(minSelecionadoId, mem)} className="p-1.5 bg-slate-50 text-rose-400 rounded-md hover:bg-rose-50"><X size={14} /></button>}
                                                </div>
                                            </div>
                                            
                                            <div className="flex bg-slate-50 p-1 rounded-lg">
                                                {cargosInternos.map(cargo => {
                                                    const isActive = mem.cargoInterno === cargo;
                                                    let activeClass = isActive ? "bg-white shadow-sm text-emerald-600 font-bold" : "text-slate-400 hover:text-slate-600";
                                                    if (isActive && cargo === 'Líder') activeClass = "bg-white shadow-sm text-amber-600 font-bold border border-amber-100";
                                                    
                                                    return (
                                                        <button
                                                            key={cargo}
                                                            disabled={!podeModificarGeral}
                                                            onClick={() => mudarCargoInterno(minSelecionadoId, ministerioAtual.equipe, idx, cargo)}
                                                            className={`flex-1 py-1.5 rounded-md text-[8px] uppercase transition-all flex items-center justify-center gap-1 ${activeClass}`}
                                                        >
                                                            {cargo === "Líder" && isActive && <Crown size={10} />}
                                                            {cargo}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                        ))}
                                        {(!ministerioAtual.equipe || ministerioAtual.equipe.length === 0) && (
                                            <div className="py-10 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-xl">
                                                <p className="text-xs font-bold uppercase">Lista Vazia</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                                    <Store size={48} className="opacity-20 mb-2" />
                                    <p className="text-xs font-bold uppercase">Selecione um departamento</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* === COLUNA DIREITA (ANIVERSARIANTES) === */}
        {/* Adicionado padding-top (pt-12) para alinhar visualmente com o card de conteúdo da esquerda */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[600px] sticky top-6 mt-16">
          <div className="p-6 border-b border-slate-50 flex items-center gap-4 bg-white z-10">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                 <Cake size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Aniversariantes</h2>
              <p className="text-sm text-slate-500 font-medium">Mês Atual</p>
            </div>
          </div>
          
          <div className="p-6 space-y-3 overflow-y-auto custom-scrollbar flex-1">
            {aniversariantesMes.length > 0 ? (
              aniversariantesMes.map((niver: any) => (
                <div key={niver.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${niver.eHoje ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${niver.eHoje ? 'bg-white text-amber-600 border border-amber-100' : 'bg-slate-100 text-slate-500'}`}>
                      {niver.dia}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${niver.eHoje ? 'text-amber-900' : 'text-slate-700'}`}>{formatarNomeCurto(niver.nome)}</p>
                      {niver.eHoje ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase tracking-wide">
                          <PartyPopper size={12} /> É HOJE!
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400">Aniversário</span>
                      )}
                    </div>
                  </div>
                  {niver.telefone && (
                    <a href={`https://wa.me/55${niver.telefone.replace(/\D/g, '')}`} target="_blank" className={`p-2 rounded-lg transition-colors ${niver.eHoje ? 'bg-white text-amber-600 hover:bg-amber-100 shadow-sm' : 'bg-slate-100 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'}`}>
                      <MessageCircle size={16} />
                    </a>
                  )}
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <Cake size={48} className="mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">Nenhum aniver. este mês</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}