import React from 'react';
import { DiscordIcon, HeartIcon, HeartIconSolid, PinIcon } from './icons';
import type { User, Post } from '../types';

interface PostCardProps {
    post: Post;
    onLikeToggle: (id: number) => void;
    onPinToggle: (id: number) => void;
    currentUser: User;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLikeToggle, onPinToggle, currentUser }) => {
    return (
        <div className={`bg-black p-5 rounded-xl border ${post.pinned ? 'border-yellow-500/50' : 'border-zinc-800'} animate-fade-in-up transition-colors`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full" />
                    <div className="ml-3">
                        <p className="font-semibold text-gray-100">{post.author}</p>
                        <p className="text-xs text-gray-400">{post.time}</p>
                    </div>
                </div>
                {post.pinned && (
                    <div className="flex items-center text-yellow-500 text-xs font-semibold">
                        <PinIcon className="w-4 h-4 mr-1.5" />
                        <span>FIXADO</span>
                    </div>
                )}
            </div>
            {post.content && <p className="text-gray-300 whitespace-pre-wrap">{post.content}</p>}
            
            {post.imageUrls && post.imageUrls.length > 0 && (
                 <div className={`mt-4 grid gap-2 ${
                    post.imageUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
                } ${
                    post.imageUrls.length === 3 ? '[&>*:first-child]:col-span-2' : ''
                }`}>
                    {post.imageUrls.map((url, index) => (
                        <div key={index} className="relative group rounded-lg overflow-hidden border border-zinc-800">
                           <img 
                                src={url} 
                                alt={`Anexo ${index + 1} da publicação`} 
                                className={`w-full object-cover ${post.imageUrls?.length === 3 && index === 0 ? 'aspect-video' : 'aspect-square'}`}
                            />
                       </div>
                   ))}
                </div>
            )}

            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={() => onLikeToggle(post.id)}
                        className={`flex items-center text-sm transition-colors p-1 -m-1 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500 ${post.liked ? 'text-red-500 hover:text-red-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        {post.liked ? <HeartIconSolid className="w-5 h-5 mr-1.5" /> : <HeartIcon className="w-5 h-5 mr-1.5" />}
                        {post.likes}
                    </button>
                </div>

                {currentUser.role === 'admin' && (
                    <button
                        onClick={() => onPinToggle(post.id)}
                        className="flex items-center text-sm text-gray-400 hover:text-white p-1 -m-1 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500 transition-colors"
                        title={post.pinned ? 'Desafixar Recado' : 'Fixar Recado'}
                    >
                        <PinIcon className={`w-5 h-5 transition-colors ${post.pinned ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'}`} />
                    </button>
                )}
            </div>
        </div>
    );
}

const MemberListItem: React.FC<{ user: User }> = ({ user }) => (
    <div className="flex items-center space-x-3">
      <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full" />
      <div className="flex-grow">
        <p className="font-medium text-sm text-gray-200">{user.name}</p>
        <div className="flex items-center space-x-1.5">
          <span className={`w-2 h-2 rounded-full ${user.online ? 'bg-green-500' : 'bg-gray-500'}`}></span>
          <p className={`text-xs ${user.online ? 'text-green-400' : 'text-gray-400'}`}>{user.online ? 'Online' : 'Offline'}</p>
        </div>
      </div>
    </div>
);

interface CommunityViewProps {
    user: User;
    posts: Post[];
    handleLikeToggle: (postId: number) => void;
    handlePinToggle: (postId: number) => void;
    allUsers: User[];
}

const CommunityView: React.FC<CommunityViewProps> = ({ user, posts, handleLikeToggle, handlePinToggle, allUsers }) => {
    const admins = allUsers.filter(u => u.role === 'admin');

  return (
    <div className="animate-fade-in">
        <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold tracking-tight text-white">Comunidade</h2>
            <div className="flex items-center space-x-2">
                <a 
                    href="#"
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[#5865F2] rounded-lg hover:bg-[#4f5bda] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[#5865F2] transition-colors"
                >
                    <DiscordIcon className="w-5 h-5 mr-2 -ml-1" />
                    Entrar no Discord
                </a>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2 space-y-6">
                {posts.map(post => (
                    <PostCard 
                        key={post.id}
                        post={post}
                        onLikeToggle={handleLikeToggle}
                        onPinToggle={handlePinToggle}
                        currentUser={user}
                    />
                ))}
            </div>
            <aside className="lg:col-span-1">
                <div className="bg-black p-5 rounded-xl border border-zinc-800 space-y-4 sticky top-8">
                    <h3 className="font-bold text-lg text-white">Admistradores Ativos</h3>
                    <div className="space-y-4">
                        {admins.filter(admin => admin.online).map(admin => (
                            <MemberListItem key={admin.email} user={admin} />
                        ))}
                    </div>
                    <div className="pt-4 border-t border-zinc-800 space-y-4">
                        {admins.filter(admin => !admin.online).map(admin => (
                            <MemberListItem key={admin.email} user={admin} />
                        ))}
                    </div>
                </div>
            </aside>
        </div>
    </div>
  );
};

export default CommunityView;