// Audio engine — ambient synthesis + Web Audio unlock + CRT transition crossfade.
// All scheduling via Tone.now() — no per-frame callbacks (per PHASES.md constraint).
// Ambient sounds are synthesized; no audio files required for Phase 1.
//
// ARPANET: brown noise through a 280Hz LPF at -24dB — machine room hum / fan noise.
// Figma Era: two sine oscillators (C3 + G3 perfect fifth) at -32dB — near-silent drone.
//
// Unlock flow: AudioContext must be resumed via a user gesture (Web Audio policy).
// We listen on click + touchstart (touchstart catches iOS; click is the gesture on desktop).
// The lobby card tap (required to enter any chapter) naturally provides this gesture.

import * as Tone from 'tone';

interface AmbientLayer {
  vol: Tone.Volume;
  fullDb: number;
  start(): void;
  stop(): void;
}

let audioUnlocked = false;
let pendingChapterId: string | null = null;

const layers = new Map<string, AmbientLayer>();

// Click synth — created at initAudioEngine(), fired per character typed
let clickSynth: Tone.NoiseSynth | null = null;

function buildArpanetLayer(): AmbientLayer {
  const noise = new Tone.Noise('brown');
  const filter = new Tone.Filter(280, 'lowpass');
  const vol = new Tone.Volume(-Infinity);

  noise.connect(filter);
  filter.connect(vol);
  vol.toDestination();

  let started = false;

  return {
    vol,
    fullDb: -24,
    start() {
      if (!started) {
        noise.start();
        started = true;
      }
      vol.volume.cancelScheduledValues(Tone.now());
      vol.volume.rampTo(-24, 1.5);
    },
    stop() {
      vol.volume.cancelScheduledValues(Tone.now());
      vol.volume.rampTo(-Infinity, 0.8);
    },
  };
}

function buildFigmaEraLayer(): AmbientLayer {
  const osc1 = new Tone.Oscillator(130.81, 'sine'); // C3
  const osc2 = new Tone.Oscillator(196.0, 'sine');  // G3 — perfect fifth
  const vol = new Tone.Volume(-Infinity);

  osc1.connect(vol);
  osc2.connect(vol);
  vol.toDestination();

  let started = false;

  return {
    vol,
    fullDb: -32,
    start() {
      if (!started) {
        osc1.start();
        osc2.start();
        started = true;
      }
      vol.volume.cancelScheduledValues(Tone.now());
      vol.volume.rampTo(-32, 2);
    },
    stop() {
      vol.volume.cancelScheduledValues(Tone.now());
      vol.volume.rampTo(-Infinity, 1);
    },
  };
}

export function initAudioEngine(): void {
  layers.set('arpanet', buildArpanetLayer());
  layers.set('figma-era', buildFigmaEraLayer());

  // White noise burst — attack 1ms, decay 25ms, sustain 0. Approximates the
  // mechanical thwack of a type bar hitting a platen on a Teletype Model 33.
  const synth = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.025, sustain: 0, release: 0.005 },
  });
  const clickVol = new Tone.Volume(-30);
  synth.connect(clickVol);
  clickVol.toDestination();
  clickSynth = synth;

  const onUnlock = async () => {
    if (audioUnlocked) return;
    await Tone.start();
    audioUnlocked = true;
    document.removeEventListener('click', onUnlock);
    document.removeEventListener('touchstart', onUnlock);

    if (pendingChapterId) {
      layers.get(pendingChapterId)?.start();
      pendingChapterId = null;
    }
  };

  // passive: true is required for touchstart on iOS to avoid blocking scroll
  document.addEventListener('click', onUnlock, { passive: true });
  document.addEventListener('touchstart', onUnlock, { passive: true });
}

export function startChapterAmbient(chapterId: string): void {
  if (!audioUnlocked) {
    pendingChapterId = chapterId;
    return;
  }
  layers.get(chapterId)?.start();
}

export function stopChapterAmbient(chapterId: string): void {
  layers.get(chapterId)?.stop();
}

// Fired for every character typed in the ARPANET terminal.
// Velocity variation (50–100%) prevents the machine-gun effect from identical
// rapid-fire clicks. Fast-forward bypasses typeChar entirely so no clicks fire.
export function triggerKeystroke(): void {
  if (!audioUnlocked || !clickSynth) return;
  const velocity = 0.5 + Math.random() * 0.5;
  clickSynth.triggerAttackRelease(0.001, Tone.now(), velocity);
}

// Called by transition.ts at the START of the CRT shader (before runShader).
// Schedules all audio changes via Tone.now() — no per-frame callbacks.
//   fromId: fades out over first 1s
//   toId: fades in starting at 60% of transition, completing at 100%
export function crossfadeForTransition(
  fromId: string,
  toId: string,
  durationMs: number,
): void {
  if (!audioUnlocked) return;

  const from = layers.get(fromId);
  const to = layers.get(toId);
  const now = Tone.now();
  const durationSec = durationMs / 1000;

  if (from) {
    from.vol.volume.cancelScheduledValues(now);
    from.vol.volume.rampTo(-Infinity, 1, now);
  }

  if (to) {
    to.start(); // ensure oscillators are running (idempotent — uses started guard)
    const fadeInStart = now + durationSec * 0.6;
    const fadeInDuration = durationSec * 0.4;
    to.vol.volume.cancelScheduledValues(now);
    to.vol.volume.setValueAtTime(-Infinity, now);
    to.vol.volume.setValueAtTime(-Infinity, fadeInStart);
    to.vol.volume.rampTo(to.fullDb, fadeInDuration, fadeInStart);
  }
}
