import React, { useState, useEffect } from 'react';
import type { Video, User } from '../types';
import { PlusIcon, EditIcon, TrashIcon } from './icons';
import VideoEditModal from './VideoEditModal';
import NewPostModal from './NewPostModal';

interface AdminViewProps {
  courses: Record<string, Video[]>;
  addCourse: (title: string) => boolean;
  updateCourseTitle: (oldTitle: string, newTitle: string) => boolean;
  deleteCourse: (title: string) => void;
  addVideoToCourse: (courseTitle: string, videoData: Omit<Video, 'id'>) => void;
  updateVideoInCourse: (courseTitle: string, videoId: number, updatedData: Partial<Omit<Video, 'id'>>) => void;
  deleteVideoFromCourse: (courseTitle: string, videoId: number) => void;
  user: User;
  handleCreatePost: (content: string, imageUrls?: string[]) => void;
}

const AdminView: React.FC<AdminViewProps> = (props) => {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  useEffect(() => {
    const courseKeys = Object.keys(props.courses);
    
    // Handle initial load: if no course is selected, pick the first one.
    if (!selectedCourse && courseKeys.length > 0) {
      setSelectedCourse(courseKeys[0]);
    }
    // Handle deletion: if the selected course is no longer valid, pick the first one or null as a fallback.
    else if (selectedCourse && !courseKeys.includes(selectedCourse)) {
      setSelectedCourse(courseKeys.length > 0 ? courseKeys[0] : null);
    }
  }, [props.courses, selectedCourse]);

  const handleAddCourse = () => {
    const title = prompt('Digite o nome do novo curso:');
    if (title && title.trim()) {
      const success = props.addCourse(title.trim());
      if(success) setSelectedCourse(title.trim());
    }
  };

  const handleEditCourse = (oldTitle: string) => {
    const newTitle = prompt('Digite o novo nome para o curso:', oldTitle);
    if (newTitle && newTitle.trim() && newTitle.trim() !== oldTitle) {
      const success = props.updateCourseTitle(oldTitle, newTitle.trim());
      if(success) setSelectedCourse(newTitle.trim());
    }
  };

  const handleDeleteCourse = (title: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o curso "${title}" e todas as suas aulas?`)) {
      props.deleteCourse(title);
    }
  };
  
  const handleAddVideo = () => {
    setEditingVideo(null);
    setIsVideoModalOpen(true);
  };

  const handleEditVideo = (video: Video) => {
    setEditingVideo(video);
    setIsVideoModalOpen(true);
  };

  const handleDeleteVideo = (videoId: number) => {
    if (selectedCourse && window.confirm('Tem certeza que deseja excluir esta aula?')) {
      props.deleteVideoFromCourse(selectedCourse, videoId);
    }
  };

  const handleSaveVideo = (videoData: Omit<Video, 'id'>) => {
    if (selectedCourse) {
      if (editingVideo) { // Update
        props.updateVideoInCourse(selectedCourse, editingVideo.id, videoData);
      } else { // Create
        props.addVideoToCourse(selectedCourse, videoData);
      }
    }
  };

  const courseList = Object.keys(props.courses);

  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-bold tracking-tight text-white mb-8">Painel de Administração</h2>

      <div className="bg-black border border-zinc-800 rounded-xl p-4 mb-8">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Comunidade</h3>
            <button onClick={() => setIsPostModalOpen(true)} className="flex items-center text-sm font-medium text-white bg-zinc-800 px-3 py-1.5 rounded-lg hover:bg-zinc-700 transition-colors">
                <PlusIcon className="w-4 h-4 mr-2" />
                Novo Recado
            </button>
        </div>
      </div>

      <div className="flex gap-8" style={{ height: 'calc(100vh - 18rem)' }}>
        {/* Course List */}
        <div className="w-1/3 shrink-0 bg-black border border-zinc-800 rounded-xl flex flex-col">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
            <h3 className="text-lg font-bold">Cursos</h3>
            <button onClick={handleAddCourse} className="flex items-center text-sm font-medium text-white bg-zinc-800 px-3 py-1.5 rounded-lg hover:bg-zinc-700 transition-colors">
              <PlusIcon className="w-4 h-4 mr-2" />
              Adicionar
            </button>
          </div>
          <ul className="flex-grow overflow-y-auto p-2">
            {courseList.length === 0 ? (
                <p className="text-center text-gray-500 p-4">Nenhum curso criado.</p>
            ) : courseList.map(title => (
              <li key={title}>
                <button 
                    onClick={() => setSelectedCourse(title)}
                    className={`w-full text-left p-3 rounded-lg group transition-colors flex justify-between items-center ${selectedCourse === title ? 'bg-zinc-800' : 'hover:bg-zinc-900'}`}
                >
                  <span className="font-medium">{title}</span>
                  <span className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); handleEditCourse(title); }} className="p-1 hover:text-white text-gray-400"><EditIcon className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteCourse(title); }} className="p-1 hover:text-red-500 text-gray-400"><TrashIcon className="w-4 h-4" /></button>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Video List */}
        <div className="flex-grow bg-black border border-zinc-800 rounded-xl flex flex-col">
          {selectedCourse ? (
            <>
              <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="text-lg font-bold truncate pr-4">Aulas em "{selectedCourse}"</h3>
                <button onClick={handleAddVideo} className="flex items-center text-sm font-medium text-white bg-zinc-800 px-3 py-1.5 rounded-lg hover:bg-zinc-700 transition-colors shrink-0">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Nova Aula
                </button>
              </div>
              <ul className="flex-grow overflow-y-auto p-2 space-y-2">
                {props.courses[selectedCourse]?.length === 0 ? (
                    <p className="text-center text-gray-500 p-4">Nenhuma aula neste curso.</p>
                ) : props.courses[selectedCourse]?.map(video => (
                  <li key={video.id} className="p-2 rounded-lg bg-zinc-900 group flex items-center gap-4">
                     <img src={video.thumbnail} alt={video.title} className="w-24 aspect-video object-cover rounded-md shrink-0" />
                     <div className="flex-grow overflow-hidden">
                        <p className="font-semibold text-sm truncate">{video.title}</p>
                        <p className="text-xs text-gray-400 truncate">{video.description}</p>
                     </div>
                     <div className="flex items-center pr-2">
                        <button onClick={() => handleEditVideo(video)} className="p-2 hover:bg-zinc-800 text-gray-400 hover:text-white rounded-md transition-colors"><EditIcon className="w-5 h-5"/></button>
                        <button onClick={() => handleDeleteVideo(video.id)} className="p-2 hover:bg-zinc-800 text-gray-400 hover:text-red-500 rounded-md transition-colors"><TrashIcon className="w-5 h-5"/></button>
                     </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Selecione ou crie um curso para ver as aulas.</p>
            </div>
          )}
        </div>
      </div>
      {isVideoModalOpen && (
        <VideoEditModal 
          onClose={() => setIsVideoModalOpen(false)} 
          onSave={handleSaveVideo}
          video={editingVideo} 
        />
      )}
      {isPostModalOpen && (
        <NewPostModal 
            onClose={() => setIsPostModalOpen(false)}
            onCreatePost={(content, imageUrls) => {
                props.handleCreatePost(content, imageUrls);
                setIsPostModalOpen(false);
            }}
            user={props.user}
        />
      )}
    </div>
  );
};

export default AdminView;
