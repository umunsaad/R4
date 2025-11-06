import React, { useState } from 'react';
import { CloseIcon } from './icons';
import type { Video } from '../types';

interface VideoEditModalProps {
  onClose: () => void;
  onSave: (videoData: Omit<Video, 'id'>) => void;
  video: Video | null;
}

// Define InputField outside of the main component to prevent re-definition on re-renders
interface InputFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  isTextArea?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ id, label, value, onChange, placeholder, isTextArea = false }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
        {isTextArea ? (
             <textarea 
                id={id} 
                value={value}
                onChange={onChange}
                placeholder={placeholder || label}
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-zinc-500 transition resize-none" 
            />
        ) : (
            <input 
                type="text" 
                id={id} 
                value={value}
                onChange={onChange}
                placeholder={placeholder || label}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-zinc-500 transition" 
            />
        )}
    </div>
);


const VideoEditModal: React.FC<VideoEditModalProps> = ({ onClose, onSave, video }) => {
  const [formData, setFormData] = useState({
    title: video?.title || '',
    description: video?.description || '',
    duration: video?.duration || '',
    thumbnail: video?.thumbnail || '',
    videoUrl: video?.videoUrl || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveChanges = () => {
    if (Object.values(formData).some(val => typeof val === 'string' && val.trim() === '')) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    onSave(formData);
    onClose();
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-black border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h3 className="text-xl font-semibold">{video ? 'Editar Aula' : 'Adicionar Nova Aula'}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-900 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500">
            <CloseIcon />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <InputField id="title" label="Título da Aula" placeholder="Ex: Introdução ao React" value={formData.title} onChange={handleInputChange} />
          <InputField id="description" label="Descrição" placeholder="Um resumo sobre o que a aula aborda." isTextArea value={formData.description} onChange={handleInputChange} />
          <InputField id="duration" label="Duração" placeholder="Ex: 15:30" value={formData.duration} onChange={handleInputChange} />
          <InputField id="thumbnail" label="URL da Miniatura (Thumbnail)" placeholder="https://exemplo.com/imagem.png" value={formData.thumbnail} onChange={handleInputChange} />
          <InputField id="videoUrl" label="URL do Vídeo" placeholder="https://exemplo.com/video.mp4" value={formData.videoUrl} onChange={handleInputChange} />
        </div>
        <div className="px-6 py-4 bg-black/50 border-t border-zinc-800 flex justify-end space-x-3 rounded-b-2xl">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-transparent border border-zinc-800 rounded-lg hover:bg-zinc-900 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSaveChanges} 
            className="px-4 py-2 text-sm font-medium text-white bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoEditModal;