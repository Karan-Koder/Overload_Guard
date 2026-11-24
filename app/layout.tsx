import type { Metadata } from 'next';
import { AppProvider } from '@/components/AppProvider';
import { AppShell } from '@/components/AppShell';
import './globals.css';
export const metadata: Metadata = { title: 'Overload Guard · Make room for what matters', description: 'See workload pileups before they arrive. Explainable scores, protected recovery time, and drafts that keep you in control.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><a className="skip-link" href="#main-content">Skip to content</a><AppProvider><AppShell>{children}</AppShell></AppProvider></body></html>; }
