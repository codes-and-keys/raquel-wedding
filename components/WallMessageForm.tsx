'use client';

import { useState } from 'react';
import { Loader2, Send, CheckCircle2 } from 'lucide-react';
import { submitWallMessage } from '@/actions/wall';

export default function WallMessageForm() {
  const [guestName, setGuestName] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError(null);
    const result = await submitWallMessage({ guestName, message });
    if (result.error) {
      setError(result.error);
      setStatus('idle');
    } else {
      setStatus('done');
    }
  };

  if (status === 'done') {
    return (
      <div className="text-center py-8 space-y-3 animate-in fade-in duration-500">
        <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
        <p className="font-serif text-xl text-primary">Mensagem enviada!</p>
        <p className="text-sm text-muted-foreground">Obrigado por seu carinho, {guestName.split(' ')[0]}.</p>
        <button
          onClick={() => { setGuestName(''); setMessage(''); setStatus('idle'); }}
          className="btn-ghost underline"
        >
          Enviar outra mensagem
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        required
        placeholder="Seu nome *"
        value={guestName}
        onChange={(e) => setGuestName(e.target.value)}
        maxLength={100}
        className="field"
      />
      <textarea
        required
        placeholder="Escreva sua mensagem para os noivos... *"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={500}
        rows={4}
        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{message.length}/500</span>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={status === 'loading'}
        className="btn-primary w-full py-3.5 text-sm"
      >
        {status === 'loading'
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <><Send className="w-4 h-4" /> Enviar mensagem</>
        }
      </button>
    </form>
  );
}
