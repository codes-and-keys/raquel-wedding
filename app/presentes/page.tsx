import Header from '@/components/Header';
import { adminDb } from '@/lib/FirebaseAdmin';
import GiftsList from './giftsList';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic'; 

export const metadata: Metadata = {
  title: 'Lista de Presentes | Raquel & Filipe',
  description: 'Lista de presentes e cotas de lua de mel.',
};

type GiftItem = {
  id: string;
  inventory: number;
  reservedCount: number;
  name: string;
  description?: string;
  imageUrl: string;
  price: number;
  category: string;
  externalUrl?: string;
  isAvailable: boolean;
};

async function getGiftsData() {
  try {
    const snapshot = await adminDb.collection('gifts').get();
    const gifts: GiftItem[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      gifts.push({
        id: doc.id,
        inventory: data.inventory,
        reservedCount: data.reservedCount,
        name: data.name,
        description: data.description || undefined,
        imageUrl: data.imageUrl,
        price: data.price,
        category: data.category,
        externalUrl: data.externalUrl || undefined,
        isAvailable: data.inventory > data.reservedCount
      });
    });

    return gifts;
  } catch (error) {
    console.error('Erro ao buscar presentes:', error);
    return []; 
  }
}

export default async function PresentesPage() {
  const gifts = await getGiftsData();

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex-1 pt-24 pb-16 px-4">
        <GiftsList initialGifts={gifts} />
      </div>

      <footer className="py-8 text-center border-t border-border bg-card">
        <p className="text-sm text-foreground/60 font-sans">
          Raquel & Filipe • 29.11.2026
        </p>
      </footer>
    </main>
  );
}