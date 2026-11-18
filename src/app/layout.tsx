import type { Metadata, Viewport } from 'next';
import { Fira_Code, Fira_Sans } from 'next/font/google';
import './globals.css';

const firaSans = Fira_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fira-sans',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fira-code',
});

export const metadata: Metadata = {
  title: 'ResQPulse AI | Hybrid AI Disaster & Field Medical Response',
  description:
    'Unified offline-first disaster reporting, medical triage, evacuation SOS, and command dispatch workspace powered by Firebase AI Logic Hybrid Inference.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#1E40AF',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${firaSans.variable} ${firaCode.variable}`}>
      <body className="min-h-screen antialiased selection:bg-blue-100 selection:text-slate-900">
        {children}
      </body>
    </html>
  );
}
