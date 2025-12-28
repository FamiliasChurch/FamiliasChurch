import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, doc, updateDoc, query, orderBy, deleteDoc } from "firebase/firestore";
import { Users, Search, Mail, Phone, Trash2 } from "lucide-react";

export default function MembersManagement() {
  const [membros, setMembros] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("");
  const cargos = ["Membro", "Pastor", "Mídia", "Secretaria", "Apóstolo", "Dev"];

  useEffect(() => {
    const q = query(collection(db, "contas_acesso"), orderBy("nome", "asc"));
    return onSnapshot(q, (snap) => {
      setMembros(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const alterarCargo = async (id: string, novoCargo: string) => {
    if(!window.confirm(`Alterar cargo para ${novoCargo}?`)) return;
    await updateDoc(doc(db, "contas_acesso", id), { cargo: novoCargo });
  };

  const excluirMembro = async (id: string, nome: string) => {
    if(!window.confirm(`TEM CERTEZA? Isso removerá o acesso de ${nome} permanentemente.`)) return;
    try {
      await deleteDoc(doc(db, "contas_acesso", id));
      alert("Membro removido com sucesso.");
    } catch (e) {
      alert("Erro ao excluir membro.");
    }
  };
const formatarNomeCurto = (nomeCompleto: string) => {
  if (!nomeCompleto) return "";
  const partes = nomeCompleto.trim().split(/\s+/);
  if (partes.length <= 2) return nomeCompleto;
  return `${partes[0]} ${partes[partes.length - 1]}`;
};
  const filtrados = membros.filter(m => m.nome?.toLowerCase().includes(filtro.toLowerCase()) || m.email?.toLowerCase().includes(filtro.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-display font-bold text-slate-800 uppercase">Gestão de Membresia</h2>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            placeholder="Procurar irmão..."
            className="w-full bg-white border border-slate-200 p-3 pl-12 rounded-xl outline-none focus:border-emerald-500"
            onChange={e => setFiltro(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtrados.map(m => (
          <div key={m.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center gap-6">
            <img src={m.foto || "https://www.w3schools.com/howto/img_avatar.png"} className="w-16 h-16 rounded-full object-cover border-2 border-emerald-100" />
            
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                <h3 className="font-bold text-slate-800">  {formatarNomeCurto(m.nome)}</h3>
                <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-black uppercase">{m.cargo}</span>
              </div>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-xs text-slate-400 font-bold">
                <span className="flex items-center gap-1"><Mail size={12}/> {m.email}</span>
                <span className="flex items-center gap-1"><Phone size={12}/> {m.telefone || "Sem Tel"}</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-1">
              {cargos.map(c => (
                <button 
                  key={c}
                  onClick={() => alterarCargo(m.id, c)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${m.cargo === c ? 'bg-emerald-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                >
                  {c}
                </button>
              ))}
              <button 
                onClick={() => excluirMembro(m.id, m.nome)}
                className="ml-2 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}