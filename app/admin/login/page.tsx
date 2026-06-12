'use client';

import { useState } from 'react';
import { login } from '@/actions/auth';
import { Lock, Loader2, XCircle } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await login(password);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card p-8 rounded-[var(--radius-xl)] shadow-sm border border-border animate-in fade-in zoom-in-95 duration-500">
        
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        
        <h1 className="text-2xl font-serif text-center text-primary mb-6">Acesso Restrito</h1>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border-l-4 border-destructive text-destructive text-sm rounded-r-md flex items-center gap-2">
            <XCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="password" className="sr-only">Senha de Acesso</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a senha do painel"
              className="w-full h-12 px-4 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || password.length < 3}
            className="w-full h-12 flex items-center justify-center bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}