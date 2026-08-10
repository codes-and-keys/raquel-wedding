'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2, Music2 } from 'lucide-react';
import { suggestSong } from '@/actions/songs';

interface Props {
  guestName?: string;
}

export default function SongSuggestionForm({ guestName = '' }: Props) {
  const [name, setName] = useState(guestName);
  const [song, setSong] = useState('');
  const [artist, setArtist] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError(null);
    const result = await suggestSong({ guestName: name, song, artist: artist || undefined });
    if (result.error) {
      setError(result.error);
      setStatus('idle');
    } else {
      setStatus('done');
    }
  };

  if (status === 'done') {
    return (
      <div className="text-center py-4 space-y-3">
        <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
        <p className="font-medium text-foreground">{song} foi adicionada à lista!</p>
        <button
          onClick={() => { setSong(''); setArtist(''); setStatus('idle'); }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
        >
          Sugerir outra música
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {!guestName && (
        <input
          required
          placeholder="Seu nome *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="field"
        />
      )}
      <input
        required
        placeholder="Nome da música *"
        value={song}
        onChange={(e) => setSong(e.target.value)}
        className="field"
      />
      <input
        placeholder="Artista (opcional)"
        value={artist}
        onChange={(e) => setArtist(e.target.value)}
        className="field"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="btn-primary w-full py-3.5 text-sm"
      >
        {status === 'loading'
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <><Music2 className="w-4 h-4" /> Enviar sugestão</>
        }
      </button>
    </form>
  );
}
