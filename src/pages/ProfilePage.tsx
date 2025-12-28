import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { User, Save, Camera, Loader2 } from "lucide-react";

export default function ProfilePage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false); // Estado para o upload da foto
    const [userData, setUserData] = useState<any>({});

    // --- CONFIGURAÇÃO DO CLOUDINARY (Mesma do Doacoes.tsx) ---
    const CLOUD_NAME = "ddndbv7do";
    const UPLOAD_PRESET = "ddndbv7do";

    // Busca dados ao carregar
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (user && user.email) {
                const docRef = doc(db, "contas_acesso", user.email);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setUserData(snap.data());
                }
                setLoading(false);
            } else {
                navigate("/login");
            }
        });
        return () => unsub();
    }, [navigate]);

    // Função para processar a troca de imagem
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", UPLOAD_PRESET);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                { method: "POST", body: formData }
            );

            const data = await response.json();

            if (data.secure_url) {
                // Atualiza o estado local com a nova URL (o usuário ainda precisa clicar em Salvar para gravar no banco)
                setUserData({ ...userData, foto: data.secure_url });
            }
        } catch (error) {
            console.error("Erro no upload:", error);
            alert("Erro ao enviar imagem. Verifique a conexão.");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const user = auth.currentUser;
            if (user && user.email) {
                const docRef = doc(db, "contas_acesso", user.email);

                await updateDoc(docRef, {
                    nascimento: userData.nascimento || "",
                    sexo: userData.sexo || "",
                    telefone: userData.telefone || "",
                    foto: userData.foto || ""
                });

                alert("Perfil atualizado com sucesso!");
            }
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao atualizar perfil.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin w-10 h-10 border-4 border-emerald-600 rounded-full border-t-transparent"></div></div>;

    return (
        <div className="min-h-screen bg-slate-50 pt-32 pb-10 px-6 font-body text-slate-900">
            <div className="max-w-2xl mx-auto space-y-8">

                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
                        <User size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-slate-800">Meu Perfil</h1>
                        <p className="text-slate-500">Mantenha seus dados atualizados para a igreja.</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">

                    {/* Seção de Foto com Upload */}
                    <div className="flex flex-col items-center gap-4 mb-8">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 shadow-inner bg-slate-200">
                                {uploading ? (
                                    <div className="w-full h-full flex items-center justify-center bg-black/50">
                                        <Loader2 className="animate-spin text-white" />
                                    </div>
                                ) : (
                                    <img
                                        src={userData.foto || "https://www.w3schools.com/howto/img_avatar.png"}
                                        alt="Perfil"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>

                            {/* Botão flutuante da câmera */}
                            <label className="absolute bottom-0 right-0 bg-emerald-600 text-white p-2.5 rounded-full cursor-pointer hover:bg-emerald-500 transition-colors shadow-lg border-2 border-white">
                                <Camera size={18} />
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                            </label>
                        </div>

                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {uploading ? "Enviando..." : "Alterar Foto"}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-2">Nome Completo</label>
                            <input
                                value={userData.nome || ""}
                                disabled
                                className="w-full bg-slate-100 text-slate-500 border border-slate-200 p-4 rounded-xl cursor-not-allowed font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-2">E-mail</label>
                            <input
                                value={userData.email || ""}
                                disabled
                                className="w-full bg-slate-100 text-slate-500 border border-slate-200 p-4 rounded-xl cursor-not-allowed font-bold"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-emerald-800 uppercase ml-2">Data de Nascimento</label>
                            <input
                                type="date"
                                required
                                value={userData.nascimento || ""}
                                onChange={e => setUserData({ ...userData, nascimento: e.target.value })}
                                className="w-full bg-white border border-slate-300 p-4 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all font-bold text-slate-700"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-emerald-800 uppercase ml-2">Sexo</label>
                            <select
                                required
                                value={userData.sexo || ""}
                                onChange={e => setUserData({ ...userData, sexo: e.target.value })}
                                className="w-full bg-white border border-slate-300 p-4 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all font-bold text-slate-700"
                            >
                                <option value="">Selecione...</option>
                                <option value="Masculino">Masculino</option>
                                <option value="Feminino">Feminino</option>
                            </select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-emerald-800 uppercase ml-2">WhatsApp / Telefone</label>
                            <input
                                type="tel"
                                placeholder="(00) 00000-0000"
                                value={userData.telefone || ""}
                                onChange={e => setUserData({ ...userData, telefone: e.target.value })}
                                className="w-full bg-white border border-slate-300 p-4 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all font-bold text-slate-700"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            disabled={saving || uploading}
                            className="w-full bg-emerald-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
                        >
                            <Save size={20} />
                            {saving ? "Salvando..." : "Salvar Alterações"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}