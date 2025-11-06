import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeftIcon, VideoCameraIcon, DownloadIcon, UploadIcon, CloseIcon } from '../icons';
import { GoogleGenAI } from '@google/genai';
import type { GenerateVideosOperation } from '@google/genai';
import HistorySidebar from '../HistorySidebar';
import type { HistoryItem, AgentType } from '../../types';

interface AgentProps {
    onBack: () => void;
    history: HistoryItem[];
    addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
    deleteHistoryItem: (id: number) => void;
    clearAgentHistory: (agentType: AgentType) => void;
}

const loadingMessages = [
    "Iniciando a renderização...",
    "Processando os frames iniciais...",
    "Aplicando efeitos visuais...",
    "Aguardando a computação em nuvem...",
    "Quase pronto, finalizando o vídeo...",
    "A geração de vídeo pode levar alguns minutos. Agradecemos a sua paciência."
];

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
    });
};

const VideoGenerationAgent: React.FC<AgentProps> = ({ onBack, history, addToHistory, deleteHistoryItem, clearAgentHistory }) => {
    const [prompt, setPrompt] = useState('');
    const [model, setModel] = useState('veo'); // 'veo' or 'sora'
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    const [error, setError] = useState<string | null>(null);
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
    
    const pollingRef = useRef<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
                setApiKeySelected(true);
            }
        };
        checkKey();
        return () => {
            if (pollingRef.current) clearTimeout(pollingRef.current);
            if (videoUrl && videoUrl.startsWith('blob:')) URL.revokeObjectURL(videoUrl);
            if (imagePreview) URL.revokeObjectURL(imagePreview);
        };
    }, []);
    
    useEffect(() => {
        let messageInterval: number;
        if (isLoading) {
            let i = 0;
            messageInterval = window.setInterval(() => {
                i = (i + 1) % loadingMessages.length;
                setLoadingMessage(loadingMessages[i]);
            }, 5000);
        }
        return () => clearInterval(messageInterval);
    }, [isLoading]);

    const handleNew = () => {
        setPrompt('');
        if (videoUrl && videoUrl.startsWith('blob:')) URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setIsLoading(false);
        setError(null);
        setSelectedHistoryId(null);
    };

    const handleSelectHistory = (item: HistoryItem) => {
        handleNew();
        setPrompt(item.prompt);
        setVideoUrl(item.output);
        setImagePreview(item.inputImage || null);
        setSelectedHistoryId(item.id);
    };
    
    const handleSelectKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            setApiKeySelected(true);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            if (imagePreview) URL.revokeObjectURL(imagePreview);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const file = event.dataTransfer.files?.[0];
        if (file) {
            setImageFile(file);
            if (imagePreview) URL.revokeObjectURL(imagePreview);
            setImagePreview(URL.createObjectURL(file));
        }
    }, [imagePreview]);

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const removeImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setImageFile(null);
        if(imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    const handleDownloadVideo = () => {
        if (!videoUrl) return;
        const link = document.createElement('a');
        link.href = videoUrl;
        link.download = `gemini-video-${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const pollOperation = async (operation: GenerateVideosOperation, currentPrompt: string, currentInputImageBase64?: string) => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const updatedOperation = await ai.operations.getVideosOperation({ operation });

            if (updatedOperation.done) {
                const downloadLink = updatedOperation.response?.generatedVideos?.[0]?.video?.uri;
                if (downloadLink) {
                    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                    if (!videoResponse.ok) throw new Error('Falha ao baixar o vídeo gerado.');
                    const blob = await videoResponse.blob();
                    const url = URL.createObjectURL(blob);
                    setVideoUrl(url);
                    addToHistory({
                        agentType: 'videoGenerator',
                        prompt: currentPrompt,
                        inputImage: currentInputImageBase64,
                        output: url,
                    });
                } else {
                    throw new Error('Operação concluída, mas nenhum link de vídeo foi retornado.');
                }
                setIsLoading(false);
            } else {
                pollingRef.current = window.setTimeout(() => pollOperation(updatedOperation, currentPrompt, currentInputImageBase64), 10000);
            }
        } catch (e: any) {
            console.error(e);
            let errorMessage = 'Ocorreu um erro durante a geração do vídeo. Tente novamente.';
            if (e.message?.includes('Requested entity was not found')) {
                 errorMessage = 'A chave de API não foi encontrada ou é inválida. Por favor, selecione uma chave de API válida.';
                 setApiKeySelected(false);
            }
            setError(errorMessage);
            setIsLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim() && !imageFile) {
            setError('Por favor, insira uma descrição ou envie uma imagem.');
            return;
        }
        const isKeySelected = window.aistudio && await window.aistudio.hasSelectedApiKey();
        if (!isKeySelected) {
            setError('Por favor, selecione uma chave de API para continuar.');
            setApiKeySelected(false);
            return;
        }
        setApiKeySelected(true);

        if (videoUrl && videoUrl.startsWith('blob:')) URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
        setIsLoading(true);
        setError(null);
        setSelectedHistoryId(null);
        setLoadingMessage(loadingMessages[0]);
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            const payload: any = {
                model: 'veo-3.1-fast-generate-preview',
                prompt: prompt,
                config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
            };
            let inputImageBase64: string | undefined = undefined;

            if (imageFile) {
                inputImageBase64 = await fileToBase64(imageFile);
                payload.image = {
                    imageBytes: inputImageBase64.split(',')[1],
                    mimeType: imageFile.type,
                };
            }

            const operation = await ai.models.generateVideos(payload);
            pollOperation(operation, prompt, inputImageBase64);
        } catch (e: any) {
            console.error(e);
            let errorMessage = 'Falha ao iniciar a geração do vídeo. Verifique o console para detalhes.';
             if (e.message?.includes('Requested entity was not found')) {
                 errorMessage = 'A chave de API não foi encontrada ou é inválida. Por favor, selecione uma chave de API válida.';
                 setApiKeySelected(false);
            }
            setError(errorMessage);
            setIsLoading(false);
        }
    };
    
    if (!apiKeySelected) {
        return (
            <div className="animate-fade-in max-w-2xl mx-auto text-center p-8 bg-black border border-zinc-800 rounded-xl">
                 <VideoCameraIcon className="w-16 h-16 mx-auto mb-4 text-zinc-500" />
                 <h2 className="text-2xl font-bold text-white mb-2">Chave de API Necessária</h2>
                 <p className="text-zinc-400 mb-6">A geração de vídeo com Veo requer uma chave de API com faturamento habilitado. Por favor, selecione sua chave para continuar.</p>
                 <p className="text-sm text-zinc-500 mb-6">Para mais informações, consulte a <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-300">documentação de faturamento</a>.</p>
                 {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                 <button onClick={handleSelectKey} className="px-6 py-2.5 font-semibold text-white bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-zinc-500">
                    Selecionar Chave de API
                 </button>
                 <button onClick={onBack} className="mt-4 text-sm text-zinc-400 hover:text-white">Voltar</button>
            </div>
        )
    }

    return (
        <div className="animate-fade-in">
            <div className="flex items-center mb-4">
                <button onClick={onBack} className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-zinc-500">
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Voltar
                </button>
                <h2 className="text-2xl font-bold text-white ml-4">Gerador de Vídeo</h2>
            </div>
            <div className="flex gap-8 mt-4" style={{ height: 'calc(100vh - 12rem)' }}>
                 <HistorySidebar
                    agentType="videoGenerator"
                    history={history}
                    onSelect={handleSelectHistory}
                    onDelete={deleteHistoryItem}
                    onClear={() => clearAgentHistory('videoGenerator')}
                    onNew={handleNew}
                    selectedId={selectedHistoryId}
                />
                <div className="flex-grow grid lg:grid-cols-2 gap-8 overflow-y-auto pr-4">
                    <div className="flex flex-col h-full">
                        <div className="flex-grow space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">1. Adicione uma imagem de referência (Opcional)</label>
                                <div 
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onClick={() => !imagePreview && fileInputRef.current?.click()}
                                    className="relative flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-lg text-center transition-colors h-48 hover:border-zinc-600 hover:bg-zinc-900/50"
                                >
                                    {!imagePreview ? (
                                        <div className="cursor-pointer p-8">
                                            <UploadIcon className="w-10 h-10 text-gray-500 mx-auto" />
                                            <p className="mt-4 font-semibold text-gray-300">Arraste a imagem</p>
                                            <p className="text-sm text-gray-400">ou clique para enviar</p>
                                        </div>
                                    ) : (
                                        <>
                                            <img src={imagePreview} alt="Pré-visualização" className="w-full h-full object-contain rounded-lg" />
                                            <button onClick={removeImage} className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-full hover:bg-black transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500">
                                                <CloseIcon className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">2. Escolha o modelo</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => setModel('veo')} className={`px-4 py-3 text-sm font-semibold rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-zinc-400 ${model === 'veo' ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-zinc-900 border-zinc-800 text-gray-400 hover:border-zinc-700'}`}>
                                        Veo 3.1
                                    </button>
                                    <button disabled onClick={() => setModel('sora')} className={`px-4 py-3 text-sm font-semibold rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-zinc-400 ${model === 'sora' ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-zinc-900 border-zinc-800 text-gray-400'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                                        Sora (Experimental)
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="shrink-0 mt-6 pt-6 border-t border-zinc-800">
                            <label htmlFor="prompt-input" className="block text-sm font-medium text-gray-300 mb-2">3. Descreva a cena</label>
                            <div className="relative">
                                <textarea
                                    id="prompt-input"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Ex: um astronauta surfando em uma onda cósmica..."
                                    rows={4}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-4 pr-32 py-3 text-white focus:outline-none focus:ring-1 focus:ring-zinc-500 transition resize-none"
                                />
                                <button 
                                    onClick={handleGenerate} 
                                    disabled={isLoading || (!prompt.trim() && !imageFile)} 
                                    className="absolute right-3 bottom-3 flex items-center justify-center px-4 h-10 font-semibold text-white bg-zinc-800 rounded-md hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-zinc-500"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-zinc-400 border-t-white rounded-full animate-spin mr-2"></div>
                                            <span>Gerando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <VideoCameraIcon className="w-5 h-5 mr-2" />
                                            <span>Gerar</span>
                                        </>
                                    )}
                                </button>
                            </div>
                             {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                        </div>
                    </div>
                    
                    <div className="relative group w-full aspect-video bg-black border border-zinc-800 rounded-xl flex items-center justify-center overflow-hidden">
                        {isLoading && (
                            <div className="text-center text-gray-400 p-4">
                                <div className="w-10 h-10 border-4 border-zinc-700 border-t-zinc-400 rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="font-semibold">Gerando seu vídeo...</p>
                                <p className="text-sm mt-2">{loadingMessage}</p>
                            </div>
                        )}
                        {videoUrl && !isLoading && (
                             <>
                                <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain animate-fade-in" />
                                <button
                                    onClick={handleDownloadVideo}
                                    className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-zinc-500"
                                    title="Baixar Vídeo"
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                </button>
                            </>
                        )}
                        {!isLoading && !videoUrl && (
                            <div className="text-center text-gray-500">
                                <VideoCameraIcon className="w-16 h-16 mx-auto mb-4" />
                                <p>Seu vídeo aparecerá aqui.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoGenerationAgent;