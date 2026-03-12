import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Housie of Fame | SQAC',
  description:
    'Where every number tells a story. Register your team for the ultimate Red Carpet Housie experience by SQAC.',
  keywords: 'housie, sqac, technical housie, red carpet, team event, registration',
  openGraph: {
    title: 'Housie of Fame | SQAC',
    description: 'Where every number tells a story.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
