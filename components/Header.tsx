'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Menu, X } from 'lucide-react';

const navLinks = [
  { name: 'Detalhes do Casamento', href: '/' },
  { name: 'RSVP', href: '/rsvp' },
  { name: 'Presentes', href: '/presentes' },
  { name: 'Mural', href: '/mural' },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Fecha o menu ao navegar — ajuste de estado em resposta a uma prop que mudou,
  // feito durante a renderização (padrão recomendado pelo React) em vez de um efeito.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-card/95 backdrop-blur-sm shadow-sm transition-all">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

          <Link href="/" className="group flex items-center gap-2 text-primary transition-colors">
            <Heart className="w-5 h-5 fill-current text-primary group-hover:text-rose-400 group-hover:fill-rose-400 transition-all duration-300" />
            <span className="font-serif text-xl font-medium">Raquel & Filipe</span>
          </Link>

          <nav className="hidden md:flex gap-8" aria-label="Navegação principal">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm transition-all relative py-2 ${
                    isActive
                      ? 'font-medium text-primary'
                      : 'font-normal text-primary/70 hover:text-primary'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary/50 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-primary p-2 -mr-2 touch-manipulation"
            aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        id="mobile-menu"
        className={`fixed top-0 left-0 h-full w-64 bg-card z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col shadow-2xl border-r border-border ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menu mobile"
      >
        <div className="p-4 flex items-center border-b border-border h-16">
          <span className="font-serif text-lg text-primary flex items-center gap-2">
            <Heart className="w-4 h-4 fill-current" /> Menu
          </span>
        </div>

        <nav className="flex flex-col gap-2 p-4" aria-label="Navegação mobile">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-lg p-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'font-normal text-primary/80 hover:bg-muted hover:text-primary'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
