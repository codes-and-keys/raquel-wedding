'use server'

import { adminDb } from '@/lib/FirebaseAdmin';
import { revalidatePath } from 'next/cache';

type GiftPayload = {
  id?: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  category: string;
  externalUrl: string;
  inventory: number;
};

export async function saveGift(data: GiftPayload) {
  try {
    const collectionRef = adminDb.collection('gifts');

    const giftData = {
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl,
      price: Number(data.price),
      category: data.category,
      externalUrl: data.externalUrl || null,
      inventory: Number(data.inventory) || 1,
      updatedAt: new Date(),
    };

    if (data.id) {
      await collectionRef.doc(data.id).update(giftData);
    } else {
      await collectionRef.add({ ...giftData, reservedCount: 0, createdAt: new Date() });
    }

    revalidatePath('/admin');
    revalidatePath('/presentes');
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar presente:', error);
    return { error: 'Falha ao processar o presente.' };
  }
}

export async function deleteGift(id: string) {
  try {
    await adminDb.collection('gifts').doc(id).delete();
    revalidatePath('/admin');
    revalidatePath('/presentes');
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir presente:', error);
    return { error: 'Falha ao excluir o presente.' };
  }
}

