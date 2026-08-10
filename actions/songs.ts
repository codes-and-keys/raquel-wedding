'use server';

import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/FirebaseAdmin';

const SongSchema = z.object({
  guestName: z.string().min(2).max(100),
  song: z.string().min(1).max(150),
  artist: z.string().max(100).optional(),
});

export async function suggestSong(data: unknown) {
  const parsed = SongSchema.safeParse(data);
  if (!parsed.success) return { error: 'Preencha o nome e a música.' };

  try {
    await adminDb.collection('song_suggestions').add({
      ...parsed.data,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { success: true };
  } catch {
    return { error: 'Erro ao salvar sugestão. Tente novamente.' };
  }
}
