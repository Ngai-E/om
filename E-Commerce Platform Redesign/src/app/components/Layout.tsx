import { Outlet } from 'react-router';
import { Header } from './Header';
import { Footer } from './Footer';
import { Toaster } from './ui/sonner';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Toaster position="top-right" />
    </div>
  );
}
