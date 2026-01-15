import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { User, Save, Camera, Loader2, CheckCircle, AlertCircle, LogOut, Lock, FileText, Smartphone, Mail } from "lucide-react";
import MembershipCard from "./MembershipCard"; 

export default function ProfilePage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [userData, setUserData] = useState<any>({});
    
    // --- ESTADO PARA COMPARAR CARGO ANTERIOR ---
    const [originalRole, setOriginalRole] = useState(""); 

    // --- ESTADOS DE CONTROLE DE TABS E UI ---
    const [activeTab, setActiveTab] = useState<'profile' | 'card'>('profile'); 
    const [confirmTerms, setConfirmTerms] = useState(false); 

    // --- ESTADOS DE BLOQUEIO (SÓ EDITA UMA VEZ) ---
    const [cpfLocked, setCpfLocked] = useState(false);
    const [nascimentoLocked, setNascimentoLocked] = useState(false);
    const [sexoLocked, setSexoLocked] = useState(false);

    // Notificação
    const [notification, setNotification] = useState<{
        show: boolean; message: string; type: 'error' | 'success';
    }>({ show: false, message: "", type: 'success' });

    const showNotification = (message: string, type: 'error' | 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
    };

    // Máscaras
    const formatPhone = (v: string) => v.replace(/\D/g, "").substring(0, 11).replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    const formatCPF = (v: string) => v.replace(/\D/g, "").substring(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

    const CLOUD_NAME = "ddndbv7do";
    const UPLOAD_PRESET = "ddndbv7do";

    // --- FUNÇÃO AUXILIAR PARA GERAR NOVO RA ---
    const generateNewRA = (cargo: string) => {
        const getRoleParams = (c: string) => {
            const up = c?.toUpperCase() || "";
            if (up === 'DEV') return { code: 'DV', level: 0 };
            if (up.includes('APÓSTOLO') || up.includes('APOSTOLO')) return { code: 'AP', level: 1 };
            if (up.includes('PASTOR')) return { code: 'PA', level: 2 };
            if (up.includes('SECRETARIA')) return { code: 'SE', level: 3 };
            if (up.includes('EVANGELISTA')) return { code: 'EV', level: 4 };
            if (up.includes('PRESBÍTERO') || up.includes('PRESBITERO')) return { code: 'PR', level: 5 };
            if (up.includes('DIÁCONO') || up.includes('DIACONO')) return { code: 'DI', level: 6 };
            if (up.includes('OBREIRO')) return { code: 'OB', level: 7 };
            if (up.includes('MÍDIA') || up.includes('MIDIA')) return { code: 'MI', level: 8 };
            return { code: 'ME', level: 9 };
        };

        const { code, level } = getRoleParams(cargo);
        const randomChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const randomNums = Math.floor(1000 + Math.random() * 9000);
        
        return `${code}${level}${randomChar}${randomNums}`;
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (user && user.email) {
                const docRef = doc(db, "contas_acesso", user.email);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data();
                    
                    // Prioriza o email salvo no banco como contato, senão usa o do Auth
                    setUserData({ ...data, email: data.email || user.email });
                    
                    setOriginalRole(data.cargo || ""); 
                    
                    // --- LÓGICA DE BLOQUEIO ---
                    if (data.cpf && data.cpf.length > 5) setCpfLocked(true);
                    if (data.nascimento && data.nascimento.length > 5) setNascimentoLocked(true);
                    if (data.sexo && data.sexo.length > 2) setSexoLocked(true);
                }
                setLoading(false);
            } else {
                navigate("/login");
            }
        });
        return () => unsub();
    }, [navigate]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", UPLOAD_PRESET);
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
            const data = await response.json();
            if (data.secure_url) {
                setUserData({ ...userData, foto: data.secure_url });
                showNotification("Foto carregada! Clique em Salvar.", "success");
            }
        } catch {
            showNotification("Erro ao enviar imagem.", "error");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!confirmTerms) {
            showNotification("Você precisa confirmar a veracidade dos dados.", "error");
            return;
        }

        setSaving(true);
        try {
            const user = auth.currentUser;
            if (user && user.email) {
                const docRef = doc(db, "contas_acesso", user.email);
                
                // Prepara dados para atualização
                const updateData: any = {
                    nascimento: userData.nascimento || "",
                    sexo: userData.sexo || "",
                    telefone: userData.telefone || "",
                    email: userData.email || user.email,
                    cpf: userData.cpf || "",
                    foto: userData.foto || ""
                };

                // --- LÓGICA DE MUDANÇA DE RA ---
                if (userData.cargo !== originalRole) {
                    const newRA = generateNewRA(userData.cargo);
                    updateData.ra = newRA;
                    
                    const validade = new Date();
                    validade.setFullYear(validade.getFullYear() + 2);
                    updateData.validadeCarteirinha = validade;
                    
                    setUserData((prev: any) => ({ ...prev, ra: newRA }));
                }

                await updateDoc(docRef, updateData);
                
                // TRAVA OS CAMPOS APÓS SALVAR
                if (userData.cpf && userData.cpf.length > 5) setCpfLocked(true);
                if (userData.nascimento && userData.nascimento.length > 5) setNascimentoLocked(true);
                if (userData.sexo && userData.sexo.length > 2) setSexoLocked(true);
                
                showNotification("Perfil atualizado com sucesso!", "success");
                setConfirmTerms(false); 
                
                setOriginalRole(userData.cargo);
            }
        } catch {
            showNotification("Erro ao atualizar perfil.", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-20 px-4 md:px-6 font-body text-slate-900 relative">
            
            {/* TOAST */}
            <div className={`fixed top-24 right-5 z-50 transition-all duration-500 ${notification.show ? "translate-x-0 opacity-100" : "translate-x-20 opacity-0 pointer-events-none"}`}>
                <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border bg-white ${notification.type === 'error' ? "border-red-100 text-red-600" : "border-emerald-100 text-emerald-600"}`}>
                    {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                    <span className="text-sm font-medium">{notification.message}</span>
                </div>
            </div>

            <div className="max-w-3xl mx-auto space-y-8">
                
                {/* CABEÇALHO E ABAS */}
                <div className="space-y-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-display font-bold text-slate-800 uppercase tracking-tight">Área do Membro</h1>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Gerencie seus dados e acesso</p>
                    </div>

                    {/* SELETOR DE ABAS */}
                    <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 flex relative overflow-hidden">
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            <User size={16} /> Editar Perfil
                        </button>
                        <button 
                            onClick={() => setActiveTab('card')}
                            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'card' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            <Smartphone size={16} /> Carteirinha
                        </button>
                    </div>
                </div>

                {/* CONTEÚDO DAS ABAS */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                    
                    {/* --- ABA 1: DADOS DO PERFIL --- */}
                    {activeTab === 'profile' && (
                        <form onSubmit={handleSave} className="p-8 md:p-10 space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                            
                            {/* FOTO */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-100">
                                        {uploading ? (
                                            <div className="w-full h-full flex items-center justify-center bg-black/50"><Loader2 className="animate-spin text-white" /></div>
                                        ) : (
                                            <img src={userData.foto || "https://www.w3schools.com/howto/img_avatar.png"} alt="Perfil" className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2.5 rounded-full cursor-pointer hover:bg-blue-500 transition-colors shadow-lg border-2 border-white">
                                        <Camera size={18} />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                    </label>
                                </div>
                            </div>

                            {/* CAMPOS */}
                            <div className="space-y-5">
                                {/* NOME (FIXO) */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-blue-900 uppercase ml-2 tracking-widest">Nome Completo</label>
                                    <input value={userData.nome || ""} disabled className="w-full bg-slate-50 text-slate-500 border border-slate-200 p-4 rounded-2xl cursor-not-allowed font-bold text-sm" />
                                </div>

                                {/* EMAIL (EDITÁVEL) */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-blue-900 uppercase ml-2 tracking-widest flex items-center gap-1">Email de Contato</label>
                                    <input 
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={userData.email || ""}
                                        onChange={e => setUserData({ ...userData, email: e.target.value })}
                                        className="w-full bg-white border border-slate-300 p-4 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-bold text-slate-700 text-sm"
                                    />
                                    <p className="text-[9px] text-slate-400 ml-2 font-medium">* Alterar este email não muda seu login de acesso.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* CPF - BLOQUEAVEL */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-blue-900 uppercase ml-2 tracking-widest flex items-center gap-1">
                                            CPF {cpfLocked && <Lock size={10} className="text-slate-400" />}
                                        </label>
                                        <input 
                                            placeholder="000.000.000-00"
                                            value={userData.cpf || ""}
                                            onChange={e => !cpfLocked && setUserData({ ...userData, cpf: formatCPF(e.target.value) })}
                                            maxLength={14}
                                            disabled={cpfLocked} 
                                            className={`w-full border p-4 rounded-2xl outline-none font-bold text-slate-700 text-sm transition-all ${cpfLocked ? 'bg-slate-50 border-slate-200 cursor-not-allowed text-slate-400' : 'bg-white border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
                                        />
                                        {cpfLocked && <p className="text-[9px] text-slate-400 ml-2">* Dado imutável. Contate a secretaria.</p>}
                                    </div>

                                    {/* TELEFONE - SEMPRE EDITÁVEL */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-blue-900 uppercase ml-2 tracking-widest">Telefone (WhatsApp)</label>
                                        <input 
                                            type="tel" 
                                            placeholder="(00) 0 0000-0000"
                                            value={userData.telefone || ""}
                                            onChange={e => setUserData({ ...userData, telefone: formatPhone(e.target.value) })}
                                            maxLength={16}
                                            className="w-full bg-white border border-slate-300 p-4 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-bold text-slate-700 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* NASCIMENTO - BLOQUEAVEL */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-blue-900 uppercase ml-2 tracking-widest flex items-center gap-1">
                                            Nascimento {nascimentoLocked && <Lock size={10} className="text-slate-400" />}
                                        </label>
                                        <input 
                                            type="date" 
                                            required 
                                            value={userData.nascimento || ""} 
                                            onChange={e => !nascimentoLocked && setUserData({ ...userData, nascimento: e.target.value })} 
                                            disabled={nascimentoLocked}
                                            className={`w-full border p-4 rounded-2xl outline-none font-bold text-slate-700 text-sm transition-all ${nascimentoLocked ? 'bg-slate-50 border-slate-200 cursor-not-allowed text-slate-400' : 'bg-white border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`} 
                                        />
                                    </div>

                                    {/* SEXO - BLOQUEAVEL */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-blue-900 uppercase ml-2 tracking-widest flex items-center gap-1">
                                            Sexo {sexoLocked && <Lock size={10} className="text-slate-400" />}
                                        </label>
                                        <select 
                                            required 
                                            value={userData.sexo || ""} 
                                            onChange={e => !sexoLocked && setUserData({ ...userData, sexo: e.target.value })} 
                                            disabled={sexoLocked}
                                            className={`w-full border p-4 rounded-2xl outline-none font-bold text-slate-700 text-sm appearance-none ${sexoLocked ? 'bg-slate-50 border-slate-200 cursor-not-allowed text-slate-400' : 'bg-white border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer'}`}
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="Masculino">Masculino</option>
                                            <option value="Feminino">Feminino</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* CONFIRMAÇÃO E BOTÕES */}
                            <div className="pt-6 border-t border-slate-100 space-y-4">
                                <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors group">
                                    <input 
                                        type="checkbox" 
                                        checked={confirmTerms}
                                        onChange={e => setConfirmTerms(e.target.checked)}
                                        className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                    />
                                    <span className="text-xs text-slate-500 group-hover:text-slate-700 font-medium leading-relaxed">
                                        Confirmo que as informações estão corretas. Entendo que CPF, Nascimento e Sexo não poderão ser alterados após salvar.
                                    </span>
                                </label>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <button 
                                        disabled={saving || uploading || !confirmTerms} 
                                        className="w-full bg-blue-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-300"
                                    >
                                        <Save size={18} />
                                        {saving ? "Salvando..." : "Salvar Alterações"}
                                    </button>
                                    
                                    <button 
                                        type="button" 
                                        onClick={() => signOut(auth).then(() => navigate("/"))} 
                                        className="w-full bg-red-50 text-red-500 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        <LogOut size={18} /> Sair da Conta
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* --- ABA 2: CARTEIRINHA --- */}
                    {activeTab === 'card' && (
                        <div className="p-8 md:p-12 flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="mb-8 text-center max-w-md">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
                                    <FileText size={20} className="text-emerald-500" /> Carteirinha Digital
                                </h3>
                                <p className="text-slate-400 text-xs mt-2">
                                    Esta é sua identificação oficial. Apresente o QR Code na recepção.
                                </p>
                            </div>
                            <MembershipCard user={userData} />
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}