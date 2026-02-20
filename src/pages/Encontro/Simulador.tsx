import { db } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp, query, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";
import { Play, Trash2, Users, Loader2, ShieldCheck, UserPlus, HeartPulse } from "lucide-react";
import { useState, useEffect } from "react";

export default function SimuladorEncontro() {
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ inscritos: 0, servos: 0 });

    // --- SESSÃO: GERADORES ALEATÓRIOS ---
    const names = ["Lucas", "Ana", "Marcos", "Julia", "Ricardo", "Beatriz", "Fernando", "Camila", "Thiago", "Patrícia"];
    const surnames = ["Almeida", "Santos", "Oliveira", "Costa", "Pereira", "Lima", "Mendes", "Rocha"];
    const healthIssues = ["Asma", "Diabetes Tipo 1", "Hipertensão", "Epilepsia", "Alergia Grave (Picada de Abelha)"];
    const meds = ["Bombinha (Salbutamol)", "Insulina NPH", "Losartana 50mg", "Fenobarbital", "Epinefrina"];

    const valorEncontro = 250.00;
    const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
    
    const generateCPF = () => {
        const n = () => Math.floor(Math.random() * 9);
        return `${n()}${n()}${n()}.${n()}${n()}${n()}.${n()}${n()}${n()}-${n()}${n()}`;
    };

    useEffect(() => { atualizarContagem(); }, []);

    // --- SESSÃO: LÓGICA DE INJEÇÃO (FOCO EM SAÚDE E FINANCEIRO) ---
    const injetarDados = async (quantidade: number, tipo: "inscrito" | "servo") => {
        setLoading(true);
        const colecao = tipo === "inscrito" ? "encontro_inscritos" : "encontro_servos";
        
        try {
            for (let i = 0; i < quantidade; i++) {
                const pNome = `${getRandom(names)} ${getRandom(surnames)}`;
                // 50% de chance de ter problema de saúde para garantir que apareça na aba Saúde
                const hasHealth = Math.random() > 0.5; 
                const valorPago = Math.random() > 0.3 ? valorEncontro : 100.00;

                const payload: any = {
                    nome: pNome,
                    email: `${pNome.toLowerCase().replace(/\s+/g, '.')}@teste.com`,
                    cpf: generateCPF(),
                    telefone: `(41) 9${Math.floor(Math.random() * 90000000 + 10000000)}`,
                    confirmado: valorPago === valorEncontro,
                    valorTotal: valorEncontro,
                    valorPago: valorPago,
                    totalParcelas: 5,
                    parcelasPagas: valorPago === valorEncontro ? 5 : 2,
                    chegouNoLocal: false,
                    tokenAcesso: `TOKEN-${tipo.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
                    criado_em: serverTimestamp(),
                    historicoSaude: []
                };

                // Formatação específica que o Gerenciamento.tsx espera para a aba Saúde
                if (hasHealth) {
                    payload.problemasSaude = [getRandom(healthIssues)];
                    payload.remediosControlados = getRandom(meds);
                    payload.horariosMedicacao = "08:00, 14:00, 20:00"; // Horários fixos para teste de alerta
                } else {
                    payload.problemasSaude = [];
                    payload.remediosControlados = "";
                    payload.horariosMedicacao = "";
                }

                await addDoc(collection(db, colecao), payload);
            }
            alert(`Sucesso! Verifique a aba Saúde agora.`);
            atualizarContagem();
        } catch (err) { console.error("Erro na injeção:", err); }
        setLoading(false);
    };

    // --- SESSÃO: UTILITÁRIOS DO BANCO ---
    const atualizarContagem = async () => {
        const qI = await getDocs(query(collection(db, "encontro_inscritos")));
        const qS = await getDocs(query(collection(db, "encontro_servos")));
        setStats({ inscritos: qI.size, servos: qS.size });
    };

    const resetarBanco = async () => {
        if (!confirm("Deseja apagar todos os dados de teste?")) return;
        setLoading(true);
        const colecoes = ["encontro_inscritos", "encontro_servos"];
        for (const col of colecoes) {
            const snap = await getDocs(query(collection(db, col)));
            for (const d of snap.docs) await deleteDoc(doc(db, col, d.id));
        }
        setStats({ inscritos: 0, servos: 0 });
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center font-body">
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 max-w-xl w-full space-y-8">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <HeartPulse size={32} />
                    </div>
                    <h1 className="text-2xl font-display font-bold text-slate-900 uppercase tracking-tighter">Simulador de <span className="text-red-600">Saúde</span></h1>
                    <p className="text-slate-500 text-xs italic">Injete dados para validar abas de Saúde e Financeiro</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Inscritos</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.inscritos}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Servos</p>
                        <p className="text-2xl font-bold text-emerald-500">{stats.servos}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <button onClick={() => injetarDados(10, "inscrito")} disabled={loading} className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all">
                        {loading ? <Loader2 className="animate-spin"/> : <><UserPlus size={18}/> Gerar 10 Casos de Teste</>}
                    </button>
                    
                    <button onClick={resetarBanco} disabled={loading} className="w-full flex items-center justify-center gap-3 bg-white border-2 border-red-100 text-red-500 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all">
                        <Trash2 size={18}/> Limpar Banco de Dados
                    </button>
                </div>
            </div>
        </div>
    );
}