import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export default function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };
    
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const onClick = (evt: any) => {
    evt.preventDefault();
    if (!promptInstall) return;
    
    promptInstall.prompt();
    promptInstall.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
            setSupportsPWA(false); // Esconde o botão após instalar
        }
    });
  };

  if (!supportsPWA) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full p-3 rounded-xl text-[10px] font-black uppercase text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all mb-2"
      id="setup_button"
      aria-label="Instalar App"
      title="Instalar App"
    >
      <Download size={16} />
      Instalar App
    </button>
  );
}