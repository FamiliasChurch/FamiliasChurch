import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 font-body text-slate-800">
      <div className="max-w-3xl mx-auto bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200">
        
        {/* Botão Voltar */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline mb-8">
          <ArrowLeft size={16} /> Voltar para o Início
        </Link>

        {/* Cabeçalho */}
        <header className="mb-10 border-b border-slate-100 pb-8">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <FileText size={24} />
          </div>
          <h1 className="font-display text-4xl font-bold text-blue-900 mb-2">Termos de Uso</h1>
          <p className="text-slate-500">Famílias Church Web Platform</p>
        </header>

        {/* Conteúdo */}
        <div className="space-y-8 leading-relaxed text-slate-600">
          <p className="font-medium text-slate-800">
            Ao acessar e utilizar a plataforma web da <strong>Famílias Church</strong>, você concorda com os seguintes termos e condições:
          </p>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Aceitação dos Termos</h2>
            <p>O uso deste site implica na aceitação integral destes termos. Se você não concorda com algum termo, por favor, não utilize a plataforma.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Conduta do Usuário</h2>
            <p>Você concorda em utilizar o site apenas para fins legítimos e de acordo com os princípios cristãos da nossa comunidade. É estritamente proibido:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 marker:text-blue-500">
              <li>Publicar conteúdo ofensivo, difamatório ou que incite o ódio.</li>
              <li>Tentar violar a segurança do sistema ou acessar áreas restritas sem autorização.</li>
              <li>Utilizar scripts automatizados para coletar dados do site.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Contas e Acesso</h2>
            <ul className="list-disc pl-5 mt-2 space-y-1 marker:text-blue-500">
                <li>O acesso às áreas restritas é pessoal e intransferível.</li>
                <li>Você é responsável por manter a confidencialidade do seu login.</li>
                <li>A administração da igreja reserva-se o direito de suspender ou cancelar contas que violem estes termos ou as diretrizes da comunidade.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Propriedade Intelectual</h2>
            <p>Todo o conteúdo, design, logotipos, textos e devocionais presentes neste site são propriedade da Famílias Church ou de seus respectivos autores. O uso não autorizado desse material é proibido.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Limitação de Responsabilidade</h2>
            <p>A plataforma é fornecida "como está". Não nos responsabilizamos por eventuais indisponibilidades temporárias do sistema ou por danos decorrentes do uso indevido da plataforma.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Pedidos de Oração</h2>
            <p>Ao enviar um pedido de oração, você entende que ele será lido pela equipe de intercessão. Embora tratemos os pedidos com sigilo, recomendamos não compartilhar informações extremamente sensíveis ou de terceiros sem consentimento.</p>
          </section>
        </div>
        
        {/* Rodapé do Documento */}
        <div className="mt-12 p-6 bg-blue-50 rounded-2xl text-center border border-blue-100">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Famílias Church • Departamento de Tecnologia</p>
        </div>
      </div>
    </div>
  );
}