import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScanLine, X, QrCode } from "lucide-react";
import { Scanner } from '@yudiel/react-qr-scanner';

export default function FloatingScannerButton({ userRole }: { userRole: string }) {
  const [isScanning, setIsScanning] = useState(false);
  const navigate = useNavigate();

  // REGRAS DE PERMISSÃO: Admin, Gerenciador, Moderador (e Dev)
  const allowedRoles = ["dev", "admin", "gerenciador", "moderador"];
  const canScan = allowedRoles.includes(userRole?.toLowerCase());

  if (!canScan) return null;

  const handleScan = (detectedCodes: any) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const rawValue = detectedCodes[0].rawValue;
      
      try {
        if (rawValue.includes('/validar/')) {
            const parts = rawValue.split('/validar/');
            const ra = parts[1]; 
            if (ra) {
                setIsScanning(false);
                navigate(`/validar/${ra}`);
                return;
            }
        }
      } catch (e) {
        console.error("Erro ao processar QR", e);
      }
      
      setIsScanning(false);
      navigate(`/validar/${rawValue}`);
    }
  };

  return (
    <>
      {/* BOTÃO FLUTUANTE (FAB) */}
      {/* Adicionei 'lg:hidden' para sumir em telas grandes (notebooks/desktops) */}
      <button
        onClick={() => setIsScanning(true)}
        className="fixed bottom-6 right-6 z-[9990] bg-slate-900 text-white p-4 rounded-full shadow-2xl border border-slate-700 hover:scale-110 hover:shadow-emerald-500/20 hover:border-emerald-500/50 active:scale-95 transition-all duration-300 group lg:hidden"
        title="Ler Carteirinha"
      >
        <ScanLine size={28} className="group-hover:text-emerald-400 transition-colors" />
        
        {/* Tooltip Lateral (Mobile friendly) */}
        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
          Ler Credencial
        </span>
      </button>

      {/* MODAL DE SCANNER (TELA CHEIA) */}
      {isScanning && (
        <div className="fixed inset-0 z-[10000] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300">
          
          {/* Botão Fechar */}
          <button 
            onClick={() => setIsScanning(false)}
            className="absolute top-safe-top right-6 mt-6 z-20 bg-white/10 text-white p-3 rounded-full hover:bg-white/20 backdrop-blur-md transition-all"
          >
            <X size={24} />
          </button>

          <div className="w-full max-w-md px-6 relative flex flex-col items-center">
            <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest mb-4">
                    <QrCode size={14} /> Modo Leitura
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Aponte para o QR Code</h3>
                <p className="text-slate-400 text-sm">Centralize a credencial do membro na área marcada</p>
            </div>

            {/* Área da Câmera */}
            <div className="w-full aspect-square relative rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-black">
                <Scanner 
                    onScan={handleScan}
                    components={{ finder: false }} 
                    styles={{ container: { width: '100%', height: '100%' } }}
                />
                
                {/* Overlay Gráfico (Mira) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-64 border-2 border-emerald-500/30 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-lg"></div>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#34d399] animate-[scan_2s_infinite_linear]"></div>
                    </div>
                </div>
            </div>

            <p className="text-slate-500 text-xs mt-8 font-mono uppercase tracking-widest">Aguardando Captura...</p>
          </div>
        </div>
      )}
    </>
  );
}