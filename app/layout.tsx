import type {Metadata} from 'next';
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Menü Magie - KI-gestützte Speisekarten-Optimierung',
  description: 'Verwandle unleserliche PDF-Scans in professionelle, druckfertige Speisekarten mit Gemini AI.',
  icons: {
    icon: '/assets/logo/logo-mark.svg',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="de" className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-[#050505] text-zinc-100" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
