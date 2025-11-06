import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftIcon, SendIcon } from '../icons';
import { GoogleGenAI } from '@google/genai';
import type { ChatMessage, ChatHistory } from '../../types';
import type { Chat } from '@google/genai';
import ChatHistorySidebar from '../ChatHistorySidebar';

interface AgentProps {
    onBack: () => void;
    chatHistories: ChatHistory[];
    saveChatHistory: (chat: ChatHistory) => void;
    deleteChatHistory: (id: number) => void;
    clearAllChatHistory: () => void;
}

const GeminiChatAgent: React.FC<AgentProps> = ({ 
    onBack, 
    chatHistories,
    saveChatHistory,
    deleteChatHistory,
    clearAllChatHistory
}) => {
    const [currentChat, setCurrentChat] = useState<ChatHistory | null>(null);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const messages = currentChat?.messages ?? [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleNewChat = () => {
        setCurrentChat(null);
        chatRef.current = null;
        setInput('');
        setIsLoading(false);
        setError(null);
    };

    const handleSelectChat = (id: number) => {
        const selected = chatHistories.find(c => c.id === id);
        if (selected) {
            setCurrentChat(selected);
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            chatRef.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                history: selected.messages,
            });
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
        const currentInput = input;
        setInput('');
        setIsLoading(true);
        setError(null);

        let chatToUpdate: ChatHistory;
        if (currentChat) {
            chatToUpdate = { ...currentChat, messages: [...currentChat.messages, userMessage] };
        } else {
            chatToUpdate = {
                id: Date.now(),
                title: currentInput.substring(0, 40) + (currentInput.length > 40 ? '...' : ''),
                timestamp: new Date().toISOString(),
                messages: [userMessage],
            };
        }
        setCurrentChat(chatToUpdate);
        
        try {
            if (!chatRef.current) {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
                chatRef.current = ai.chats.create({ model: 'gemini-2.5-flash' });
            }

            const stream = await chatRef.current.sendMessageStream({ message: currentInput });
            
            let modelResponseText = '';
            const modelMessage: ChatMessage = { role: 'model', parts: [{ text: '' }] };
            setCurrentChat(prev => ({...prev!, messages: [...prev!.messages, modelMessage]}));

            for await (const chunk of stream) {
                modelResponseText += chunk.text;
                setCurrentChat(prev => {
                    if (!prev) return prev;
                    const updatedMessages = [...prev.messages];
                    updatedMessages[updatedMessages.length - 1] = { ...modelMessage, parts: [{ text: modelResponseText }] };
                    return { ...prev, messages: updatedMessages };
                });
            }
            
            // Final save after stream completion
            saveChatHistory({
                ...chatToUpdate,
                messages: [...chatToUpdate.messages, { role: 'model', parts: [{ text: modelResponseText }] }],
            });

        } catch (e) {
            console.error(e);
            setError('Ocorreu um erro ao comunicar com a IA. Tente novamente.');
            // Revert user message on error
            setCurrentChat(prev => {
                if(!prev) return null;
                return {...prev, messages: prev.messages.slice(0, -1)};
            });

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
                <h2 className="text-2xl font-bold text-white ml-4">Chat com Gemini</h2>
            </div>
             <div className="flex gap-8 mt-4" style={{ height: 'calc(100vh - 12rem)' }}>
                <ChatHistorySidebar
                    histories={chatHistories}
                    onSelect={handleSelectChat}
                    onDelete={deleteChatHistory}
                    onClear={clearAllChatHistory}
                    onNew={handleNewChat}
                    selectedId={currentChat?.id || null}
                />
                <div className="flex-grow flex flex-col">
                    <div className="flex-1 overflow-y-auto bg-black border border-zinc-800 rounded-xl p-4 space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-lg px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-zinc-800 text-white' : 'bg-zinc-900 text-gray-300'}`}>
                                    <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && messages[messages.length-1]?.role === 'user' && (
                            <div className="flex justify-start">
                                <div className="max-w-lg px-4 py-3 rounded-2xl bg-zinc-900 text-gray-300">
                                    <span className="animate-pulse">...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
                    <div className="mt-4">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handleSend()}
                                placeholder="Digite sua mensagem..."
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-full pl-4 pr-12 py-3 text-white focus:outline-none focus:ring-2 focus:ring-zinc-500 transition"
                                disabled={isLoading}
                            />
                            <button 
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-zinc-800 text-white rounded-full hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-zinc-500"
                                aria-label="Enviar mensagem"
                            >
                                <SendIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeminiChatAgent;