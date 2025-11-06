import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon, PaperClipIcon } from './icons';
import type { User } from '../types';

interface NewPostModalProps {
  onClose: () => void;
  onCreatePost: (content: string, imageUrls?: string[]) => void;
  user: User;
}

const MAX_IMAGES = 4;

const NewPostModal: React.FC<NewPostModalProps> = ({ onClose, onCreatePost, user }) => {
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Cleanup object URLs on unmount
    return () => {
      imagePreviews.forEach(URL.revokeObjectURL);
    };
  }, [imagePreviews]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const currentCount = imageFiles.length;
      // Fix: Explicitly type `newFiles` as `File[]` to solve type inference issue with `Array.from(FileList)`.
      const newFiles: File[] = Array.from(files);

      if (currentCount + newFiles.length > MAX_IMAGES) {
        alert(`Você pode anexar no máximo ${MAX_IMAGES} imagens.`);
        const allowedNewFiles = newFiles.slice(0, MAX_IMAGES - currentCount);
        if (allowedNewFiles.length === 0) return;

        setImageFiles(prev => [...prev, ...allowedNewFiles]);
        const newPreviews = allowedNewFiles.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
      } else {
        setImageFiles(prev => [...prev, ...newFiles]);
        const newPreviews = newFiles.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
      }
    }
  };


  const removeImage = (indexToRemove: number) => {
    URL.revokeObjectURL(imagePreviews[indexToRemove]);
    setImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && imageFiles.length === 0) return;

    let imageUrls: string[] | undefined = undefined;
    if (imageFiles.length > 0) {
        imageUrls = await Promise.all(imageFiles.map(file => new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        })));
    }

    onCreatePost(content, imageUrls);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-black border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h3 className="text-xl font-semibold">Criar Recado</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-900">
            <CloseIcon />
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Escreva o recado para a R4 Academy...`}
              className="w-full h-24 bg-transparent text-gray-200 placeholder-gray-500 resize-none focus:outline-none"
            />
          </div>
          {imagePreviews.length > 0 && (
            <div className="mt-4 pl-14 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {imagePreviews.map((previewUrl, index) => (
                    <div key={index} className="relative w-full aspect-square">
                        <img src={previewUrl} alt={`Preview ${index+1}`} className="rounded-lg w-full h-full object-cover" />
                        <button 
                            onClick={() => removeImage(index)} 
                            className="absolute -top-1.5 -right-1.5 bg-zinc-800 text-white rounded-full p-1 hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500"
                            aria-label="Remover imagem"
                        >
                            <CloseIcon className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-zinc-800 flex justify-between items-center">
          <button
            onClick={() => imageFiles.length < MAX_IMAGES && fileInputRef.current?.click()}
            disabled={imageFiles.length >= MAX_IMAGES}
            className="p-2 text-gray-400 rounded-full transition-colors enabled:hover:text-white enabled:hover:bg-zinc-800 disabled:text-gray-600 disabled:cursor-not-allowed"
            aria-label="Anexar imagem"
          >
            <PaperClipIcon className="w-6 h-6" />
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" multiple />
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() && imageFiles.length === 0}
            className="px-5 py-2 text-sm font-semibold text-white bg-zinc-800 rounded-lg hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            Publicar Recado
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewPostModal;