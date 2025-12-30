import { createContext, useContext, useState, useRef, ReactNode } from "react";
import { AlertTriangle, X, CheckCircle2, HelpCircle } from "lucide-react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'info' | 'success';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ title: "", message: "" });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  };

  const handleClose = (result: boolean) => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
  };

  // Ícones e Cores Dinâmicos
  const getIcon = () => {
    switch (options.variant) {
        case 'success': return <CheckCircle2 size={32} />;
        case 'info': return <HelpCircle size={32} />;
        default: return <AlertTriangle size={32} />;
    }
  };

  const getColor = () => {
    switch (options.variant) {
        case 'success': return 'text-emerald-500 bg-emerald-50';
        case 'info': return 'text-blue-500 bg-blue-50';
        default: return 'text-red-500 bg-red-50';
    }
  };

  const getBtnColor = () => {
    switch (options.variant) {
        case 'success': return 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30';
        case 'info': return 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30';
        default: return 'bg-red-500 hover:bg-red-600 shadow-red-500/30';
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      
      {/* O MODAL VISUAL - Fica "escondido" até ser chamado */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 font-body">
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in" 
                onClick={() => handleClose(false)}
            ></div>

            <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 border border-slate-100">
                <button 
                    onClick={() => handleClose(false)}
                    className="absolute top-4 right-4 p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${getColor()}`}>
                        {getIcon()}
                    </div>
                    
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">{options.title}</h3>
                        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                            {options.message}
                        </p>
                    </div>

                    <div className="flex gap-3 w-full pt-4">
                        <button 
                            onClick={() => handleClose(false)}
                            className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors uppercase text-xs tracking-widest"
                        >
                            {options.cancelText || "Cancelar"}
                        </button>
                        <button 
                            onClick={() => handleClose(true)}
                            className={`flex-1 py-3 text-white rounded-xl font-bold transition-all shadow-lg uppercase text-xs tracking-widest ${getBtnColor()}`}
                        >
                            {options.confirmText || "Confirmar"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

// Hook para usar fácil
export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm deve ser usado dentro de ConfirmProvider");
  return context;
};