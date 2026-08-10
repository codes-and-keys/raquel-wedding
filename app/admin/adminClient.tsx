'use client';

import { useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip as ChartTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  Users, CheckCircle2, XCircle, Clock, Search, Gift, Edit, Trash2,
  Plus, Loader2, MessageSquareHeart, CreditCard, Music, QrCode, Download,
} from 'lucide-react';
import { saveGift, deleteGift } from '@/actions/gifts';
import { saveGuest, deleteGuest } from '@/actions/guests';
import { Gift as GiftItem } from '@/types/gift';
import { formatPrice } from '@/lib/formatters';
import type { PaymentEntry, SongEntry, WallEntry } from './page';

type Guest = { id: string; code: string; name: string; isAttending: boolean | null };
type Tab = 'guests' | 'gifts' | 'wall' | 'payments' | 'songs';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING:   { label: 'Aguardando',   className: 'text-amber-700 bg-amber-100' },
  CONFIRMED: { label: 'Confirmado',   className: 'text-emerald-700 bg-emerald-100' },
  RECEIVED:  { label: 'Recebido',     className: 'text-emerald-700 bg-emerald-100' },
  OVERDUE:   { label: 'Vencido',      className: 'text-red-700 bg-red-100' },
  REFUNDED:  { label: 'Reembolsado',  className: 'text-blue-700 bg-blue-100' },
  REFUSED:   { label: 'Recusado',     className: 'text-gray-700 bg-gray-100' },
  DELETED:   { label: 'Cancelado',    className: 'text-gray-700 bg-gray-100' },
};

const DONUT_COLORS = ['#10b981', '#ef4444', '#94a3b8'];

interface Props {
  initialGuests: Guest[];
  initialGifts: GiftItem[];
  initialPayments: PaymentEntry[];
  initialSongs: SongEntry[];
  initialWallMessages: WallEntry[];
}

export default function AdminClient({ initialGuests, initialGifts, initialPayments, initialSongs, initialWallMessages }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('guests');
  const [searchTerm, setSearchTerm] = useState('');

  // ── Gift form state ──────────────────────────────────────────────────────────
  const [isGiftFormOpen, setIsGiftFormOpen] = useState(false);
  const [isGiftLoading, setIsGiftLoading] = useState(false);
  const [editingGift, setEditingGift] = useState<GiftItem | null>(null);
  const [giftFormData, setGiftFormData] = useState({
    name: '', description: '', imageUrl: '', price: '', category: 'Casa e Cozinha', externalUrl: '', inventory: '1',
  });

  // ── Guest form state ─────────────────────────────────────────────────────────
  const [isGuestFormOpen, setIsGuestFormOpen] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [guestFormData, setGuestFormData] = useState({ name: '', code: '' });

  // ── Guest stats ──────────────────────────────────────────────────────────────
  const totalGuests = initialGuests.length;
  const confirmed = initialGuests.filter(g => g.isAttending === true).length;
  const declined  = initialGuests.filter(g => g.isAttending === false).length;
  const pending   = initialGuests.filter(g => g.isAttending === null).length;

  const donutData = [
    { name: 'Confirmados', value: confirmed },
    { name: 'Declinados',  value: declined  },
    { name: 'Pendentes',   value: pending   },
  ];

  const filteredGuests = initialGuests.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ── Payment stats ────────────────────────────────────────────────────────────
  const confirmedPayments = initialPayments.filter(p => p.status === 'CONFIRMED' || p.status === 'RECEIVED');
  const paidTotal       = confirmedPayments.reduce((s, p) => s + p.amount, 0);
  const pendingPayments = initialPayments.filter(p => p.status === 'PENDING').length;
  const giftsReserved   = initialGifts.filter(g => g.reservedCount > 0).length;
  const giftsTotal      = initialGifts.length;
  const giftsValue      = initialGifts.reduce((s, g) => s + g.price * Math.min(g.reservedCount, g.inventory), 0);

  // Bar chart: arrecadado por presente (top 6 confirmados)
  const giftBarData = Object.entries(
    confirmedPayments.reduce((acc, p) => {
      acc[p.giftName] = (acc[p.giftName] ?? 0) + p.amount;
      return acc;
    }, {} as Record<string, number>),
  )
    .map(([name, value]) => ({ name: name.length > 22 ? name.slice(0, 20) + '…' : name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // ── CSV export ───────────────────────────────────────────────────────────────
  const exportGuestsCSV = () => {
    const bom    = '﻿';
    const header = ['Nome', 'Código', 'Status'];
    const rows   = initialGuests.map(g => [
      `"${g.name}"`, g.code,
      g.isAttending === true ? 'Confirmado' : g.isAttending === false ? 'Não irá' : 'Pendente',
    ]);
    const csv  = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'convidados.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPaymentsCSV = () => {
    const bom    = '﻿';
    const header = ['Nome', 'Presente', 'Valor', 'Método', 'Parcelas', 'Status', 'Data'];
    const rows   = initialPayments.map(p => [
      `"${p.buyerName}"`, `"${p.giftName}"`,
      p.amount.toFixed(2).replace('.', ','),
      p.method === 'PIX' ? 'PIX' : 'Cartão',
      p.installments,
      STATUS_CONFIG[p.status]?.label ?? p.status,
      new Date(p.createdAt).toLocaleDateString('pt-BR'),
    ]);
    const csv  = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'pagamentos.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Gift handlers ────────────────────────────────────────────────────────────
  const handleOpenGiftForm = (gift?: GiftItem) => {
    if (gift) {
      setEditingGift(gift);
      setGiftFormData({ name: gift.name, description: gift.description || '', imageUrl: gift.imageUrl || '', price: gift.price.toString(), category: gift.category, externalUrl: gift.externalUrl || '', inventory: (gift.inventory || 1).toString() });
    } else {
      setEditingGift(null);
      setGiftFormData({ name: '', description: '', imageUrl: '', price: '', category: 'Casa e Cozinha', externalUrl: '', inventory: '1' });
    }
    setIsGiftFormOpen(true);
  };

  const handleSaveGift = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGiftLoading(true);
    await saveGift({
      id: editingGift?.id,
      ...giftFormData,
      price: parseFloat(giftFormData.price.replace(',', '.')) || 0,
      inventory: parseInt(giftFormData.inventory, 10) || 1,
    });
    setIsGiftLoading(false);
    setIsGiftFormOpen(false);
  };

  const handleDeleteGift = async (id: string) => {
    if (confirm('Tem certeza que deseja apagar este presente?')) await deleteGift(id);
  };

  // ── Guest handlers ───────────────────────────────────────────────────────────
  const handleOpenGuestForm = (guest?: Guest) => {
    if (guest) {
      setEditingGuest(guest);
      setGuestFormData({ name: guest.name, code: guest.code });
    } else {
      setEditingGuest(null);
      setGuestFormData({ name: '', code: '' });
    }
    setIsGuestFormOpen(true);
  };

  const handleSaveGuest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGuestLoading(true);
    await saveGuest({ id: editingGuest?.id, ...guestFormData });
    setIsGuestLoading(false);
    setIsGuestFormOpen(false);
  };

  const handleDeleteGuest = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este convidado?')) await deleteGuest(id);
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'guests',   label: 'Convidados', icon: Users },
    { key: 'gifts',    label: 'Presentes',  icon: Gift },
    { key: 'payments', label: 'Pagamentos', icon: CreditCard },
    { key: 'songs',    label: 'Músicas',    icon: Music },
    { key: 'wall',     label: 'Mural',      icon: MessageSquareHeart },
  ];

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-500">

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-4 overflow-x-auto scrollbar-none">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── CONVIDADOS ── */}
      {activeTab === 'guests' && (
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">

          {/* Donut chart + stats */}
          <div className="bg-card p-6 rounded-[var(--radius-xl)] border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif text-primary">Visão Geral</h2>
              <span className="text-sm text-muted-foreground">{totalGuests} convidados</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:w-[260px] h-[200px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                    </Pie>
                    <ChartTooltip formatter={(v) => [`${v ?? 0} pessoa${v !== 1 ? 's' : ''}`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex sm:flex-col gap-6 sm:gap-4 flex-wrap justify-center">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <p className="text-2xl font-serif text-emerald-600 leading-none">{confirmed}</p>
                    <p className="text-xs text-muted-foreground">Confirmados</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                  <div>
                    <p className="text-2xl font-serif text-destructive leading-none">{declined}</p>
                    <p className="text-xs text-muted-foreground">Declinados</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-400 shrink-0" />
                  <div>
                    <p className="text-2xl font-serif text-muted-foreground leading-none">{pending}</p>
                    <p className="text-xs text-muted-foreground">Pendentes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Guest form */}
          {isGuestFormOpen && (
            <form onSubmit={handleSaveGuest} className="bg-card p-6 rounded-[var(--radius-xl)] border border-primary/30 shadow-md space-y-4 animate-in fade-in zoom-in-95">
              <h3 className="font-serif text-lg text-primary">{editingGuest ? 'Editar Convidado' : 'Novo Convidado'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Nome Completo *</label>
                  <input required type="text" value={guestFormData.name} onChange={e => setGuestFormData({ ...guestFormData, name: e.target.value })} className="w-full h-10 px-3 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary/50 focus:outline-none" placeholder="Ex: Maria Silva" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Código do Convite *</label>
                  <input required type="text" value={guestFormData.code} onChange={e => setGuestFormData({ ...guestFormData, code: e.target.value.toUpperCase() })} className="w-full h-10 px-3 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary/50 focus:outline-none font-mono uppercase" placeholder="Ex: RF001" maxLength={12} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <button type="button" onClick={() => setIsGuestFormOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={isGuestLoading} className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-all">
                  {isGuestLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                </button>
              </div>
            </form>
          )}

          {/* Guest list */}
          <div className="bg-card rounded-[var(--radius-xl)] border border-border shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="p-5 border-b border-border bg-muted/10 flex flex-col sm:flex-row justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-serif text-primary">Lista de Convidados</h2>
                <button onClick={() => handleOpenGuestForm()} className="flex items-center gap-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg px-2.5 py-1.5 hover:bg-primary/90 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
                <button onClick={exportGuestsCSV} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1.5 hover:bg-muted/50 transition-colors">
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Buscar por nome ou código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-10 pl-9 pr-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-background/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredGuests.map((guest) => (
                  <div key={guest.id} className="flex flex-col border border-border/60 rounded-xl bg-card hover:border-primary/30 transition-colors shadow-sm overflow-hidden">
                    <div className="flex justify-between items-center p-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-foreground">{guest.name}</span>
                        <span className="text-xs font-mono text-muted-foreground bg-muted/50 w-fit px-1.5 py-0.5 rounded">{guest.code}</span>
                      </div>
                      <div>
                        {guest.isAttending === true  && <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-md"><CheckCircle2 className="w-3.5 h-3.5" /> Confirmado</span>}
                        {guest.isAttending === false && <span className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive bg-destructive/10 px-3 py-1.5 rounded-md"><XCircle className="w-3.5 h-3.5" /> Não irá</span>}
                        {guest.isAttending === null  && <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-md"><Clock className="w-3.5 h-3.5" /> Pendente</span>}
                      </div>
                    </div>
                    <div className="flex border-t border-border/50 divide-x divide-border/50 bg-muted/10">
                      <button onClick={() => handleOpenGuestForm(guest)} className="flex-1 py-2 flex justify-center items-center gap-1.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors">
                        <Edit className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button onClick={() => handleDeleteGuest(guest.id)} className="flex-1 py-2 flex justify-center items-center gap-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PRESENTES ── */}
      {activeTab === 'gifts' && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="flex justify-between items-center bg-card p-6 rounded-[var(--radius-xl)] border border-border shadow-sm">
            <div>
              <h2 className="text-xl font-serif text-primary">Lista de Presentes</h2>
              <p className="text-sm text-muted-foreground">Adicione, edite ou remova itens da página de presentes.</p>
            </div>
            <button onClick={() => handleOpenGiftForm()} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-all">
              <Plus className="w-4 h-4" /> Novo Item
            </button>
          </div>

          {isGiftFormOpen && (
            <form onSubmit={handleSaveGift} className="bg-card p-6 rounded-[var(--radius-xl)] border border-primary/30 shadow-md space-y-4 animate-in fade-in zoom-in-95">
              <h3 className="font-serif text-lg text-primary">{editingGift ? 'Editar Presente' : 'Novo Presente'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Nome do Item *</label>
                  <input required type="text" value={giftFormData.name} onChange={e => setGiftFormData({ ...giftFormData, name: e.target.value })} className="w-full h-10 px-3 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary/50 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Preço (R$) *</label>
                  <input required type="number" step="0.01" value={giftFormData.price} onChange={e => setGiftFormData({ ...giftFormData, price: e.target.value })} className="w-full h-10 px-3 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary/50 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Categoria *</label>
                  <input required type="text" value={giftFormData.category} onChange={e => setGiftFormData({ ...giftFormData, category: e.target.value })} className="w-full h-10 px-3 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary/50 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Cotas disponíveis *</label>
                  <input required type="number" min="1" step="1" value={giftFormData.inventory} onChange={e => setGiftFormData({ ...giftFormData, inventory: e.target.value })} className="w-full h-10 px-3 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary/50 focus:outline-none" />
                  {editingGift && (
                    <p className="text-xs text-muted-foreground">{editingGift.reservedCount} já reservada{editingGift.reservedCount !== 1 ? 's' : ''}. Não defina um valor menor que isso.</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">URL da Imagem *</label>
                  <input required type="url" value={giftFormData.imageUrl} onChange={e => setGiftFormData({ ...giftFormData, imageUrl: e.target.value })} className="w-full h-10 px-3 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary/50 focus:outline-none" />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-sm font-medium">Descrição (opcional)</label>
                  <textarea value={giftFormData.description} onChange={e => setGiftFormData({ ...giftFormData, description: e.target.value })} className="w-full p-3 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary/50 focus:outline-none h-20" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setIsGiftFormOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={isGiftLoading} className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-all">
                  {isGiftLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Presente'}
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {initialGifts.map((gift) => (
              <div key={gift.id} className="flex flex-col bg-card border border-border rounded-[var(--radius-xl)] overflow-hidden shadow-sm">
                <div className="flex gap-4 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={gift.imageUrl} alt={gift.name} className="w-20 h-20 object-cover rounded-lg bg-muted border border-border/50 shrink-0" />
                  <div className="flex flex-col flex-1">
                    <span className="font-medium text-sm text-foreground line-clamp-2">{gift.name}</span>
                    <span className="text-xs text-primary font-medium mt-1">{gift.category}</span>
                    <div className="mt-auto flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{formatPrice(gift.price)}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${gift.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {gift.reservedCount}/{gift.inventory}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex border-t border-border/50 divide-x divide-border/50 bg-muted/10">
                  <button onClick={() => handleOpenGiftForm(gift)} className="flex-1 py-2.5 flex justify-center items-center gap-2 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors">
                    <Edit className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button onClick={() => handleDeleteGift(gift.id)} className="flex-1 py-2.5 flex justify-center items-center gap-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PAGAMENTOS ── */}
      {activeTab === 'payments' && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-[var(--radius-xl)] p-5 shadow-sm text-center space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Total arrecadado</p>
              <p className="text-2xl font-serif text-emerald-600">{formatPrice(paidTotal)}</p>
            </div>
            <div className="bg-card border border-border rounded-[var(--radius-xl)] p-5 shadow-sm text-center space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Presentes reservados</p>
              <p className="text-2xl font-serif text-primary">{giftsReserved}<span className="text-sm text-muted-foreground font-sans">/{giftsTotal}</span></p>
            </div>
            <div className="bg-card border border-border rounded-[var(--radius-xl)] p-5 shadow-sm text-center space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Valor da lista</p>
              <p className="text-2xl font-serif text-primary">{formatPrice(giftsValue)}</p>
            </div>
            <div className="bg-card border border-border rounded-[var(--radius-xl)] p-5 shadow-sm text-center space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Aguardando</p>
              <p className="text-2xl font-serif text-amber-600">{pendingPayments}</p>
            </div>
          </div>

          {/* Bar chart */}
          {giftBarData.length > 0 && (
            <div className="bg-card rounded-[var(--radius-xl)] border border-border shadow-sm p-6 space-y-4">
              <h2 className="text-xl font-serif text-primary">Arrecadado por Presente</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={giftBarData} margin={{ top: 4, right: 8, left: 8, bottom: 52 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B5040' }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tickFormatter={(v) => `R$${v}`} tick={{ fontSize: 11, fill: '#6B5040' }} width={64} />
                  <ChartTooltip
                    formatter={(value) => [formatPrice(Number(value ?? 0)), 'Arrecadado']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid rgba(139,94,60,0.2)', background: '#FFF8F3' }}
                  />
                  <Bar dataKey="value" fill="#8B5E3C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Payment list */}
          <div className="bg-card rounded-[var(--radius-xl)] border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border bg-muted/10 flex items-center justify-between">
              <h2 className="text-xl font-serif text-primary">Cobranças</h2>
              {initialPayments.length > 0 && (
                <button onClick={exportPaymentsCSV} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1.5 hover:bg-muted/50 transition-colors">
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
              )}
            </div>
            {initialPayments.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-muted-foreground text-sm">Nenhuma cobrança registrada ainda.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {initialPayments.map((p) => {
                  const cfg = STATUS_CONFIG[p.status] ?? { label: p.status, className: 'text-gray-700 bg-gray-100' };
                  return (
                    <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-muted/10 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {p.method === 'PIX' ? <QrCode className="w-4 h-4 text-emerald-600" /> : <CreditCard className="w-4 h-4 text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{p.buyerName}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.giftName}</p>
                        {p.installments > 1 && <p className="text-xs text-muted-foreground">{p.installments}x</p>}
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <p className="font-semibold text-sm text-foreground">{formatPrice(p.amount)}</p>
                        <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>{cfg.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                        {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MÚSICAS ── */}
      {activeTab === 'songs' && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="bg-card p-6 rounded-[var(--radius-xl)] border border-border shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-xl font-serif text-primary">Sugestões de Músicas</h2>
              <p className="text-sm text-muted-foreground">{initialSongs.length} sugest{initialSongs.length !== 1 ? 'ões' : 'ão'} recebida{initialSongs.length !== 1 ? 's' : ''}.</p>
            </div>
          </div>

          {initialSongs.length === 0 ? (
            <div className="py-20 text-center bg-card rounded-[var(--radius-xl)] border border-dashed border-border">
              <Music className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Nenhuma sugestão ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {initialSongs.map((s) => (
                <div key={s.id} className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Music className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{s.song}</p>
                    {s.artist && <p className="text-xs text-muted-foreground truncate">{s.artist}</p>}
                    <p className="text-xs text-muted-foreground/70 mt-0.5">por {s.guestName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MURAL ── */}
      {activeTab === 'wall' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-card p-6 rounded-[var(--radius-xl)] border border-border shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-xl font-serif text-primary">Mural de Mensagens</h2>
              <p className="text-sm text-muted-foreground">Votos e recados enviados pelos convidados.</p>
            </div>
            <span className="text-2xl font-serif text-primary">{initialWallMessages.length}</span>
          </div>

          {initialWallMessages.length === 0 ? (
            <div className="py-20 text-center bg-card rounded-[var(--radius-xl)] border border-dashed border-border space-y-2">
              <MessageSquareHeart className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground text-sm">Nenhuma mensagem ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {initialWallMessages.map((msg) => (
                <div key={msg.id} className="bg-card border border-border rounded-[var(--radius-xl)] p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-serif text-base">
                      {msg.guestName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-semibold text-foreground truncate">{msg.guestName}</p>
                        <time className="text-[11px] text-muted-foreground/60 shrink-0">
                          {new Date(msg.createdAt).toLocaleDateString('pt-BR')}
                        </time>
                      </div>
                      <p className="mt-2 text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{msg.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
