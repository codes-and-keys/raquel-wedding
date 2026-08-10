export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Mural de Mensagens | Raquel & Filipe',
  description: 'Deixe uma mensagem especial para os noivos.',
};

import { adminDb } from '@/lib/FirebaseAdmin';
import Header from '@/components/Header';
import WallMessageForm from '@/components/WallMessageForm';
import { MessageSquareHeart, Heart } from 'lucide-react';

type WallMessage = {
  id: string;
  guestName: string;
  message: string;
  createdAt: string;
};

async function getMessages(): Promise<WallMessage[]> {
  const snap = await adminDb.collection('wall_messages').orderBy('createdAt', 'desc').get();
  const msgs: WallMessage[] = [];
  snap.forEach((doc) => {
    const data = doc.data();
    msgs.push({
      id: doc.id,
      guestName: data.guestName,
      message: data.message,
      createdAt: data.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
    });
  });
  return msgs;
}

export default async function MuralPage() {
  const messages = await getMessages();

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto space-y-12">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-primary/60">
            <Heart className="w-4 h-4 fill-current" />
            <span className="text-xs uppercase tracking-[0.2em] font-medium">Mural de Mensagens</span>
            <Heart className="w-4 h-4 fill-current" />
          </div>
          <h1 className="font-serif text-4xl text-primary">Deixe seu recado</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Escreva uma mensagem especial para Raquel & Filipe. Seus votos ficarão aqui para sempre.
          </p>
        </div>

        {/* Form */}
        <div className="bg-card border border-border rounded-[var(--radius-xl)] p-6 shadow-sm">
          <WallMessageForm />
        </div>

        {/* Messages */}
        {messages.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground uppercase tracking-[0.15em]">
                {messages.length} {messages.length === 1 ? 'mensagem' : 'mensagens'}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-1 gap-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-card border border-border rounded-[var(--radius-xl)] p-6 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-serif text-lg">
                      {msg.guestName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-semibold text-foreground">{msg.guestName}</p>
                        <time className="text-[11px] text-muted-foreground/60 shrink-0">
                          {new Date(msg.createdAt).toLocaleDateString('pt-BR')}
                        </time>
                      </div>
                      <p className="mt-2 text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {messages.length === 0 && (
          <div className="text-center py-16 space-y-3 bg-card rounded-[var(--radius-xl)] border border-dashed border-border">
            <MessageSquareHeart className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p className="text-muted-foreground text-sm">Seja o primeiro a deixar uma mensagem!</p>
          </div>
        )}
      </div>
      </div>
    </main>
  );
}
