
'use client';
import { InteractiveBackground } from '@/components/interactive-background';
import { PhotoFakeApp } from '@/components/photo-fake-app';
import { Turnstile } from '@/components/turnstile';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Camera, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const [hasImage, setHasImage] = useState(false);
  const [turnstileOk, setTurnstileOk] = useState(false);

  return (
    <main 
      className={cn(
        "flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-8 transition-colors duration-1000 relative isolate overflow-hidden",
        hasImage 
          ? "bg-gradient-to-br from-background to-muted/40"
          : "bg-slate-900"
      )}
    >
      <InteractiveBackground active={!hasImage} />
      <div className="z-10 w-full max-w-5xl text-center flex flex-col items-center">
        <Badge variant="outline" className="mb-4 bg-card/50 backdrop-blur-sm text-white border-white/20">
            <Camera className="mr-2 h-3 w-3" />
            V1.0 Now Live
        </Badge>
        <h1 className={cn(
          "text-4xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent",
          hasImage ? "bg-gradient-to-r from-foreground to-foreground/70" : "text-white"
        )}>
          Take Control of Your Photo&apos;s Meta Data
        </h1>
        <p className={cn(
          "mt-4 max-w-2xl text-lg",
          hasImage ? "text-muted-foreground" : "text-slate-300"
        )}>
          Modify your photo&apos;s meta data and control the digital footprint of it as you wish.
        </p>
      </div>
      <div className="mt-8 w-full max-w-4xl flex-grow flex flex-col z-10">
        {turnstileOk ? (
          <PhotoFakeApp onFileSelect={(file) => setHasImage(!!file)} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Turnstile onVerify={() => setTurnstileOk(true)} />
          </div>
        )}
      </div>
      <footer className={cn("mt-8 text-center text-sm z-10", hasImage ? "text-muted-foreground" : "text-slate-400")}>
        <p>&copy; {new Date().getFullYear()} ExifLab. Created by Asiri Hewage.</p>
      </footer>
    </main>
  );
}
