import { useState } from "react";
import { db, storage } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Copy, Check, MapPin, Clock } from "lucide-react";
import Header from "../components/header"; 
import Footer from "../components/footer";

export default function Donations() {
  const [tab, setTab] = useState<'oferta' | 'dizimo'>('oferta');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const pixChave = "00.000.000/0001-00";

  const handleDizimo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const nome = formData.get("nome") as string;
    const valor = formData.get("valor") as string;
    const arquivo = formData.get("comprovante") as File;

    try {
      // 1. Upload para o Firebase Storage
      const storageRef = ref(storage, `comprovantes/${Date.now()}_${arquivo.name}`);
      await uploadBytes(storageRef, arquivo);
      const downloadURL = await getDownloadURL(storageRef);

      // 2. Salvar no Firestore com a URL do comprovante
      await addDoc(collection(db, "registros_dizimos"), {
        nome,
        valor: Number(valor),
        data: serverTimestamp(),
        tipo: "Dízimo",
        status: "Pendente",
        comprovanteUrl: downloadURL
      });

      alert("Dízimo registrado com sucesso!");
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      alert("Erro ao processar. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white selection:bg-destaque/30">
      <Header />
      <main className="container mx-auto px-6 pt-32 pb-24 text-center">
        <h1 className="font-display text-7xl md:text-[10rem] tracking-tighter uppercase mb-20">CONTRIBUA</h1>
        
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* ... Card de Alimentos igual ao anterior ... */}

          <div className="glass p-12 rounded-[3rem] space-y-8 border-t-4 border-white/20">
            <h2 className="text-4xl font-bold">Semeie</h2>
            {/* Toggle Oferta/Dízimo e Form igual ao seu, chamando handleDizimo */}
            {/* [Omitido para brevidade, mas mantendo sua estrutura visual] */}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}