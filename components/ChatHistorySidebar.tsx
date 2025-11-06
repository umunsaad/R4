import React from 'react';
import type { ChatHistory } from '../types';
import { TrashIcon, PlusCircleIcon } from './icons';

interface Props {
  histories: ChatHistory[];
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onClear: () => void;
  onNew: () => void;
  selectedId: number | null;
}

const ChatHistorySidebar: React.FC<Props> = ({ histories, onSelect, onDelete, onClear, onNew, selectedId }) => {
  return (
    <div className="w-56 shrink-0 bg-black/60 backdrop-blur-md border border-zinc-800 rounded-xl flex flex-col">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center shrink-0">
        <h3 className="font-bold text-white text-lg">Conversas</h3>
        <button 
          onClick={onNew} 
          title="Nova Conversa"
          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-zinc-500"
        >
          <PlusCircleIcon className="w-6 h-6"/>
        </button>
      </div>
      <div className="flex-grow overflow-y-auto">
        {histories.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center text-gray-500 px-4">
              <p className="text-sm">Nenhuma conversa no histórico ainda.</p>
          </div>
        ) : (
          <ul className="p-2 space-y-1">
            {histories.map(item => (
              <li 
                key={item.id} 
                onClick={() => onSelect(item.id)}
                className={`group p-3 rounded-lg cursor-pointer transition-colors ${selectedId === item.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <div className="flex justify-between items-start">
                    <p className="text-sm text-gray-200 font-medium truncate pr-2 flex-1">{item.title}</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                      className="p-1 text-gray-500 hover:text-red-500 hover:bg-white/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                      title="Deletar conversa"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
                <span className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {histories.length > 0 && (
        <div className="p-3 border-t border-zinc-800 shrink-0">
          <button 
            onClick={onClear} 
            className="w-full text-center px-3 py-2 text-sm font-medium text-red-500 bg-red-900/20 rounded-lg hover:bg-red-900/40 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-red-500"
          >
            Limpar Histórico
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatHistorySidebar;