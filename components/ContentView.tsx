import React from 'react';
import type { Video } from '../types';

interface ContentViewProps {
  onVideoSelect: (video: Video, course: Video[]) => void;
  courses: Record<string, Video[]>;
}

const VideoCard: React.FC<{ video: Video; onClick: () => void }> = ({ video, onClick }) => (
    <div 
      onClick={onClick}
      className="relative shrink-0 w-full aspect-[9/16] rounded-xl overflow-hidden group transition-transform duration-300 hover:scale-105 cursor-pointer shadow-lg"
    >
        <img src={video.thumbnail} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="font-semibold text-base truncate group-hover:whitespace-normal">{video.title}</h3>
            <p className="text-sm text-gray-300 mt-1">{video.duration}</p>
        </div>
    </div>
);

const VideoRow: React.FC<{ title: string; videos: Video[]; onVideoSelect: (video: Video, course: Video[]) => void; }> = ({ title, videos, onVideoSelect }) => (
    <div className="space-y-4">
        <h3 className="text-2xl font-bold text-white">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videos.map(video => (
                <VideoCard key={video.id} video={video} onClick={() => onVideoSelect(video, videos)} />
            ))}
        </div>
    </div>
);

const ContentView: React.FC<ContentViewProps> = ({ onVideoSelect, courses }) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight text-white">Meu Conteúdo</h2>
            </div>

            <div className="space-y-12">
                {Object.keys(courses).length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        <p>Nenhum curso foi adicionado ainda.</p>
                        <p>Acesse o painel de Admin para começar a criar conteúdo.</p>
                    </div>
                )}
                {Object.entries(courses).map(([title, videos]) => (
                     Array.isArray(videos) && videos.length > 0 && <VideoRow key={title} title={title} videos={videos} onVideoSelect={onVideoSelect} />
                ))}
            </div>
        </div>
    );
};

export default ContentView;