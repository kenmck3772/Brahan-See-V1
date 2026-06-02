import React, { useState } from 'react';
import { Bookmark as BookmarkType } from '../types';
import { Bookmark, Plus, Trash2, ArrowRight } from 'lucide-react';

interface BookmarkManagerProps {
  currentPath: string;
  bookmarks: BookmarkType[];
  onAddBookmark: (name: string, path: string) => void;
  onRemoveBookmark: (id: string) => void;
  onNavigate: (path: string) => void;
  addLog: (msg: string, type: 'info' | 'warning' | 'error' | 'success') => void;
}

export const BookmarkManager: React.FC<BookmarkManagerProps> = ({
  currentPath,
  bookmarks,
  onAddBookmark,
  onRemoveBookmark,
  onNavigate,
  addLog
}) => {
  const [newBookmarkName, setNewBookmarkName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookmarkName.trim()) return;
    
    // Check if path is already bookmarked
    const exists = bookmarks.some(b => b.path === currentPath);
    if (exists) {
      addLog(`Logic Fault: ${currentPath} is already indexed in Registry Bookmarks`, 'error');
      setNewBookmarkName('');
      return;
    }

    onAddBookmark(newBookmarkName.trim(), currentPath);
    setNewBookmarkName('');
  };

  return (
    <div className="bg-[#020617]/90 border border-emerald-500/20 rounded-md p-4 flex flex-col gap-3 scanline-glow relative select-text" id="node-bookmark-system">
      <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2">
        <h3 className="font-mono text-emerald-400 text-sm font-bold flex items-center gap-2 glow-text-emerald">
          <Bookmark className="w-4 h-4 text-emerald-400 animate-pulse" />
          REGISTRY BOOKMARKS
        </h3>
        <span className="font-mono text-[10px] text-emerald-500/60 uppercase">
          Quick-Jump Nodes
        </span>
      </div>

      {/* Bookmarks List */}
      <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
        {bookmarks.length === 0 ? (
          <div className="font-mono text-[11px] text-emerald-500/40 italic py-3 text-center">
            [No active directory indexes bookmarked]
          </div>
        ) : (
          bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className={`flex items-center justify-between p-2 rounded border group transition-all duration-200 cursor-pointer ${
                currentPath === bookmark.path
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-emerald-500/5 hover:bg-emerald-500/10 border-transparent hover:border-emerald-500/20'
              }`}
              onClick={() => {
                onNavigate(bookmark.path);
                addLog(`Operator command: quick-jumping to node index [${bookmark.path}]`, 'info');
              }}
            >
              <div className="flex flex-col min-w-0 pr-2">
                <span className="font-mono text-[12px] text-white font-medium truncate glow-text-emerald">
                  {bookmark.name}
                </span>
                <span className="font-mono text-[9px] text-emerald-400/60 truncate italic">
                  {bookmark.path}
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                <ArrowRight
                  className={`w-3.5 h-3.5 text-emerald-400 transition-transform ${
                    currentPath === bookmark.path ? 'translate-x-0.5' : 'group-hover:translate-x-0.5'
                  }`}
                />
                <button
                  type="button"
                  title="Wipe Index Bookmark"
                  className="p-1 hover:bg-red-500/20 rounded text-red-400/80 hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveBookmark(bookmark.id);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add current path form */}
      <form onSubmit={handleAdd} className="flex gap-2 border-t border-emerald-500/10 pt-3 flex-shrink-0">
        <input
          type="text"
          value={newBookmarkName}
          onChange={(e) => setNewBookmarkName(e.target.value)}
          placeholder="New bookmark label..."
          maxLength={30}
          className="bg-black/90 border border-emerald-500/20 rounded px-2 py-1 text-xs text-white font-mono placeholder-emerald-500/30 focus:outline-none focus:border-emerald-500/50 flex-1"
        />
        <button
          type="submit"
          disabled={!newBookmarkName.trim()}
          className="bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 disabled:hover:bg-emerald-500/10 disabled:opacity-40 px-2 py-1.5 rounded text-emerald-400 hover:text-emerald-300 font-mono text-xs flex items-center gap-1 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Index
        </button>
      </form>
      <div className="font-mono text-[9px] text-emerald-500/40 italic">
        Indexes path: <span className="text-emerald-400 truncate">{currentPath}</span>
      </div>
    </div>
  );
};
