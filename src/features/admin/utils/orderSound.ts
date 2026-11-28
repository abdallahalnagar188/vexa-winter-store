const MUTE_KEY = 'athar-admin-sound-muted';
const DESKTOP_NOTIF_KEY = 'athar-admin-desktop-notif';

let sharedAudioCtx: AudioContext | null = null;
let unlockBound = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new Ctx();
  }
  return sharedAudioCtx;
}

export function unlockOrderAudio(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => {});
  }

  if (unlockBound || typeof window === 'undefined') return;
  unlockBound = true;

  const handleGesture = () => {
    const c = getAudioContext();
    if (c && c.state === 'suspended') {
      void c.resume().catch(() => {});
    }
    if (c && c.state === 'running') {
      window.removeEventListener('pointerdown', handleGesture);
      window.removeEventListener('keydown', handleGesture);
    }
  };

  window.addEventListener('pointerdown', handleGesture, { passive: true });
  window.addEventListener('keydown', handleGesture, { passive: true });
}

/**
 * Plays a pleasant two-tone notification chime via Web Audio API.
 */
export function playOrderNotificationChime(): boolean {
  try {
    const ctx = getAudioContext();
    if (!ctx) return false;
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const notes = [
      { freq: 880, start: now, duration: 0.14 }, // A5
      { freq: 1174.66, start: now + 0.13, duration: 0.24 }, // D6
    ];

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, note.start);

      gain.gain.setValueAtTime(0.0001, note.start);
      gain.gain.linearRampToValueAtTime(0.14, note.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, note.start + note.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(note.start);
      osc.stop(note.start + note.duration + 0.02);
    }
    return true;
  } catch {
    return false;
  }
}

export function getStoredSoundMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveStoredSoundMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? 'true' : 'false');
  } catch {
    // ignore storage errors
  }
}

export function getStoredDesktopNotif(): boolean {
  try {
    return (
      localStorage.getItem(DESKTOP_NOTIF_KEY) === 'true' &&
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
    );
  } catch {
    return false;
  }
}

export function saveStoredDesktopNotif(enabled: boolean): void {
  try {
    localStorage.setItem(DESKTOP_NOTIF_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

export async function requestDesktopNotifPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') {
    saveStoredDesktopNotif(true);
    return true;
  }
  if (Notification.permission === 'denied') return false;
  try {
    const res = await Notification.requestPermission();
    const granted = res === 'granted';
    saveStoredDesktopNotif(granted);
    return granted;
  } catch {
    return false;
  }
}

export function showDesktopOrderNotification(payload: {
  orderRef: string;
  customerName: string;
  governorateName: string;
  totalCod: number;
}): void {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(`طلب جديد: ${payload.orderRef}`, {
      body: `${payload.customerName} — ${payload.governorateName} (${payload.totalCod} ج.م)`,
      icon: '/favicon.svg',
      tag: payload.orderRef,
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // ignore browser notification failures
  }
}
