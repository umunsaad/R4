import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeftIcon, UploadIcon, CloseIcon, CheckIcon, ReplicateIcon } from '../icons';
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

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
    });
};

const ImageReplicatorAgent: React.FC<AgentProps> = ({ onBack, history, addToHistory, deleteHistoryItem, clearAgentHistory }) => {
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [responsePrompt, setResponsePrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

     useEffect(() => {
        if (copySuccess) {
            const timer = setTimeout(() => setCopySuccess(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copySuccess]);

    const handleNew = () => {
        setImage(null);
        setPreview(null);
        setResponsePrompt('');
        setIsLoading(false);
        setError(null);
        setSelectedHistoryId(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSelectHistory = (item: HistoryItem) => {
        handleNew();
        setResponsePrompt(item.output);
        setPreview(item.inputImage || null);
        setSelectedHistoryId(item.id);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleNew();
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const file = event.dataTransfer.files?.[0];
        if (file) {
            handleNew();
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    }, []);

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };
    
    const handleGeneratePrompt = async () => {
        if (!image) {
            setError('Por favor, envie uma imagem para análise.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResponsePrompt('');
        setSelectedHistoryId(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const imagePart = await fileToGenerativePart(image);
            const textPart = { text: "Analise esta imagem em detalhes e gere um prompt descritivo em inglês que possa ser usado em um modelo de texto para imagem (como Nano Banana ou Midjourney) para recriar uma imagem semelhante. Descreva o sujeito, cenário, estilo, composição, iluminação e cores. O resultado deve ser APENAS o prompt, sem nenhuma introdução ou texto adicional." };
            
            const result = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: { parts: [imagePart, textPart] },
            });

            const newPrompt = result.text.trim();
            setResponsePrompt(newPrompt);

            const inputImageBase64 = await fileToBase64(image);
            addToHistory({
                agentType: 'imageReplicator',
                prompt: image.name, // Use file name as prompt for history
                inputImage: inputImageBase64,
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
        if (responsePrompt) {
            navigator.clipboard.writeText(responsePrompt);
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
                <h2 className="text-2xl font-bold text-white ml-4">Analisador de Imagem</h2>
            </div>
            <div className="flex gap-8 mt-4" style={{ height: 'calc(100vh - 12rem)' }}>
                <HistorySidebar
                    agentType="imageReplicator"
                    history={history}
                    onSelect={handleSelectHistory}
                    onDelete={deleteHistoryItem}
                    onClear={() => clearAgentHistory('imageReplicator')}
                    onNew={handleNew}
                    selectedId={selectedHistoryId}
                />
                <div className="flex-grow grid lg:grid-cols-2 gap-8 overflow-y-auto pr-4">
                    <div className="space-y-4 flex flex-col">
                        <div 
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onClick={() => !preview && fileInputRef.current?.click()}
                            className="relative flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-lg text-center transition-colors aspect-square hover:border-zinc-600 hover:bg-zinc-900/50"
                        >
                            {!preview ? (
                                <div className="cursor-pointer p-12">
                                    <UploadIcon className="w-12 h-12 text-gray-500 mx-auto" />
                                    <p className="mt-4 font-semibold text-gray-300">Arraste a imagem aqui</p>
                                    <p className="text-sm text-gray-400">ou clique para selecionar</p>
                                </div>
                            ) : (
                                <>
                                    <img src={preview} alt="Pré-visualização" className="w-full h-full object-contain rounded-lg" />
                                    <button onClick={(e) => {e.stopPropagation(); handleNew()}} className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-full hover:bg-black transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500">
                                        <CloseIcon className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        </div>
                        <button onClick={handleGeneratePrompt} disabled={isLoading || !preview} className="w-full flex items-center justify-center px-4 py-2.5 font-semibold text-white bg-zinc-800 rounded-lg hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-zinc-500">
                           <ReplicateIcon className="w-5 h-5 mr-2"/>
                            {isLoading ? 'Analisando Imagem...' : 'Analisar Imagem e Gerar Prompt'}
                        </button>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Prompt Gerado</label>
                        <div className="relative bg-black border border-zinc-800 rounded-xl p-4 min-h-[250px] h-full">
                            {isLoading && (
                                <div className="flex items-center justify-center h-full">
                                    <div className="w-8 h-8 border-4 border-zinc-700 border-t-zinc-400 rounded-full animate-spin"></div>
                                </div>
                            )}
                            {error && <p className="text-red-500">{error}</p>}
                            {responsePrompt && (
                                <>
                                    <p className="text-gray-200 whitespace-pre-wrap font-mono text-sm">{responsePrompt}</p>
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
                </div>
            </div>
        </div>
    );
};

export default ImageReplicatorAgent;