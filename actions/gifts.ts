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
      updatedAt: new Date(),
    };

    if (data.id) {
      await collectionRef.doc(data.id).update(giftData);
    } else {
      await collectionRef.add({ ...giftData, createdAt: new Date() });
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

export async function reserveGift(data: { giftId: string; code: string; message: string }) {
  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      const guestSnapshot = await adminDb.collection('guests')
        .where('code', '==', data.code.toUpperCase())
        .limit(1)
        .get();

      if (guestSnapshot.empty) {
        return { error: "Código de convite não encontrado. Verifique seu código." };
      }

      const guestData = guestSnapshot.docs[0].data();
      const guestName = guestData.name;

      const giftRef = adminDb.collection('gifts').doc(data.giftId);
      const giftDoc = await transaction.get(giftRef);
      
      if (!giftDoc.exists) throw new Error("Presente não encontrado.");
      
      const giftInfo = giftDoc.data()!;
      if ((giftInfo.reservedCount || 0) >= (giftInfo.inventory || 1)) {
        return { error: "Este item acabou de ser reservado." };
      }

      transaction.update(giftRef, {
        reservedCount: (giftInfo.reservedCount || 0) + 1,
        updatedAt: new Date(),
      });

      const messageRef = adminDb.collection('gift_messages').doc();
      transaction.set(messageRef, {
        giftId: data.giftId,
        giftName: giftInfo.name,
        guestName: guestName,
        message: data.message,
        amount: giftInfo.price,
        status: 'PENDING',
        createdAt: new Date(),
      });

      return { success: true, guestName };
    });

    if (result.success) {
      revalidatePath('/presentes');
    }

    return result;
  } catch (error) {
    console.error(error);
    return { error: 'Erro técnico ao processar reserva.' };
  }
}

export async function confirmGiftPayment(messageId: string) {
  try {
    await adminDb.collection('gift_messages').doc(messageId).update({
      status: 'CONFIRMED',
      confirmedAt: new Date()
    });
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Erro ao confirmar pagamento.' };
  }
}