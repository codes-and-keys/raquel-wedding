'use client';

import { useState } from 'react';
import { Users, CheckCircle2, XCircle, Clock, Search, Gift, Edit, Trash2, Plus, Loader2, MessageSquareHeart } from 'lucide-react';
import { saveGift, deleteGift, confirmGiftPayment } from '@/actions/gifts';
import { Gift as GiftItem } from '@/types/gift';
import { Message } from '@/types/message';

type Guest = { id: string; code: string; name: string; isAttending: boolean | null; };

export default function AdminClient({ initialGuests, initialGifts, initialMessages }: { initialGuests: Guest[], initialGifts: GiftItem[], initialMessages: Message[] }) {
  const [activeTab, setActiveTab] = useState<'guests' | 'gifts' | 'wall'>('guests');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingGift, setEditingGift] = useState<GiftItem | null>(null);

  const [formData, setFormData] = useState({
    name: '', description: '', imageUrl: '', price: '', category: 'Casa e Cozinha', externalUrl: ''
  });

  const totalGuests = initialGuests.length;
  const confirmed = initialGuests.filter(g => g.isAttending === true).length;
  const declined = initialGuests.filter(g => g.isAttending === false).length;
  const pending = initialGuests.filter(g => g.isAttending === null).length;
  const confirmedPercent = totalGuests === 0 ? 0 : Math.round((confirmed / totalGuests) * 100);
  const declinedPercent = totalGuests === 0 ? 0 : Math.round((declined / totalGuests) * 100);
  const pendingPercent = totalGuests === 0 ? 0 : Math.round((pending / totalGuests) * 100);

  const filteredGuests = initialGuests.filter(guest => 
    guest.name.toLowerCase().includes(searchTerm.toLowerCase()) || guest.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenForm = (gift?: GiftItem) => {
    if (gift) {
      setEditingGift(gift);
      setFormData({
        name: gift.name, description: gift.description || '', imageUrl: gift.imageUrl || '', 
        price: gift.price.toString(), category: gift.category, externalUrl: gift.externalUrl || ''
      });
    } else {
      setEditingGift(null);
      setFormData({ name: '', description: '', imageUrl: '', price: '', category: 'Casa e Cozinha', externalUrl: '' });
    }
    setIsFormOpen(true);
  };

  const handleSaveGift = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    await saveGift({
      id: editingGift?.id,
      ...formData,
      price: parseFloat(formData.price.replace(',', '.')) || 0
    });
    setIsLoading(false);
    setIsFormOpen(false);
  };

  const handleDeleteGift = async (id: string) => {
    if (confirm('Tem certeza que deseja apagar este presente?')) {
      await deleteGift(id);
    }
  };

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-500">
      
      <div className="flex gap-2 border-b border-border pb-4">
        <button 
          onClick={() => setActiveTab('guests')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'guests' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
        >
          <Users className="w-4 h-4" /> Convidados
        </button>
        <button 
          onClick={() => setActiveTab('gifts')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'gifts' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
        >
          <Gift className="w-4 h-4" /> Presentes
        </button>
        <button 
          onClick={() => setActiveTab('wall')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'wall' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
        >
          <MessageSquareHeart className="w-4 h-4" /> Mural de Presentes
        </button>
      </div>

      {activeTab === 'guests' && (
        <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
          <div className="bg-card p-6 rounded-[var(--radius-xl)] border border-border shadow-sm space-y-6">
            <h2 className="text-xl font-serif text-primary">Visão Geral de Confirmações</h2>
            <div className="space-y-3">
              <div className="w-full h-5 bg-muted rounded-full overflow-hidden flex shadow-inner">
                <div style={{ width: `${confirmedPercent}%` }} className="bg-emerald-500 transition-all duration-1000" />
                <div style={{ width: `${declinedPercent}%` }} className="bg-destructive transition-all duration-1000" />
                <div style={{ width: `${pendingPercent}%` }} className="bg-muted-foreground/30 transition-all duration-1000" />
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-emerald-600">{confirmedPercent}% Confirmados</span>
                <span className="text-destructive">{declinedPercent}% Declinados</span>
                <span className="text-muted-foreground">{pendingPercent}% Pendentes</span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-[var(--radius-xl)] border border-border shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="p-5 border-b border-border bg-muted/10 flex flex-col sm:flex-row justify-between gap-4">
              <h2 className="text-xl font-serif text-primary">Gestão de Convidados</h2>
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Buscar por nome ou código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-10 pl-9 pr-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar bg-background/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredGuests.map((guest) => (
                  <div key={guest.id} className="flex justify-between items-center p-4 border border-border/60 rounded-xl bg-card hover:border-primary/40 transition-colors shadow-sm">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-foreground">{guest.name}</span>
                      <span className="text-xs font-mono text-muted-foreground bg-muted/50 w-fit px-1.5 py-0.5 rounded">{guest.code}</span>
                    </div>
                    <div>
                      {guest.isAttending === true && <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-md"><CheckCircle2 className="w-4 h-4" /> Confirmado</span>}
                      {guest.isAttending === false && <span className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive bg-destructive/10 px-3 py-1.5 rounded-md"><XCircle className="w-4 h-4" /> Não irá</span>}
                      {guest.isAttending === null && <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-md"><Clock className="w-4 h-4" /> Pendente</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'gifts' && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          
          <div className="flex justify-between items-center bg-card p-6 rounded-[var(--radius-xl)] border border-border shadow-sm">
            <div>
              <h2 className="text-xl font-serif text-primary">Lista de Presentes</h2>
              <p className="text-sm text-muted-foreground">Adicione, edite ou remova itens da página de presentes.</p>
            </div>
            <button onClick={() => handleOpenForm()} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-all">
              <Plus className="w-4 h-4" /> Novo Item
            </button>
          </div>

          {isFormOpen && (
            <form onSubmit={handleSaveGift} className="bg-card p-6 rounded-[var(--radius-xl)] border border-primary/30 shadow-md space-y-4 animate-in fade-in zoom-in-95">
              <h3 className="font-serif text-lg text-primary">{editingGift ? 'Editar Presente' : 'Novo Presente'}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Nome do Item *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full h-10 px-3 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Preço Estimado (R$) *</label>
                  <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full h-10 px-3 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Categoria *</label>
                  <input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Ex: Casa e Cozinha, Lua de Mel..." className="w-full h-10 px-3 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">URL da Imagem *</label>
                  <input required type="url" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://..." className="w-full h-10 px-3 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary/50" />
                </div>
                
                <div className="md:col-span-2 space-y-1">
                  <label className="text-sm font-medium">Descrição Opcional</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary/50 h-20" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-all">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Presente'}
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
                    <span className="text-sm text-muted-foreground mt-auto">R$ {gift.price}</span>
                  </div>
                </div>
                <div className="flex border-t border-border/50 divide-x divide-border/50 bg-muted/10">
                  <button onClick={() => handleOpenForm(gift)} className="flex-1 py-2.5 flex justify-center items-center gap-2 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors">
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
      {activeTab === 'wall' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-card p-6 rounded-[var(--radius-xl)] border border-border shadow-sm">
            <h2 className="text-xl font-serif text-primary">Mural de Presentes</h2>
            <p className="text-sm text-muted-foreground">Veja quem reservou presentes, leia as mensagens e confirme os recebimentos via PIX.</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {initialMessages.map((msg) => (
              <div key={msg.id} className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-6 relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${msg.status === 'CONFIRMED' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-foreground">{msg.guestName}</h3>
                      <p className="text-sm text-primary font-medium">Presenteou com: {msg.giftName}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-serif font-bold text-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(msg.amount)}
                      </span>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {new Date(msg.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg italic text-foreground/80 relative">
                    <span className="text-3xl font-serif absolute -top-2 -left-1 opacity-20">&quot;</span>
                      {msg.message || "Não enviou mensagem."}
                    <span className="text-3xl font-serif absolute -bottom-5 right-1 opacity-20">&quot;</span>
                  </div>
                </div>

                <div className="flex md:flex-col justify-center gap-2 shrink-0 md:border-l md:border-border md:pl-6">
                  {msg.status === 'PENDING' ? (
                    <button 
                      onClick={async () => {
                        if(confirm('Confirmar que recebeu o PIX deste presente?')) {
                          await confirmGiftPayment(msg.id);
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Confirmar PIX
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Pago & Confirmado
                    </div>
                  )}
                </div>
              </div>
            ))}

            {initialMessages.length === 0 && (
              <div className="py-20 text-center bg-card rounded-xl border border-dashed border-border">
                <p className="text-muted-foreground">Nenhuma reserva ou mensagem recebida ainda.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}