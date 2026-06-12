'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Menu, X } from 'lucide-react';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinks = [
    { name: 'Detalhes do Casamento', href: '/' },
    { name: 'RSVP', href: '/rsvp' },
    { name: 'Presentes', href: '/presentes' },
  ];

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-card shadow-sm transition-all">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          
          <Link href="/" className="group flex items-center gap-2 text-primary transition-colors">
            <Heart className="w-5 h-5 fill-current text-primary group-hover:text-rose-400 group-hover:fill-rose-400 transition-all duration-300" />
            <span className="font-serif text-xl font-medium">Raquel & Filipe</span>
          </Link>

          <nav className="hidden md:flex gap-8">
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

          <button onClick={toggleMenu} className="md:hidden text-primary p-2 -mr-2" aria-label="Abrir menu">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity"
          onClick={toggleMenu}
        />
      )}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-card z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col shadow-2xl border-r border-border ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 flex justify-between items-center border-b border-border">
          <span className="font-serif text-lg text-primary flex items-center gap-2">
            <Heart className="w-4 h-4 fill-current" /> Menu
          </span>
          <button onClick={toggleMenu} className="text-primary/60 hover:text-primary transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex flex-col gap-2 p-4">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            
            return (
              <Link 
                key={link.name} 
                href={link.href}
                onClick={toggleMenu}
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