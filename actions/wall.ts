'use server';

import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/FirebaseAdmin';

const WallMessageSchema = z.object({
  guestName: z.string().min(2).max(100).trim(),
  message: z.string().min(5).max(500).trim(),
});

export async function submitWallMessage(data: unknown) {
  const parsed = WallMessageSchema.safeParse(data);
  if (!parsed.success) return { error: 'Preencha seu nome e escreva uma mensagem (mínimo 5 caracteres).' };

  try {
    await adminDb.collection('wall_messages').add({
      ...parsed.data,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { success: true };
  } catch {
    return { error: 'Não foi possível salvar sua mensagem. Tente novamente.' };
  }
}
