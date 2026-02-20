import { useState, useEffect, ChangeEvent } from "react";
import { db, auth } from "../../lib/firebase";
import { collection, onSnapshot, doc, updateDoc, getDoc, setDoc, query, orderBy, arrayUnion, where, getDocs } from "firebase/firestore";
import {
    Search, HeartPulse, Check, X, Eye, Loader2, Shield, Save, Clock, Pill, UserCog, 
    Stethoscope, Wallet, Crown, CheckCircle2, QrCode, UserCheck, MapPin, Ticket, CameraOff,
    CreditCard, ClipboardList, ChevronRight, DollarSign, AlertCircle, BellRing, AlarmClock
} from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { QRCodeSVG } from "qrcode.react";

export default function Gerenciamento() {
    const [aba, setAba] = useState<"encontristas" | "servos" | "coordenacao" | "saude" | "recepcao" | "meu-cracha">("encontristas");
    const [inscritos, setInscritos] = useState<any[]>([]);
    const [usuariosSistema, setUsuariosSistema] = useState<any[]>([]);
    const [filtro, setFiltro] = useState("");
    const [selecionado, setSelecionado] = useState<any | null>(null);
    const [pagamentoSelecionado, setPagamentoSelecionado] = useState<any | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    
    // --- ESTADOS DE NOTIFICAÇÃO ---
    const [alertaSaude, setAlertaSaude] = useState<{nome: string, horario: string, remedio: string} | null>(null);
    const [notificacaoSucesso, setNotificacaoSucesso] = useState<string | null>(null);

    const [meuCadastro, setMeuCadastro] = useState<any>(null);
    const [gerandoPagamento, setGerandoPagamento] = useState(false);
    const [config, setConfig] = useState({ valorTotal: "0,00", valorSinal: "0,00", idadeMinima: "12" });
    const [userData, setUserData] = useState<any>(null);
    const [loadingUser, setLoadingUser] = useState(true);

    const handleMoeda = (e: ChangeEvent<HTMLInputElement>, campo: "valorTotal" | "valorSinal") => {
        let valor = e.target.value.replace(/\D/g, "");
        const valorNumerico = Number(valor) / 100;
        const formatado = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valorNumerico);
        setConfig(prev => ({ ...prev, [campo]: formatado }));
    };

    useEffect(() => {
        const unsubAuth = auth.onAuthStateChanged(async (user) => {
            if (user && user.email) {
                const docRef = doc(db, "contas_acesso", user.email);
                const docSnap = await getDoc(docRef);
                setUserData(docSnap.exists() ? docSnap.data() : { permissaoEncontro: [] });

                const qInscrito = query(collection(db, "encontro_inscritos"), where("email", "==", user.email));
                const snapInscrito = await getDocs(qInscrito);
                if (!snapInscrito.empty) {
                    onSnapshot(doc(db, "encontro_inscritos", snapInscrito.docs[0].id), (doc) => {
                        setMeuCadastro({ id: doc.id, ...doc.data() });
                    });
                }
            }
            setLoadingUser(false);
        });
        return () => unsubAuth();
    }, []);

    const userEmail = auth.currentUser?.email || "";
    const permissoes = Array.isArray(userData?.permissaoEncontro) ? userData.permissaoEncontro : [userData?.permissaoEncontro || ""].filter(Boolean);
    const isSaude = userEmail === "gab.alves0531@gmail.com" || permissoes.some((p: string) => p.toLowerCase() === "saude"); // CORREÇÃO TS: (p: string)
    const isFinanceiro = userEmail === "gab.alves0531@gmail.com" || permissoes.some((p: string) => p.toLowerCase() === "financeiro");
    const isRecepcao = userEmail === "gab.alves0531@gmail.com" || permissoes.some((p: string) => p.toLowerCase() === "recepcao");
    const isCoordenador = userEmail === "gab.alves0531@gmail.com" || permissoes.some((p: string) => p.toLowerCase() === "coordenador");

    // --- LÓGICA DE MONITORAMENTO DE ALERTAS DE SAÚDE ---
    useEffect(() => {
        if (!isSaude || aba !== "saude") return;

        const monitorarHorarios = () => {
            const agora = new Date();
            const hojeStr = agora.toLocaleDateString();

            inscritos.forEach(i => {
                if (!i.horariosMedicacao) return;
                const horarios = i.horariosMedicacao.split(',').map((h: string) => h.trim()); // CORREÇÃO TS: (h: string)
                
                horarios.forEach((h: string) => { // CORREÇÃO TS: (h: string)
                    const [hora, min] = h.split(':').map(Number);
                    const dataMed = new Date(); dataMed.setHours(hora, min, 0);

                    const diffMin = (dataMed.getTime() - agora.getTime()) / 60000;
                    const jaDado = i.historicoSaude?.some((log: any) => 
                        log.horarioAgendado === h && new Date(log.data).toLocaleDateString() === hojeStr
                    );

                    // Se faltar entre 0 e 30 minutos e não foi dado, dispara o Alerta Premium
                    if (diffMin > 0 && diffMin <= 30 && !jaDado && !alertaSaude) {
                        setAlertaSaude({ nome: i.nome, horario: h, remedio: i.remediosControlados });
                    }
                });
            });
        };

        const timer = setInterval(monitorarHorarios, 60000);
        return () => clearInterval(timer);
    }, [inscritos, isSaude, aba, alertaSaude]);

    // --- MONITORAMENTO FIRESTORE ---
    useEffect(() => {
        const q = query(collection(db, aba === "coordenacao" ? "contas_acesso" : (aba === "servos" ? "encontro_servos" : "encontro_inscritos")), orderBy("nome", "asc"));
        return onSnapshot(q, (snap) => {
            const dados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            aba === "coordenacao" ? setUsuariosSistema(dados) : setInscritos(dados);
        });
    }, [aba]);

    const registrarEntregaMedicamento = async (id: string, remedio: string, h: string) => {
        await updateDoc(doc(db, "encontro_inscritos", id), { 
            historicoSaude: arrayUnion({ remedio, horarioAgendado: h, data: new Date().toISOString(), responsavel: userData?.nome || userEmail }) 
        });
        if (alertaSaude?.nome === inscritos.find(x => x.id === id)?.nome) setAlertaSaude(null);
        setNotificacaoSucesso(`Dose das ${h} registrada!`);
        setTimeout(() => setNotificacaoSucesso(null), 3000);
    };

    // --- SESSÃO 2: QR SCANNER ---
    useEffect(() => {
        let scanner: Html5QrcodeScanner | null = null;
        if (isScanning) {
            scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 }, false);
            scanner.render(async (text) => {
                if (scanner) { scanner.clear(); setIsScanning(false); }
                await processarCheckInViaQR(text);
            }, () => {});
        }
        return () => { if (scanner) scanner.clear().catch(() => {}); };
    }, [isScanning]);

    const processarCheckInViaQR = async (token: string) => {
        try {
            const q = query(collection(db, "encontro_inscritos"), where("tokenAcesso", "==", token));
            const snap = await getDocs(q);
            let docRef = !snap.empty ? doc(db, "encontro_inscritos", snap.docs[0].id) : null;
            let dados = !snap.empty ? snap.docs[0].data() : null;
            if (!docRef) {
                const qS = query(collection(db, "encontro_servos"), where("tokenAcesso", "==", token));
                const snapS = await getDocs(qS);
                if (!snapS.empty) { docRef = doc(db, "encontro_servos", snapS.docs[0].id); dados = snapS.docs[0].data(); }
            }
            if (docRef && dados) {
                await updateDoc(docRef, { chegouNoLocal: true, dataCheckIn: new Date().toISOString() });
                setNotificacaoSucesso(`Check-in: ${dados.nome}`);
                setTimeout(() => setNotificacaoSucesso(null), 3000);
            }
        } catch (err) { console.error(err); }
    };

    const toggleCheckIn = async (id: string, estado: boolean) => {
        await updateDoc(doc(db, aba === "servos" ? "encontro_servos" : "encontro_inscritos", id), { chegouNoLocal: !estado, dataCheckIn: !estado ? new Date().toISOString() : null });
    };

    const alternarPapelEquipe = async (id: string, papel: string, ativo: boolean) => {
        const ref = doc(db, "contas_acesso", id);
        const snap = await getDoc(ref);
        let list = snap.data()?.permissaoEncontro || [];
        if (!Array.isArray(list)) list = [list].filter(Boolean);
        await updateDoc(ref, { permissaoEncontro: ativo ? [...list, papel] : list.filter((p: string) => p !== papel) });
    };

    const listaFiltrada = (aba === "coordenacao" ? usuariosSistema : inscritos)
        .filter((i: any) => i.nome?.toLowerCase().includes(filtro.toLowerCase()) || i.cpf?.includes(filtro))
        .sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));

    if (loadingUser) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 pt-20 md:pt-28 pb-10 px-4 md:px-6 font-body text-left relative overflow-x-hidden">
            
            {/* --- POPUPS BONITOS (OVERLAYS) --- */}
            {alertaSaude && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-md animate-in slide-in-from-top-10 duration-500">
                    <div className="bg-red-600 text-white p-6 rounded-[2.5rem] shadow-2xl flex items-center gap-4 border-4 border-white/20">
                        <div className="bg-white/20 p-3 rounded-2xl animate-bounce"><BellRing size={24}/></div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black uppercase opacity-80">Alerta de Horário</p>
                            <h4 className="font-bold text-sm uppercase leading-tight">{alertaSaude.nome} • {alertaSaude.horario}</h4>
                            <p className="text-[9px] italic opacity-90">{alertaSaude.remedio}</p>
                        </div>
                        <button onClick={() => setAlertaSaude(null)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={20}/></button>
                    </div>
                </div>
            )}

            {notificacaoSucesso && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-bottom-10">
                    <div className="bg-slate-900 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest border border-white/10">
                        {/* CORREÇÃO TS: Usando CheckCircle2 importado */}
                        <CheckCircle2 size={18} className="text-emerald-400"/> {notificacaoSucesso}
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                
                {/* HEADER */}
                <section className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50" />
                    <div className="relative z-10 flex flex-col gap-6">
                        <h1 className="font-display text-2xl md:text-4xl font-bold text-slate-900 uppercase">Painel <span className="text-blue-600">Encontro</span></h1>
                        <div className="flex flex-wrap gap-1.5">{permissoes.map((p: string) => (<span key={p} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded-md border border-blue-100 flex items-center gap-1"><Shield size={8}/> {p}</span>))}</div>
                        {isCoordenador && (
                            <div className="grid grid-cols-2 md:flex md:items-end gap-3 border-t border-slate-50 pt-4">
                                <div className="space-y-1"><label className="text-[8px] font-black uppercase text-slate-400">Total</label><input type="text" value={config.valorTotal} onChange={e => handleMoeda(e, "valorTotal")} className="w-full md:w-32 bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold" /></div>
                                <div className="space-y-1"><label className="text-[8px] font-black uppercase text-emerald-400">Sinal</label><input type="text" value={config.valorSinal} onChange={e => handleMoeda(e, "valorSinal")} className="w-full md:w-32 bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold" /></div>
                                <button onClick={() => setDoc(doc(db, "configuracoes", "encontro_geral"), config)} className="bg-slate-900 text-white p-3 rounded-xl shadow-lg hover:bg-blue-600 transition-all"><Save size={18} /></button>
                            </div>
                        )}
                    </div>
                </section>

                {/* NAVEGAÇÃO */}
                <div className="flex flex-col gap-4">
                    <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
                        {(isFinanceiro || isRecepcao) && <button onClick={() => setAba("encontristas")} className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${aba === "encontristas" ? "bg-blue-600 text-white shadow-md" : "text-slate-400"}`}>Encontristas</button>}
                        {(isFinanceiro || isRecepcao) && <button onClick={() => setAba("servos")} className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${aba === "servos" ? "bg-blue-600 text-white shadow-md" : "text-slate-400"}`}>Servos</button>}
                        {isSaude && <button onClick={() => setAba("saude")} className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${aba === "saude" ? "bg-red-600 text-white shadow-md" : "text-slate-400"}`}>Saúde</button>}
                        {isCoordenador && <button onClick={() => setAba("coordenacao")} className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${aba === "coordenacao" ? "bg-slate-900 text-white shadow-md" : "text-slate-400"}`}><Crown size={12}/> Coordenação</button>}
                        {meuCadastro && <button onClick={() => setAba("meu-cracha")} className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${aba === "meu-cracha" ? "bg-emerald-500 text-white shadow-md" : "text-emerald-600 bg-emerald-50"}`}><Ticket size={12}/> Meu Crachá</button>}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                        {isRecepcao && aba !== "meu-cracha" && <button onClick={() => setIsScanning(!isScanning)} className={`w-full sm:w-auto p-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest ${isScanning ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white'}`}>{isScanning ? <><CameraOff size={16}/> Fechar</> : <><QrCode size={16}/> Scanner</>}</button>}
                        {aba !== "meu-cracha" && <div className="relative flex-1 w-full text-left"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} /><input type="text" placeholder="Buscar participante..." className="w-full bg-white border border-slate-100 p-4 pl-12 rounded-xl text-[10px] font-black uppercase shadow-md outline-none focus:border-blue-400" value={filtro} onChange={e => setFiltro(e.target.value)} /></div>}
                    </div>
                </div>

                {isScanning && <div className="max-w-xs md:max-w-md mx-auto animate-in zoom-in-95 duration-300"><div className="bg-white p-4 rounded-[2.5rem] border-4 border-indigo-100 shadow-2xl overflow-hidden"><div id="reader" className="rounded-xl overflow-hidden"></div></div></div>}

                {/* --- TABELA GERAL --- */}
                {(aba === "encontristas" || aba === "servos") && (
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl overflow-x-auto no-scrollbar">
                        <table className="w-full text-left min-w-[500px]">
                            <thead className="bg-slate-50 border-b border-slate-100"><tr className="text-[9px] font-black uppercase text-slate-400 tracking-widest"><th className="p-5">Nome</th><th className="p-5 text-center">Financeiro</th><th className="p-5 text-center">Check-in</th><th className="p-5 text-right">Ver</th></tr></thead>
                            <tbody className="divide-y divide-slate-50">
                                {listaFiltrada.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-5"><p className="font-bold text-slate-800 text-[11px] uppercase truncate max-w-[150px]">{item.nome}</p><div className="flex gap-2 mt-0.5"><p className="text-[8px] font-mono text-slate-400">{item.cpf}</p>{(item.problemasSaude?.length > 0 || item.remediosControlados) && <HeartPulse size={10} className="text-red-500" />}</div></td>
                                        <td className="p-5 text-center"><button onClick={() => setPagamentoSelecionado(item)} className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border transition-all ${item.confirmado ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>{item.confirmado ? 'Pago' : 'Pendente'}</button></td>
                                        <td className="p-5 text-center"><button onClick={() => toggleCheckIn(item.id, item.chegouNoLocal)} className={`p-2 rounded-lg border transition-all mx-auto ${item.chegouNoLocal ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>{item.chegouNoLocal ? <UserCheck size={14}/> : <MapPin size={14}/>}</button></td>
                                        <td className="p-5 text-right"><button onClick={() => setSelecionado(item)} className="p-2 text-slate-300 hover:text-blue-600 transition-all"><Eye size={18}/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- ABA SAÚDE --- */}
                {aba === "saude" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                        {listaFiltrada.filter(i => i.horariosMedicacao).map(i => {
                            const horarios = i.horariosMedicacao.split(',').map((h: string) => h.trim());
                            const hojeStr = new Date().toLocaleDateString();

                            return (
                                <div key={i.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-4 text-left">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center border border-red-100"><Stethoscope size={18}/></div>
                                            <div><h3 className="font-bold text-slate-800 text-xs uppercase">{i.nome}</h3><p className="text-[8px] font-black text-red-400 uppercase tracking-widest">{i.problemasSaude?.join(", ")}</p></div>
                                        </div>
                                        <button onClick={() => setSelecionado(i)} className="p-2 bg-slate-50 text-slate-300 hover:text-blue-600 rounded-lg"><Eye size={16}/></button>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[7px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1"><Pill size={8}/> {i.remediosControlados}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {horarios.map((h: string) => {
                                                const [hora, min] = h.split(':').map(Number);
                                                const dataMed = new Date(); dataMed.setHours(hora, min, 0);
                                                const diffMin = (dataMed.getTime() - new Date().getTime()) / 60000;
                                                const jaDado = i.historicoSaude?.some((log: any) => log.horarioAgendado === h && new Date(log.data).toLocaleDateString() === hojeStr);

                                                let btnClass = "bg-white text-slate-400 border-slate-100";
                                                let Icon = Clock;

                                                if (jaDado) { btnClass = "bg-emerald-500 text-white border-emerald-500 shadow-sm"; Icon = Check; }
                                                else if (diffMin > -30 && diffMin <= 30) { btnClass = "bg-red-600 text-white border-red-600 animate-pulse shadow-md"; Icon = AlarmClock; }
                                                else if (diffMin < -30) { btnClass = "bg-orange-100 text-orange-600 border-orange-200"; Icon = AlertCircle; }

                                                return (
                                                    <button key={h} disabled={jaDado} onClick={() => registrarEntregaMedicamento(i.id, i.remediosControlados, h)} className={`px-3 py-2 rounded-xl text-[9px] font-black border flex items-center gap-1.5 transition-all ${btnClass}`}>
                                                        <Icon size={12}/> {h}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ABA COORDENAÇÃO MANTIDA */}
                {aba === "coordenacao" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                        {listaFiltrada.map(u => {
                            const uPerms = Array.isArray(u.permissaoEncontro) ? u.permissaoEncontro : [];
                            return (
                                <div key={u.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 uppercase text-xs">{u.nome?.charAt(0)}</div>
                                        <div className="flex-1 min-w-0"><p className="font-bold text-slate-800 text-xs truncate uppercase leading-none">{u.nome}</p><p className="text-[8px] text-slate-400 font-mono mt-1 truncate">{u.email}</p></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 border-t border-slate-50 pt-3">
                                        {["Saude", "Financeiro", "Recepcao", "Coordenador"].map(role => {
                                            const isSelected = uPerms.includes(role);
                                            return (<button key={role} onClick={() => alternarPapelEquipe(u.id, role, !isSelected)} className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-100 text-slate-300'}`}>{role}</button>);
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* --- MODAL FINANCEIRO --- */}
            {pagamentoSelecionado && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6" onClick={() => setPagamentoSelecionado(null)}>
                    <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className={`absolute top-0 left-0 w-full h-2 ${pagamentoSelecionado.confirmado ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                        <button onClick={() => setPagamentoSelecionado(null)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-900 bg-slate-50 rounded-xl transition-all"><X size={20}/></button>
                        <div className="text-center space-y-6">
                            <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border-2 ${pagamentoSelecionado.confirmado ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>{pagamentoSelecionado.confirmado ? <CheckCircle2 size={32}/> : <Wallet size={32}/>}</div>
                            <h3 className="text-xl font-display font-bold text-slate-900 uppercase tracking-tighter leading-none">{pagamentoSelecionado.nome}</h3>
                            <div className="grid grid-cols-2 gap-3 text-left">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Total</p><p className="text-lg font-display font-bold text-slate-800">R$ {pagamentoSelecionado.valorTotal?.toFixed(2)}</p></div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left"><p className="text-[8px] font-black text-emerald-400 uppercase mb-1">Pago</p><p className="text-lg font-display font-bold text-emerald-600">R$ {pagamentoSelecionado.valorPago?.toFixed(2)}</p></div>
                            </div>
                            {!pagamentoSelecionado.confirmado && (
                                <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100 space-y-4">
                                    <div className="text-left"><p className="text-[10px] font-black text-orange-400 uppercase">Saldo Devedor</p><p className="text-3xl font-display font-bold text-orange-600 leading-none tracking-tighter">R$ {(pagamentoSelecionado.valorTotal - (pagamentoSelecionado.valorPago || 0)).toFixed(2)}</p></div>
                                    <div className="w-full bg-orange-100 h-2 rounded-full overflow-hidden"><div className="bg-orange-500 h-full transition-all duration-1000" style={{ width: `${((pagamentoSelecionado.valorPago || 0) / (pagamentoSelecionado.valorTotal || 1)) * 100}%` }} /></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL DETALHES GERAIS (FICHA MÉDICA) --- */}
            {selecionado && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6" onClick={() => setSelecionado(null)}>
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300 relative text-left" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-8 text-left">
                            <div className="text-left"><h2 className="text-2xl font-display font-bold text-slate-900 uppercase tracking-tighter leading-none text-left">{selecionado.nome}</h2><p className="text-blue-500 text-[10px] font-black uppercase mt-1 tracking-widest text-left">Ficha Médica Detalhada</p></div>
                            <button onClick={() => setSelecionado(null)} className="p-2 text-slate-300 bg-slate-50 rounded-xl hover:text-red-500 transition-all"><X size={20} /></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                            <div className="space-y-4 text-left">
                                <p className="text-[8px] font-black uppercase text-slate-400 border-b border-slate-50 pb-1 tracking-widest text-left">Dados Pessoais</p>
                                <p className="text-xs font-bold text-slate-600 flex justify-between uppercase">Tel: <span className="text-slate-900">{selecionado.telefone}</span></p>
                                <p className="text-xs font-bold text-slate-600 flex justify-between uppercase">CPF: <span className="text-slate-900 font-mono">{selecionado.cpf}</span></p>
                                <div className="space-y-1 pt-2">
                                    <p className="text-[10px] font-black text-red-400 tracking-widest uppercase">Medicamentos</p>
                                    <p className="text-[11px] font-medium text-slate-500 italic bg-red-50/50 p-4 rounded-2xl border border-red-50 leading-relaxed">{selecionado.remediosControlados || "Sem medicação reportada."}</p>
                                </div>
                            </div>
                            <div className="space-y-4 text-left">
                                <p className="text-[10px] font-black uppercase text-emerald-600 border-b border-emerald-50 pb-1 tracking-widest flex items-center gap-1.5"><ClipboardList size={14}/> Log Administrativo</p>
                                <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100 max-h-[250px] overflow-y-auto no-scrollbar scroll-smooth">
                                    {selecionado.historicoSaude?.length > 0 ? selecionado.historicoSaude.map((log: any, idx: number) => (
                                        <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 text-[10px]">
                                            <p className="font-black text-slate-700 italic">{log.remedio} • {log.horarioAgendado}</p>
                                            <div className="flex justify-between text-slate-400 mt-1 uppercase font-bold tracking-tighter"><span>{new Date(log.data).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span><span>Resp: {log.responsavel.split(' ')[0]}</span></div>
                                        </div>
                                    )) : <p className="text-[10px] text-slate-400 font-bold uppercase text-center py-4 italic opacity-50">Nenhum log encontrado</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}