'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(password: string) {
  const correctPassword = process.env.ADMIN_PASSWORD;

  if (!correctPassword) {
    return { error: 'Senha de administrador não configurada no servidor.' };
  }

  if (password !== correctPassword) {
    return { error: 'Senha incorreta.' };
  }

  // Next.js 15+: É obrigatório o uso de await
  const cookieStore = await cookies();
  
  cookieStore.set('admin_session', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, 
    path: '/',
  });

  redirect('/admin');
}

export async function logout() {
  // Next.js 15+: É obrigatório o uso de await
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  
  redirect('/admin/login');
}