import React from 'react';

interface LandingPageProps {
  onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <main className="w-full bg-black text-gray-100">
      {/* Hero Section */}
      <section className="relative min-h-screen w-full flex items-center justify-center text-center overflow-hidden dark-bg-grid aurora-bg">
        <div className="relative z-10 p-6">
          <div className="mb-6 animate-fade-in-from-bottom">
              <h2 className="text-3xl md:text-4xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 uppercase">
                  R4 Academy
              </h2>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight animate-fade-in-from-bottom animation-delay-200">
            A Próxima Geração da <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">
              Criação com IA
            </span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-300 animate-fade-in-from-bottom animation-delay-400">
            Transforme ideias em prompts otimizados, gere imagens e vídeos espetaculares, e acelere seu fluxo de trabalho como criador de conteúdo. Tudo em um só lugar.
          </p>
          <div className="mt-10 animate-fade-in-from-bottom animation-delay-600">
            <button
              onClick={onEnter}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-purple-500/30 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-50"
            >
              Acessar a Plataforma
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;