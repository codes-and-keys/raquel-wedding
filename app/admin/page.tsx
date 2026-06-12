import { adminDb } from '@/lib/FirebaseAdmin';
import AdminClient from './adminClient';
import { logout } from '@/actions/auth';
import { Gift } from '@/types/gift';
import { Message } from '@/types/message';

export const dynamic = 'force-dynamic';

type Guest = {
  id: string;
  code: string;
  name: string;
  isAttending: boolean | null;
  updatedAt?: string;
};

async function getAdminData() {
  const guestsSnap = await adminDb.collection('guests').get();
  const guests: Guest[] = [];

  guestsSnap.forEach((doc) => {
    const data = doc.data() as Guest;
    data.id = doc.id;
    guests.push({
      id: doc.id,
      code: data.code,
      name: data.name,
      isAttending: data.isAttending,
      updatedAt: data.updatedAt ? data.updatedAt.toString() : undefined,
    });
  });

  guests.sort((a, b) => a.name.localeCompare(b.name));

  const giftsSnap = await adminDb.collection('gifts').get();
  const gifts: Gift[] = [];
  giftsSnap.forEach((doc) => {
    const data = doc.data();
    gifts.push({
      id: doc.id,
      name: data.name,
      description: data.description || '',
      imageUrl: data.imageUrl || '',
      price: data.price || 0,
      category: data.category || '',
      externalUrl: data.externalUrl || '',
      inventory: data.inventory || 0,
      reservedCount: data.reservedCount || 0,
      isAvailable: (data.inventory || 0) > (data.reservedCount || 0)
    });
  });

  const messagesSnap = await adminDb.collection('gift_messages').orderBy('createdAt', 'desc').get();
  const messages: Message[] = [];
  messagesSnap.forEach((doc) => {
    const data = doc.data();
    messages.push({
      id: doc.id,
      amount: data.amount,
      giftId: data.giftId, 
      status: data.status,
      guestName: data.guestName,
      giftName: data.giftName,
      message: data.message,
      createdAt: data.createdAt.toDate().toISOString(),
    });
  });
  return { guests, gifts, messages };
}

export default async function AdminDashboard() {
  const { guests, gifts, messages } = await getAdminData();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <header className="bg-card border-b border-border px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <h1 className="font-serif text-2xl text-primary">Painel da Noiva</h1>
        <form action={logout}>
          <button type="submit" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors">
            Sair
          </button>
        </form>
      </header>

      <AdminClient initialGuests={guests} initialGifts={gifts} initialMessages={messages} />
    </div>
  );
}