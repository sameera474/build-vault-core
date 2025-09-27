import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SupabaseNotification } from '@/components/SupabaseNotification';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <SupabaseNotification />
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}