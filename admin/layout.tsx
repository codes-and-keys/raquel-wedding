import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/FirebaseAdmin';
interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    redirect('/login');
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch (error) {
    // Se o cookie for forjado ou expirar, a promessa é rejeitada e forçamos o logout visual
    console.error('Falha na validação do cookie de sessão:', error);
    redirect('/login');
  }

  return (
    <div className="admin-container">
      {/* Futura Sidebar/Navbar do painel admin entra aqui */}
      {children}
    </div>
  );
}