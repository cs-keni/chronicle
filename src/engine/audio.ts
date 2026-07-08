// Audio engine — ambient synthesis + Web Audio unlock + CRT transition crossfade.
// All scheduling via Tone.now() — no per-frame callbacks (per PHASES.md constraint).
// Ambient sounds are synthesized; no audio files required for Phase 1.
//
// ARPANET: brown noise through a 180Hz LPF at -30dB — machine room hum / fan noise.
// Figma Era: two sine oscillators (C3 + G3 perfect fifth) at -32dB — near-silent drone.
//
// Unlock flow: AudioContext must be resumed via a user gesture (Web Audio policy).
// We listen on click + touchstart (touchstart catches iOS; click is the gesture on desktop).
// The lobby card tap (required to enter any chapter) naturally provides this gesture.
//
// Lazy load: Tone.js (~large) is imported dynamically on the first user gesture,
// NOT at startup. Audio can't start before a gesture anyway, so deferring the
// import keeps Tone's bytes out of the initial paint bundle. `Tone` below is a
// type-only import (erased at build); the runtime module is loaded in onUnlock.

import type * as Tone from 'tone';

type ToneModule = typeof import('tone');

// Runtime Tone module — null until the first gesture loads it.
let T: ToneModule | null = null;

interface AmbientLayer {
  vol: Tone.Volume;
  fullDb: number;
  start(): void;
  stop(): void;
}

let audioUnlocked = false;
let unlocking = false;
let pendingChapterId: string | null = null;

const layers = new Map<string, AmbientLayer>();

// Click synth — built when Tone loads (first gesture), fired per character typed
let clickSynth: Tone.NoiseSynth | null = null;

function buildArpanetLayer(Tone: ToneModule): AmbientLayer {
  const noise = new Tone.Noise('brown');
  // 180Hz lowpass (was 280) — deeper, less present rumble that sits UNDER the
  // experience rather than on top of it.
  const filter = new Tone.Filter(180, 'lowpass');
  const vol = new Tone.Volume(-Infinity);

  noise.connect(filter);
  filter.connect(vol);
  vol.toDestination();

  let started = false;

  return {
    vol,
    // -30dB (was -24) — the machine-room hum should be felt, not heard.
    fullDb: -30,
    start() {
      if (!started) {
        noise.start();
        started = true;
      }
      vol.volume.cancelScheduledValues(Tone.now());
      vol.volume.rampTo(-30, 1.5);
    },
    stop() {
      vol.volume.cancelScheduledValues(Tone.now());
      vol.volume.rampTo(-Infinity, 0.8);
    },
  };
}

function buildFigmaEraLayer(Tone: ToneModule): AmbientLayer {
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
  // Only wire the unlock listeners here — the Tone import and all node
  // construction are deferred to the first gesture (onUnlock). Nothing audible
  // can happen before a gesture, so there's no reason to pay for Tone at boot.
  const onUnlock = async () => {
    if (audioUnlocked || unlocking) return;
    unlocking = true; // synchronous guard: rapid click+touchstart can't double-import
    document.removeEventListener('click', onUnlock);
    document.removeEventListener('touchstart', onUnlock);

    const Tone = await import('tone');
    T = Tone;
    await Tone.start();

    layers.set('arpanet', buildArpanetLayer(Tone));
    layers.set('figma-era', buildFigmaEraLayer(Tone));

    // Keystroke click — the mechanical thwack of a type bar hitting a platen on
    // a Teletype Model 33. Raw white noise reads as harsh digital static, so:
    //   - pink noise (warmer, -3dB/oct rolloff) instead of white
    //   - a 1800Hz lowpass (Q 1.2 for a little woody body) strips the hiss,
    //     leaving a dull physical clack rather than a burst of static
    const synth = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.022, sustain: 0, release: 0.005 },
    });
    const clickFilter = new Tone.Filter({ type: 'lowpass', frequency: 1800, Q: 1.2 });
    // -26dB: the lowpass removes high-frequency energy, so lift the level a touch
    // to keep the clack present without it being harsh.
    const clickVol = new Tone.Volume(-26);
    synth.connect(clickFilter);
    clickFilter.connect(clickVol);
    clickVol.toDestination();
    clickSynth = synth;

    audioUnlocked = true;

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
    // Remember the latest requested chapter; onUnlock starts it once Tone loads.
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
  if (!audioUnlocked || !T || !clickSynth) return;
  const velocity = 0.5 + Math.random() * 0.5;
  clickSynth.triggerAttackRelease(0.001, T.now(), velocity);
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
  if (!audioUnlocked || !T) return;

  const from = layers.get(fromId);
  const to = layers.get(toId);
  const now = T.now();
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
