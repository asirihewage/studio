import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'ExifLab - Modify Image EXIF Data',
  description: 'Easily edit, remove, and add EXIF metadata to your images. Change camera model, date, time, and GPS location to create realistic photo information. Supports JPEG, PNG, and AVIF.',
  keywords: ['exif editor', 'metadata editor', 'image metadata', 'photo exif', 'gps location', 'change exif', 'remove exif', 'exiflab'],
  openGraph: {
    title: 'ExifLab - Modify Image EXIF Data',
    description: 'Easily edit, remove, and add EXIF metadata to your images.',
    type: 'website',
    url: 'https://exiflab.app', // Replace with your actual domain
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ExifLab - Modify Image EXIF Data',
    description: 'Easily edit, remove, and add EXIF metadata to your images.',
    // creator: '@yourtwitterhandle', // Optional: add your twitter handle
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased", "min-h-screen bg-background font-sans")}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
