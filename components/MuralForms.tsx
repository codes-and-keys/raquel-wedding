'use client';

import { useState } from 'react';
import { MessageSquareHeart, Music2 } from 'lucide-react';
import WallMessageForm from './WallMessageForm';
import SongSuggestionForm from './SongSuggestionForm';

type Tab = 'message' | 'song';

export default function MuralForms() {
  const [tab, setTab] = useState<Tab>('message');

  return (
    <div className="bg-card border border-border rounded-[var(--radius-xl)] shadow-sm overflow-hidden">
      <div className="flex p-1.5 gap-1.5 bg-muted/30 border-b border-border">
        <button
          onClick={() => setTab('message')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
            tab === 'message'
              ? 'bg-card text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquareHeart className="w-4 h-4" /> Deixar um recado
        </button>
        <button
          onClick={() => setTab('song')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
            tab === 'song'
              ? 'bg-card text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Music2 className="w-4 h-4" /> Sugerir uma música
        </button>
      </div>

      <div className="p-6">
        {tab === 'message' ? <WallMessageForm /> : <SongSuggestionForm />}
      </div>
    </div>
  );
}
