'use server';

import { adminDb } from '@/lib/FirebaseAdmin';
import { revalidatePath } from 'next/cache';

type GuestPayload = { id?: string; name: string; code: string };

export async function saveGuest(data: GuestPayload) {
  try {
    const name = data.name.trim();
    const code = data.code.trim().toUpperCase();
    if (data.id) {
      await adminDb.collection('guests').doc(data.id).update({ name, code, updatedAt: new Date() });
    } else {
      await adminDb.collection('guests').add({ name, code, isAttending: null, createdAt: new Date() });
    }
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar convidado:', error);
    return { error: 'Falha ao salvar convidado.' };
  }
}

export async function deleteGuest(id: string) {
  try {
    await adminDb.collection('guests').doc(id).delete();
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir convidado:', error);
    return { error: 'Falha ao excluir convidado.' };
  }
}
