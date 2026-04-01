import type { Metadata } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { GlobalCursor } from '@/components/ui/global-cursor';
import { TelemetryBridge } from '@/components/monitoring/TelemetryBridge';

export const metadata: Metadata = {
  title: 'CandleVision | Immersive Trading Intelligence',
  description: 'AI-powered trading education and analytics with interactive 3D visualizations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased selection:bg-primary selection:text-white" suppressHydrationWarning>
        <FirebaseClientProvider>
          <TelemetryBridge />
          <GlobalCursor />
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
