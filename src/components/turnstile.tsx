
'use client';
import React, { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    turnstile: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string | undefined;
      reset: (widgetId?: string) => void;
    };
  }
}

interface TurnstileProps {
  onVerify: (token: string) => void;
  siteKey?: string;
  theme?: 'light' | 'dark' | 'auto';
}

export function Turnstile({ 
    onVerify,
    siteKey = '0x4AAAAAACJrxgUFYWfW22WC',
    theme = 'dark'
}: TurnstileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>();
  const { toast } = useToast();
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    const renderTurnstile = () => {
      if (!ref.current) return;
      if (window.turnstile) {
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          callback: (token) => {
            onVerify(token);
          },
          'error-callback': () => {
            toast({
              variant: 'destructive',
              title: 'Verification Failed',
              description: 'Please try refreshing the page.',
            });
          },
          theme: theme,
        });
        setIsReady(true);
      } else {
        // Retry if script hasn't loaded yet
        setTimeout(renderTurnstile, 500);
      }
    };
    
    renderTurnstile();

    return () => {
      // Cleanup if component unmounts
      if (widgetId.current && window.turnstile) {
        window.turnstile.reset(widgetId.current);
      }
    };
  }, [siteKey, onVerify, toast, theme]);

  return (
    <div className='flex flex-col items-center justify-center p-8 rounded-lg bg-slate-900/50 backdrop-blur-sm border border-white/10'>
      <div ref={ref} className={cn(!isReady && "h-[65px] w-[300px]")}/>
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
            <span className='ml-2 text-white'>Loading verification...</span>
        </div>
      )}
    </div>
  );
};
