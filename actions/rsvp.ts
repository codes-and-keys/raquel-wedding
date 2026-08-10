'use server';

import { z } from 'zod';
import { adminDb } from '@/lib/FirebaseAdmin';

const CodeSchema = z.string().min(3).max(10).toUpperCase();

const RsvpUpdateSchema = z.object({
  id: z.string().min(10),
  isAttending: z.boolean(),
});

export async function getGuestByCode(code: string) {
  const safeCode = CodeSchema.safeParse(code);
  
  if (!safeCode.success) {
    return { error: 'Código de convite inválido ou mal formatado.' };
  }

  try {
    const snapshot = await adminDb
      .collection('guests')
      .where('code', '==', safeCode.data)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { error: 'Código não encontrado. Verifique o convite.' };
    }

    const doc = snapshot.docs[0];
    const guest = {
      id: doc.id,
      name: doc.data().name as string,
      isAttending: doc.data().isAttending as boolean | null,
    };

    return { success: true, guest };
  } catch (error) {
    console.error('Erro na leitura do Firestore:', error);
    return { error: 'Erro interno ao buscar dados. Tente novamente.' };
  }
}

export async function submitRsvp(payload: { id: string; isAttending: boolean }) {
  const safeData = RsvpUpdateSchema.safeParse(payload);
  
  if (!safeData.success) {
    return { error: 'Carga de dados inválida detectada.' };
  }

  try {
    const docRef = adminDb.collection('guests').doc(safeData.data.id);

    await docRef.update({ isAttending: safeData.data.isAttending, updatedAt: new Date() });

    return { success: true };
  } catch (error) {
    console.error('Erro no update:', error);
    return { error: 'Falha ao registrar confirmação.' };
  }
}