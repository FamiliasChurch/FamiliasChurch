import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../lib/firebase";
import { 
  collection, query, where, onSnapshot, orderBy, 
  doc, updateDoc, writeBatch, getDocs 
} from "firebase/firestore";
import { 
  Bell, Check, X, Trash2, ExternalLink, 
  CheckCircle, AlertCircle 
} from "lucide-react";

export default function NotificationBell() {
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Estado para o Toast (Notificação Bonita)
  const [toast, setToast] = useState<{
      show: boolean;
      message: string;
      type: 'success' | 'error';
  }>({ show: false, message: "", type: 'success' });

  const userEmail = auth.currentUser?.email;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Função Auxiliar para mostrar o Toast
  const showToast = (message: string, type: 'success' | 'error') => {
      setToast({ show: true, message, type });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // Carregar Notificações
  useEffect(() => {
    if (!userEmail) return;

    // Busca notificações do usuário OU gerais ("ALL")
    const q = query(
      collection(db, "notificacoes_usuario"),
      where("toEmail", "in", ["ALL", userEmail]),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotificacoes(data);
      setUnreadCount(data.filter((n: any) => !n.read).length);
    });

    return () => unsub();
  }, [userEmail]);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. MARCAR COMO LIDA (Individual)
  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if(e) e.stopPropagation(); // Não abre o link se clicar só no check
    try {
      await updateDoc(doc(db, "notificacoes_usuario", id), { read: true });
    } catch (e) { console.log(e); }
  };

  // 2. AÇÃO DE CLIQUE (Ler + Navegar)
  const handleNotificationClick = async (notif: any) => {
    // Marca como lida se não estiver
    if (!notif.read) {
        markAsRead(notif.id);
    }
    
    setShowDropdown(false); // Fecha o menu

    // Redireciona (se tiver link)
    if (notif.link) {
        navigate(notif.link);
    }
  };

  // 3. LIMPAR TODAS (Batch Delete)
  const clearAllNotifications = async () => {
    if(!userEmail) return;
    
    try {
        const batch = writeBatch(db);
        const q = query(collection(db, "notificacoes_usuario"), where("toEmail", "==", userEmail));
        const snap = await getDocs(q);
        
        if (snap.empty) {
            showToast("Nada para limpar.", "error");
            return;
        }

        snap.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        showToast("Todas as notificações foram removidas!", "success");
        setShowDropdown(false);
    } catch (error) {
        console.error("Erro ao limpar", error);
        showToast("Erro ao limpar notificações.", "error");
    }
  };

  if (!userEmail) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      
      {/* --- TOAST FLUTUANTE (FIXO NA TELA) --- */}
      <div 
        className={`fixed top-24 right-5 z-[9999] transform transition-all duration-500 ease-out pointer-events-none ${
          toast.show ? "translate-x-0 opacity-100" : "translate-x-20 opacity-0"
        }`}
      >
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md pointer-events-auto ${
          toast.type === 'error' 
            ? "bg-white/95 border-red-100 text-red-600" 
            : "bg-white/95 border-emerald-100 text-emerald-600"
        }`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      </div>

      {/* BOTÃO DO SININHO */}
      <button 
        onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
        className="relative p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-all active:scale-95"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
        )}
      </button>

      {/* DROPDOWN MENU */}
      {showDropdown && (
        <>
          <div className="fixed inset-0 bg-transparent z-40 md:hidden" onClick={() => setShowDropdown(false)} />

          <div className={`
            z-50 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200
            fixed top-20 left-4 right-4 mx-auto max-w-sm
            md:absolute md:top-full md:right-0 md:left-auto md:mt-2 md:w-96
          `}>
            
            {/* CABEÇALHO */}
            <div className="p-4 border-b border-slate-50 bg-slate-50/80 backdrop-blur-sm flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-sm">Notificações</h3>
                  {unreadCount > 0 && <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded-full">{unreadCount} NOVAS</span>}
              </div>
              
              <div className="flex items-center gap-1">
                  {notificacoes.length > 0 && (
                      <button 
                        onClick={clearAllNotifications}
                        className="text-[9px] font-bold uppercase text-slate-400 hover:text-red-500 flex items-center gap-1 px-2 py-1 hover:bg-red-50 rounded-lg transition-all"
                        title="Limpar todas"
                      >
                        <Trash2 size={12} /> Limpar
                      </button>
                  )}
                  <button onClick={() => setShowDropdown(false)} className="p-1 hover:bg-slate-200 rounded-full md:hidden">
                      <X size={16} className="text-slate-400" />
                  </button>
              </div>
            </div>
            
            {/* LISTA */}
            <div className="max-h-[60vh] md:max-h-[400px] overflow-y-auto custom-scrollbar bg-white">
              {notificacoes.length === 0 ? (
                <div className="py-12 px-6 text-center flex flex-col items-center gap-3">
                  <div className="p-3 bg-slate-50 rounded-full"><Bell size={24} className="text-slate-300" /></div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Sem novidades por enquanto</p>
                </div>
              ) : (
                notificacoes.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`
                        relative p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3 cursor-pointer group
                        ${notif.read ? 'opacity-60 bg-white' : 'bg-blue-50/40'}
                    `}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    {/* Indicador de Status */}
                    <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${notif.read ? 'bg-slate-200' : 'bg-blue-500 shadow-sm'}`} />
                    
                    <div className="flex-1 min-w-0 pr-6">
                      <p className={`text-xs text-slate-800 mb-0.5 truncate ${notif.read ? 'font-medium' : 'font-black'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">
                            {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleDateString('pt-BR') : 'Agora'}
                          </span>
                          {/* Ícone indicando que é clicável */}
                          {notif.link && <ExternalLink size={10} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </div>
                    </div>

                    {/* Botão de Marcar como lida (Ação secundária) */}
                    {!notif.read && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <button 
                                onClick={(e) => markAsRead(notif.id, e)}
                                className="p-2 text-blue-300 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-all"
                                title="Marcar como lida"
                            >
                              <Check size={16} />
                            </button>
                        </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}