import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";

export default function AdminTaxes() {
  const [registros, setRegistros] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "registros_dizimos"), orderBy("data", "desc"));
    return onSnapshot(q, (snapshot) => {
      setRegistros(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const handleStatus = async (id: string, novoStatus: string) => {
    await updateDoc(doc(db, "registros_dizimos", id), { status: novoStatus });
  };

  return (
    <div className="p-8 pt-24 bg-background min-h-screen text-white">
      <h1 className="text-4xl font-display mb-8">Tesouraria - Dízimos</h1>
      <div className="grid gap-4">
        {registros.map((reg) => (
          <div key={reg.id} className="glass p-6 rounded-2xl flex justify-between items-center border-l-4 border-destaque">
            <div>
              <p className="font-bold text-lg">{reg.nome}</p>
              <p className="text-destaque text-2xl font-black">R$ {reg.valor}</p>
              <span className={`text-[10px] uppercase font-bold p-1 rounded ${reg.status === 'Aprovado' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                {reg.status}
              </span>
            </div>
            
            <div className="flex gap-4 items-center">
              <a href={reg.comprovanteUrl} target="_blank" className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                <ExternalLink size={20} />
              </a>
              <button onClick={() => handleStatus(reg.id, "Aprovado")} className="text-green-500 hover:scale-110"><CheckCircle size={32} /></button>
              <button onClick={() => handleStatus(reg.id, "Recusado")} className="text-red-500 hover:scale-110"><XCircle size={32} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}