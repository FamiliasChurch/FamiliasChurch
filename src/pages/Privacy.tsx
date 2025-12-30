import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 font-body text-slate-800">
      <div className="max-w-3xl mx-auto bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200">
        
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline mb-8">
          <ArrowLeft size={16} /> Voltar
        </Link>

        <header className="mb-10 border-b border-slate-100 pb-8">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Shield size={24} />
          </div>
          <h1 className="font-display text-4xl font-bold text-blue-900 mb-2">Política de Privacidade</h1>
          <p className="text-slate-500">Última atualização: Dezembro de 2025</p>
        </header>

        <div className="space-y-8 leading-relaxed text-slate-600">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Informações que Coletamos</h2>
            <p>Ao utilizar nossa plataforma, podemos coletar os seguintes dados:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Dados de Autenticação:</strong> Nome, endereço de e-mail e foto de perfil (Google).</li>
              <li><strong>Dados Cadastrais:</strong> Telefone, data de nascimento e endereço (opcionais).</li>
              <li><strong>Dados Espirituais:</strong> Pedidos de oração e testemunhos.</li>
              <li><strong>Dados Financeiros:</strong> Registros de dízimos e ofertas para fins de auditoria.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Uso das Informações</h2>
            <p>Utilizamos seus dados para gerenciar seu acesso à área de membros, enviar notificações importantes da igreja e permitir o cuidado pastoral pela liderança.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Compartilhamento de Dados</h2>
            <p>Não vendemos seus dados. Eles são compartilhados apenas com nossos provedores de infraestrutura (Google Firebase) para manter o sistema no ar.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Seus Direitos</h2>
            <p>Você pode solicitar a exclusão da sua conta e de todos os seus dados a qualquer momento entrando em contato com a secretaria da igreja.</p>
          </section>
        </div>
        
        <div className="mt-12 p-6 bg-blue-50 rounded-2xl text-center">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Famílias Church • Departamento de Tecnologia</p>
        </div>
      </div>
    </div>
  );
}