import { LucideIcon } from 'lucide-react';

interface InfoCardProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}

export default function InfoCard({ icon: Icon, title, children }: InfoCardProps) {
  return (
    <div className="h-full bg-card border border-border rounded-[var(--radius-xl)] p-8 text-center space-y-4 shadow-sm hover:border-primary/50 hover:shadow-md transition-all duration-300">
      <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-serif">{title}</h3>
      <div className="text-foreground/70 text-sm leading-relaxed">{children}</div>
    </div>
  );
}
