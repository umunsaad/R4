import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, LightbulbIcon, CheckIcon } from '../icons';
import { GoogleGenAI } from '@google/genai';
import HistorySidebar from '../HistorySidebar';
import type { HistoryItem, AgentType } from '../../types';

interface AgentProps {
    onBack: () => void;
    history: HistoryItem[];
    addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
    deleteHistoryItem: (id: number) => void;
    clearAgentHistory: (agentType: AgentType) => void;
}

type TargetModel = 'image' | 'video';

const PromptSpecialistAgent: React.FC<AgentProps> = ({ onBack, history, addToHistory, deleteHistoryItem, clearAgentHistory }) => {
    const [idea, setIdea] = useState('');
    const [targetModel, setTargetModel] = useState<TargetModel>('image');
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);

    useEffect(() => {
        if (copySuccess) {
            const timer = setTimeout(() => setCopySuccess(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copySuccess]);

    const handleNew = () => {
        setIdea('');
        setTargetModel('image');
        setGeneratedPrompt('');
        setIsLoading(false);
        setError(null);
        setSelectedHistoryId(null);
    };

    const handleSelectHistory = (item: HistoryItem) => {
        handleNew();
        setIdea(item.prompt);
        setGeneratedPrompt(item.output);
        setSelectedHistoryId(item.id);
    };
    
    const handleGeneratePrompt = async () => {
        if (!idea.trim()) {
            setError('Por favor, descreva sua ideia primeiro.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedPrompt('');
        setSelectedHistoryId(null);

        const systemInstruction = "Você é um especialista em engenharia de prompts para modelos de IA generativa de imagem e vídeo. Sua tarefa é pegar uma ideia simples do usuário e transformá-la em um prompt em inglês, extremamente detalhado e eficaz, otimizado para o modelo alvo (imagem ou vídeo).";
        const userPrompt = `
            Baseado na seguinte ideia simples: "${idea}", crie um prompt detalhado e otimizado para um modelo de IA que gera ${targetModel === 'image' ? 'imagens (como DALL-E 3, Midjourney, ou Nano Banana)' : 'vídeos (como Sora ou Veo)'}.

            O prompt deve ser rico em detalhes, incluindo, quando aplicável:
            - **Sujeito/Personagem:** Descrição detalhada da aparência, roupas, emoções.
            - **Cenário/Ambiente:** Onde a cena se passa? É interno, externo, fantástico? Detalhes de fundo.
            - **Composição da Cena:** Como os elementos estão arranjados? Close-up, plano geral, ângulo da câmera?
            - **Iluminação:** Tipo de luz (ex: luz do amanhecer, luz de velas, neon, cinemática, dramática).
            - **Paleta de Cores:** Cores dominantes, atmosfera (vibrante, sombria, pastel).
            - **Estilo Artístico:** Fotorrealista, pintura a óleo, 3D render, anime, arte conceitual, etc.
            - **Qualidade/Detalhes:** Especifique alta resolução, 4K, 8K, detalhes intrincados.
            - **Para vídeos:** Adicione descrição da ação principal, movimento de câmera (ex: travelling, panning, aéreo), e a atmosfera/mood do vídeo.

            O prompt final deve ser apenas o texto em INGLÊS, sem nenhuma introdução ou explicação sua. Apenas o prompt.
        `;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: userPrompt,
                config: {
                  systemInstruction: systemInstruction,
                }
            });
            const newPrompt = response.text.trim();
            setGeneratedPrompt(newPrompt);
            addToHistory({
                agentType: 'promptSpecialist',
                prompt: idea,
                output: newPrompt,
            });

        } catch (e) {
            console.error(e);
            setError('Falha ao gerar o prompt. Verifique o console para mais detalhes.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const copyToClipboard = () => {
        if (generatedPrompt) {
            navigator.clipboard.writeText(generatedPrompt);
            setCopySuccess(true);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex items-center mb-4">
                <button onClick={onBack} className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-zinc-500">
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Voltar
                </button>
                <h2 className="text-2xl font-bold text-white ml-4">Especialista em Prompt</h2>
            </div>
            <div className="flex gap-8 mt-4" style={{ height: 'calc(100vh - 12rem)' }}>
                <HistorySidebar
                    agentType="promptSpecialist"
                    history={history}
                    onSelect={handleSelectHistory}
                    onDelete={deleteHistoryItem}
                    onClear={() => clearAgentHistory('promptSpecialist')}
                    onNew={handleNew}
                    selectedId={selectedHistoryId}
                />
                <div className="flex-grow space-y-6 overflow-y-auto pr-4">
                    <div>
                        <label htmlFor="idea" className="block text-sm font-medium text-gray-300 mb-2">1. Descreva sua ideia</label>
                        <textarea
                            id="idea"
                            value={idea}
                            onChange={e => setIdea(e.target.value)}
                            placeholder="Ex: Um gato astronauta flutuando no espaço com planetas de lã ao fundo."
                            rows={3}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-zinc-500 transition resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">2. Qual o seu objetivo?</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setTargetModel('image')}
                                className={`px-4 py-3 text-sm font-semibold rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-zinc-400 ${targetModel === 'image' ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-zinc-900 border-zinc-800 text-gray-400 hover:border-zinc-700'}`}
                            >
                                Gerar Imagem (Nano Banana)
                            </button>
                            <button 
                                onClick={() => setTargetModel('video')}
                                className={`px-4 py-3 text-sm font-semibold rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-zinc-400 ${targetModel === 'video' ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-zinc-900 border-zinc-800 text-gray-400 hover:border-zinc-700'}`}
                            >
                                Gerar Vídeo (Sora / Veo)
                            </button>
                        </div>
                    </div>

                    <button onClick={handleGeneratePrompt} disabled={isLoading || !idea.trim()} className="w-full flex items-center justify-center px-4 py-2.5 font-semibold text-white bg-zinc-800 rounded-lg hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-zinc-500">
                        <LightbulbIcon className="w-5 h-5 mr-2" />
                        {isLoading ? 'Gerando...' : 'Gerar Prompt Otimizado'}
                    </button>
                    
                     {error && <p className="text-red-500 text-center">{error}</p>}

                    {(generatedPrompt || isLoading) && (
                        <div className="space-y-2">
                             <label className="block text-sm font-medium text-gray-300">3. Seu prompt otimizado</label>
                            <div className="relative bg-black border border-zinc-800 rounded-xl p-4 min-h-[150px]">
                                {isLoading && (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="w-6 h-6 border-4 border-zinc-700 border-t-zinc-400 rounded-full animate-spin"></div>
                                    </div>
                                )}
                                {generatedPrompt && (
                                    <>
                                        <p className="text-gray-200 whitespace-pre-wrap font-mono text-sm">{generatedPrompt}</p>
                                        <button
                                            onClick={copyToClipboard}
                                            className={`absolute top-3 right-3 px-3 py-1 text-xs font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-zinc-400 ${copySuccess ? 'bg-green-700 text-white' : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'}`}
                                        >
                                            {copySuccess ? <span className="flex items-center"><CheckIcon className="w-4 h-4 mr-1"/> Copiado!</span> : 'Copiar'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PromptSpecialistAgent;
