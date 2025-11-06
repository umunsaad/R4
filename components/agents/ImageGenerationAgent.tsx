import React, { useState, useRef, useCallback } from 'react';
import { ArrowLeftIcon, SparklesIcon, UploadIcon, CloseIcon, DownloadIcon } from '../icons';
import { GoogleGenAI, Modality } from '@google/genai';
import type { Part } from '@google/genai';
import HistorySidebar from '../HistorySidebar';
import type { HistoryItem, AgentType } from '../../types';

interface AgentProps {
    onBack: () => void;
    history: HistoryItem[];
    addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
    deleteHistoryItem: (id: number) => void;
    clearAgentHistory: (agentType: AgentType) => void;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
    });
};

const ImageGenerationAgent: React.FC<AgentProps> = ({ onBack, history, addToHistory, deleteHistoryItem, clearAgentHistory }) => {
    const [prompt, setPrompt] = useState('');
    const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleNew = () => {
        setPrompt('');
        setUploadedImageFile(null);
        setImagePreview(null);
        setGeneratedImage(null);
        setIsLoading(false);
        setError(null);
        setSelectedHistoryId(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSelectHistory = (item: HistoryItem) => {
        handleNew();
        setPrompt(item.prompt);
        setImagePreview(item.inputImage || null);
        setGeneratedImage(item.output);
        setSelectedHistoryId(item.id);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleNew();
            setUploadedImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const file = event.dataTransfer.files?.[0];
        if (file) {
            handleNew();
            setUploadedImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    }, []);

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleDownloadImage = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `gemini-creative-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Por favor, insira uma descrição para a imagem.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        setSelectedHistoryId(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            const parts: Part[] = [];
            let inputImageBase64: string | undefined = undefined;

            if(uploadedImageFile) {
                inputImageBase64 = await fileToBase64(uploadedImageFile);
                parts.push({ 
                    inlineData: { 
                        data: inputImageBase64.split(',')[1], 
                        mimeType: uploadedImageFile.type 
                    } 
                });
            }
            parts.push({ text: prompt });

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                    setGeneratedImage(imageUrl);
                    addToHistory({
                        agentType: 'generator',
                        prompt: prompt,
                        inputImage: inputImageBase64,
                        output: imageUrl,
                    });
                    return;
                }
            }
            throw new Error("Nenhuma imagem foi retornada pela API.");

        } catch (e) {
            console.error(e);
            setError('Falha ao gerar a imagem. Verifique o console para mais detalhes.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex items-center mb-4">
                <button onClick={onBack} className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-zinc-500">
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Voltar
                </button>
                <h2 className="text-2xl font-bold text-white ml-4">Gerador de Criativos</h2>
            </div>

            <div className="flex gap-8 mt-4" style={{ height: 'calc(100vh - 12rem)' }}>
                 <HistorySidebar
                    agentType="generator"
                    history={history}
                    onSelect={handleSelectHistory}
                    onDelete={deleteHistoryItem}
                    onClear={() => clearAgentHistory('generator')}
                    onNew={handleNew}
                    selectedId={selectedHistoryId}
                />
                <div className="flex-grow grid lg:grid-cols-2 gap-8 overflow-y-auto pr-4">
                    <div className="space-y-4 flex flex-col">
                        <div 
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onClick={() => !imagePreview && fileInputRef.current?.click()}
                            className="relative flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-lg text-center transition-colors aspect-square hover:border-zinc-600 hover:bg-zinc-900/50"
                        >
                             {!imagePreview ? (
                                <div className="cursor-pointer p-12">
                                    <UploadIcon className="w-12 h-12 text-gray-500 mx-auto" />
                                    <p className="mt-4 font-semibold text-gray-300">Arraste uma imagem (opcional)</p>
                                    <p className="text-sm text-gray-400">ou clique para selecionar</p>
                                </div>
                            ) : (
                                <>
                                    <img src={imagePreview} alt="Pré-visualização" className="w-full h-full object-contain rounded-lg" />
                                    <button onClick={(e) => {e.stopPropagation(); handleNew()}} className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-full hover:bg-black transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500">
                                        <CloseIcon className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        </div>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={imagePreview ? "Descreva a modificação desejada..." : "Descreva a imagem que você quer criar..."}
                            rows={3}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-zinc-500 transition resize-none"
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !prompt.trim()}
                            className="w-full flex items-center justify-center px-4 py-2.5 font-semibold text-white bg-zinc-800 rounded-lg hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-zinc-500"
                        >
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            {isLoading ? 'Gerando...' : (imagePreview ? 'Modificar Imagem' : 'Gerar Imagem')}
                        </button>
                    </div>
                    <div className="relative group w-full aspect-square bg-black border border-zinc-800 rounded-xl flex items-center justify-center overflow-hidden">
                        {isLoading && (
                            <div className="text-center text-gray-400">
                                <div className="w-10 h-10 border-4 border-zinc-700 border-t-zinc-400 rounded-full animate-spin mx-auto mb-4"></div>
                                <p>Criando sua imagem...</p>
                            </div>
                        )}
                        {error && <p className="text-red-500 text-center p-4">{error}</p>}
                        {generatedImage && !isLoading && (
                            <>
                                <img src={generatedImage} alt="Imagem gerada por IA" className="w-full h-full object-contain animate-fade-in" />
                                <button
                                    onClick={handleDownloadImage}
                                    className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-zinc-500"
                                    title="Baixar Imagem"
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                </button>
                            </>
                        )}
                        {!isLoading && !generatedImage && !error && (
                            <div className="text-center text-gray-500">
                                <SparklesIcon className="w-16 h-16 mx-auto mb-4" />
                                <p>Sua imagem aparecerá aqui.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageGenerationAgent;