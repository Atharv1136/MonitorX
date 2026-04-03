import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MonitorOff, AlertTriangle, Maximize2 } from 'lucide-react';
import type { TileNotification } from '@/hooks/useMessages';

interface ScreenTileProps {
  /** The live MediaStream from the host's peer connection. Undefined = no stream yet. */
  stream?: MediaStream;
  /** Display name to show on the overlay */
  name: string;
  /** First letter fallback for the avatar */
  initials: string;
  /** Show a pulsing amber help-request badge */
  hasHelp?: boolean;
  /** Whether this participant's DB flag says they're actively sharing */
  streamActive?: boolean;
  /** Called when the user clicks the fullscreen expand button */
  onFullscreen?: () => void;
  /** Index used for stagger entrance animation */
  index?: number;
  /** Ephemeral floating bubble (private message / reaction) */
  notification?: TileNotification;
}

export default function ScreenTile({
  stream,
  name,
  initials,
  hasHelp = false,
  streamActive = false,
  onFullscreen,
  index = 0,
  notification,
}: ScreenTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Attach / detach the MediaStream whenever it changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      video.srcObject = stream;
      video.play().catch(() => {
        /* autoplay may be blocked – browser will still show the frame */
      });
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  const hasStream = Boolean(stream);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 380, damping: 28 }}
      className={`
        group relative aspect-video rounded-xl overflow-hidden cursor-pointer
        border transition-all duration-300
        ${hasHelp
          ? 'border-warning shadow-[0_0_24px_hsl(38_92%_50%/0.5)]'
          : hasStream
            ? 'border-primary/50 shadow-[0_0_14px_hsl(217_91%_60%/0.2)]'
            : 'border-border/40 hover:border-primary/30'
        }
        bg-secondary/60
      `}
      onClick={hasStream ? onFullscreen : undefined}
    >
      {/* ── Live video ──────────────────────────────────────────────────── */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          hasStream ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* ── Fallback: no stream ──────────────────────────────────────────── */}
      {!hasStream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          {/* Scan-line texture */}
          <div className="absolute inset-0 scan-line opacity-20 pointer-events-none" />

          <div
            className={`h-11 w-11 rounded-full flex items-center justify-center text-base font-bold
              ${hasHelp ? 'bg-warning/20 text-warning' : 'bg-primary/15 text-primary'}`}
          >
            {initials}
          </div>

          {streamActive ? (
            /* DB says sharing but WebRTC not connected yet — show connecting */
            <span className="text-[10px] text-primary/70 animate-pulse">Connecting…</span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
              <MonitorOff className="h-3 w-3" /> Not sharing
            </span>
          )}
        </div>
      )}

      {/* ── Scan-line over live video (subtle) ──────────────────────────── */}
      {hasStream && (
        <div className="absolute inset-0 scan-line opacity-10 pointer-events-none" />
      )}

      {/* ── Status dot (top-right) ──────────────────────────────────────── */}
      <div
        className={`absolute top-2 right-2 h-2 w-2 rounded-full z-20
          ${hasHelp
            ? 'bg-warning animate-breathe'
            : hasStream
              ? 'bg-success animate-breathe'
              : 'bg-muted-foreground/40'
          }`}
      />

      {/* ── Help badge ──────────────────────────────────────────────────── */}
      {hasHelp && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-warning/90 text-warning-foreground text-[10px] font-bold px-1.5 py-0.5 rounded"
        >
          <AlertTriangle className="h-2.5 w-2.5" /> HELP
        </motion.div>
      )}

      {/* ── Fullscreen hint (hover) ──────────────────────────────────────── */}
      {hasStream && (
        <div className="absolute top-2 right-6 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-background/70 backdrop-blur-sm rounded p-0.5">
            <Maximize2 className="h-3 w-3 text-foreground/70" />
          </div>
        </div>
      )}

      {/* ── Ephemeral Notification Bubble ──────────────────────────────── */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -20 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
          >
            <div className="bg-background/85 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl shadow-primary/20 border border-primary/40 flex flex-col items-center gap-1.5 max-w-[85%] text-center">
              <span className="text-4xl filter drop-shadow animate-bounce">
                {notification.emoji}
              </span>
              <span className="text-xs font-semibold text-foreground/90 line-clamp-1">
                {notification.label}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Name bar (bottom gradient) ───────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-background/90 via-background/40 to-transparent px-2 pt-5 pb-1.5">
        <p className="text-xs font-medium text-foreground truncate">{name}</p>
        {hasStream && (
          <p className="text-[9px] text-success/80 flex items-center gap-1">
            <span className="inline-block h-1 w-1 rounded-full bg-success animate-breathe" />
            Live
          </p>
        )}
      </div>
    </motion.div>
  );
}
