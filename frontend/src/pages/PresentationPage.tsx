import React, { useEffect, useRef } from 'react';

export function PresentationPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    try {
      // Forward keyboard events to iframe for slide navigation
      const handleKey = (e: KeyboardEvent) => {
        try {
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === ' ' || e.key === 'Home' || e.key === 'End') {
            const iframeWin = iframeRef.current?.contentWindow;
            if (iframeWin) {
              iframeWin.postMessage({ type: 'keydown', key: e.key }, '*');
            }
          }
        } catch {
          // silent
        }
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    } catch {
      // silent
    }
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0f172a' }}>
      <iframe
        ref={iframeRef}
        src="/presentation/index.html"
        title="ProcureAI Presentation"
        style={{ width: '100%', height: '100%', border: 'none' }}
        allowFullScreen
      />
    </div>
  );
}
