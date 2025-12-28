import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import {
  collection, onSnapshot, doc, updateDoc,
  arrayUnion, arrayRemove
} from "firebase/firestore";
import {
  Shield, UserPlus, X, Users, LayoutGrid, ChevronRight, Briefcase, Phone, MessageCircle, Cake, PartyPopper
} from "lucide-react";

export default function MinistriesManagement({ userRole }: { userRole: string }) {
  const [ministerios, setMinisterios] = useState<any[]>([]);
  const [todosMembros, setTodosMembros] = useState<any[]>([]);
  const [aniversariantesMes, setAniversariantesMes] = useState<any[]>([]);
  const [minSelecionadoId, setMinSelecionadoId] = useState<string>("Louvor");

  const listaMinisterios = ["Louvor", "Famílias", "Déboras", "Jovens", "Teens", "Kids", "Dança", "Teatro"];
  const cargosObreiros = ["Dev", "Apóstolo", "Secretaria", "Pastor", "Evangelista", "Presbítero", "Diácono", "Obreiro", "Servo", "Discípulo"];
  const cargosInternos = ["Líder", "Liderado", "Membro"];

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
      const membrosData = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setTodosMembros(membrosData);

      // Lógica de Aniversariantes do Mês
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
        .sort((a, b) => a.dia - b.dia);

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
      return alert("A Secretaria só tem permissão para remover Diáconos ou Presbíteros.");
    }
    if (!window.confirm(`Remover ${membroObj.nome}?`)) return;
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* 1. CORPO DE OBREIROS (ESQUERDA/TOPO) */}
        <section className="xl:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Shield size={24} className="text-emerald-400" />
              <div>
                <h2 className="text-2xl font-display font-bold uppercase tracking-tight italic">Corpo de Obreiros</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Oficiais e Lideranças</p>
              </div>
            </div>
            <span className="text-2xl font-display font-bold bg-white/10 px-4 py-1 rounded-xl">
              {corpoObreiros?.equipe?.length || 0}
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
            {corpoObreiros?.equipe?.map((mem: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 group">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800">{formatarNomeCurto(mem.nome)}</span>
                  <span className="text-[9px] font-black text-emerald-600 uppercase">{mem.cargoEclesia}</span>
                </div>
                {podeModificarGeral && (
                  <button onClick={() => removerMembro("Corpo de Obreiros", mem)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all">
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            {podeModificarGeral && (
              <select
                onChange={(e) => {
                  const u = todosMembros.find(m => m.id === e.target.value);
                  if (u) adicionarMembro("Corpo de Obreiros", u);
                }}
                className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-[10px] font-black text-slate-400 uppercase hover:bg-emerald-50 hover:text-emerald-600 transition-all outline-none cursor-pointer"
              >
                <option value="">+ ADICIONAR OBREIRO</option>
                {todosMembros.filter(u => cargosObreiros.includes(u.cargo)).map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            )}
          </div>
        </section>

        {/* 2. MÓDULO ANIVERSARIANTES (DIREITA) */}
        <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="bg-emerald-900 p-6 text-white flex items-center gap-4">
            <Cake size={24} className="text-emerald-400" />
            <div>
              <h2 className="text-xl font-display font-bold uppercase tracking-tight italic">Aniversariantes</h2>
              <p className="text-[10px] text-emerald-200 font-black uppercase tracking-widest">Mês Atual</p>
            </div>
          </div>
          <div className="p-6 space-y-3 overflow-y-auto max-h-[400px] custom-scrollbar">
            {aniversariantesMes.length > 0 ? (
              aniversariantesMes.map((niver: any) => (
                <div key={niver.id} className={`flex items-center justify-between p-3 rounded-xl border ${niver.eHoje ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-100 animate-pulse' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${niver.eHoje ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-200 text-slate-500'}`}>
                      {niver.dia}
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${niver.eHoje ? 'text-amber-900' : 'text-slate-700'}`}>{formatarNomeCurto(niver.nome)}</p>
                      {niver.eHoje && (
                        <span className="flex items-center gap-1 text-[8px] font-black text-amber-600 uppercase">
                          <PartyPopper size={10} /> É HOJE!
                        </span>
                      )}
                    </div>
                  </div>
                  {niver.telefone && (
                    <a href={`https://wa.me/55${niver.telefone.replace(/\D/g, '')}`} target="_blank" className={`p-2 rounded-lg transition-colors ${niver.eHoje ? 'bg-amber-200 text-amber-700 hover:bg-amber-300' : 'bg-white text-emerald-600 hover:bg-emerald-50'}`}>
                      <MessageCircle size={14} />
                    </a>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-slate-300 text-[10px] font-bold uppercase py-10">Ninguém este mês</p>
            )}
          </div>
        </section>
      </div>

      {/* 3. GESTÃO DE MINISTÉRIOS (LISTA E PAINEL) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start pt-4">
        <aside className="w-full lg:w-72 bg-white rounded-[2rem] border border-slate-200 p-4 shadow-sm space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-4 ml-2 tracking-widest">Ministérios</p>
          {listaMinisterios.map(id => (
            <button
              key={id}
              onClick={() => setMinSelecionadoId(id)}
              className={`w-full flex items-center justify-between p-4 rounded-xl font-bold text-sm transition-all ${minSelecionadoId === id ? "bg-emerald-900 text-white shadow-lg translate-x-1" : "text-slate-500 hover:bg-slate-50"
                }`}
            >
              <div className="flex items-center gap-3">
                <LayoutGrid size={18} className={minSelecionadoId === id ? "text-emerald-400" : "text-slate-300"} />
                {id}
              </div>
              <ChevronRight size={16} className={minSelecionadoId === id ? "opacity-100" : "opacity-0"} />
            </button>
          ))}
        </aside>

        <main className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          {ministerioAtual ? (
            <>
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-800 text-white rounded-2xl flex items-center justify-center shadow-md"><Briefcase size={24} /></div>
                  <div>
                    <h3 className="text-2xl font-display font-bold text-slate-800 uppercase leading-none italic">{ministerioAtual.titulo}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Gestão de Equipe</p>
                  </div>
                </div>
                {podeModificarGeral && (
                  <select
                    onChange={(e) => {
                      const u = todosMembros.find(m => m.id === e.target.value);
                      if (u) adicionarMembro(minSelecionadoId, u);
                    }}
                    className="w-full md:w-auto bg-emerald-900 text-white text-[10px] font-black px-6 py-3 rounded-xl uppercase shadow-md hover:bg-emerald-800 transition-all outline-none cursor-pointer"
                  >
                    <option value="">+ INTEGRANTE</option>
                    {todosMembros.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                  </select>
                )}
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {ministerioAtual.equipe?.map((mem: any, idx: number) => (
                  <div key={idx} className="p-5 bg-white border border-slate-100 rounded-2xl hover:border-emerald-200 transition-all shadow-sm group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold border border-slate-200 uppercase">
                          {mem.nome.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm">{formatarNomeCurto(mem.nome)}</span>
                          <span className="text-[9px] font-black text-emerald-600 uppercase">{mem.cargoEclesia}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {mem.telefone && (
                          <>
                            <a href={`tel:${mem.telefone}`} className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:text-emerald-600 transition-colors"><Phone size={14} /></a>
                            <a href={`https://wa.me/55${mem.telefone.replace(/\D/g, '')}`} target="_blank" className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:text-emerald-500 transition-colors"><MessageCircle size={14} /></a>
                          </>
                        )}
                        {podeModificarGeral && (
                          <button onClick={() => removerMembro(minSelecionadoId, mem)} className="p-2 text-slate-300 hover:text-red-500 transition-all"><X size={18} /></button>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1">
                      {cargosInternos.map(cargo => (
                        <button
                          key={cargo}
                          disabled={!podeModificarGeral}
                          onClick={() => mudarCargoInterno(minSelecionadoId, ministerioAtual.equipe, idx, cargo)}
                          className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${mem.cargoInterno === cargo ? 'bg-emerald-900 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                        >
                          {cargo}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-20 text-center text-slate-300">
              <Users size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-black uppercase text-[10px] tracking-widest italic text-center">Selecione um ministério</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}