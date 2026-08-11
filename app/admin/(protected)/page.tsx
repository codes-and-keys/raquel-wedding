import { adminDb } from '@/lib/FirebaseAdmin';
import AdminClient from './adminClient';
import { logout } from '@/actions/auth';
import { Gift } from '@/types/gift';

export const dynamic = 'force-dynamic';

type Guest = {
  id: string;
  code: string;
  name: string;
  isAttending: boolean | null;
  updatedAt?: string;
};

export type PaymentEntry = {
  id: string;
  buyerName: string;
  method: 'PIX' | 'CREDIT_CARD';
  status: string;
  amount: number;
  installments: number;
  giftName: string;
  createdAt: string;
  confirmedAt?: string;
};

export type SongEntry = {
  id: string;
  guestName: string;
  song: string;
  artist?: string;
  createdAt: string;
};

export type WallEntry = {
  id: string;
  guestName: string;
  message: string;
  createdAt: string;
};

async function getAdminData() {
  const guestsSnap = await adminDb.collection('guests').get();
  const guests: Guest[] = [];
  guestsSnap.forEach((doc) => {
    const data = doc.data();
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
  const giftNameMap: Record<string, string> = {};
  giftsSnap.forEach((doc) => {
    const data = doc.data();
    giftNameMap[doc.id] = data.name;
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
      isAvailable: (data.inventory || 0) > (data.reservedCount || 0),
    });
  });

  const paymentsSnap = await adminDb.collection('payments').orderBy('createdAt', 'desc').get();
  const payments: PaymentEntry[] = [];
  paymentsSnap.forEach((doc) => {
    const data = doc.data();
    payments.push({
      id: doc.id,
      buyerName: data.buyerName,
      method: data.method,
      status: data.status,
      amount: data.amount,
      installments: data.installments || 1,
      giftName: giftNameMap[data.giftId] ?? data.giftId,
      createdAt: data.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
      confirmedAt: data.confirmedAt?.toDate().toISOString(),
    });
  });

  const songsSnap = await adminDb.collection('song_suggestions').orderBy('createdAt', 'desc').get();
  const songs: SongEntry[] = [];
  songsSnap.forEach((doc) => {
    const data = doc.data();
    songs.push({
      id: doc.id,
      guestName: data.guestName,
      song: data.song,
      artist: data.artist,
      createdAt: data.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
    });
  });

  const wallSnap = await adminDb.collection('wall_messages').orderBy('createdAt', 'desc').get();
  const wallMessages: WallEntry[] = [];
  wallSnap.forEach((doc) => {
    const data = doc.data();
    wallMessages.push({
      id: doc.id,
      guestName: data.guestName,
      message: data.message,
      createdAt: data.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
    });
  });

  return { guests, gifts, payments, songs, wallMessages };
}

export default async function AdminDashboard() {
  const { guests, gifts, payments, songs, wallMessages } = await getAdminData();

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

      <AdminClient
        initialGuests={guests}
        initialGifts={gifts}
        initialPayments={payments}
        initialSongs={songs}
        initialWallMessages={wallMessages}
      />
    </div>
  );
}
