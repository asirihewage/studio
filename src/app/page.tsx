import { PhotoFakeApp } from '@/components/photo-fake-app';
import { Badge } from '@/components/ui/badge';
import { Camera } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-background to-muted/40 p-4 sm:p-8">
      <div className="z-10 w-full max-w-5xl text-center flex flex-col items-center">
        <Badge variant="outline" className="mb-4 bg-card/50 backdrop-blur-sm">
            <Camera className="mr-2 h-3 w-3" />
            V1.0 Now Live
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
          Take Control of Your Photo&apos;s Meta Data
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Modify your photo&apos;s meta data and control the digital footprint of it as you wish.
        </p>
      </div>
      <div className="mt-8 w-full max-w-4xl flex-grow flex flex-col">
         <PhotoFakeApp />
      </div>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} ExifLab. Created by Asiri Hewage.</p>
      </footer>
    </main>
  );
}
