import { DOCUMENT, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { STORAGE_KEYS, StorageService } from './storage.service';

export type SoundKind = 'hover' | 'click' | 'nav' | 'open' | 'close' | 'notify' | 'done' | 'on';

/** Elementos que suenan al pasar el mouse y al hacer click. */
const INTERACTIVE_SELECTOR =
  'button:not(:disabled),a[href],[role="button"],[role="switch"],[role="tab"],summary,select,.chip,input[type="checkbox"],input[type="radio"],[data-sfx]';

/**
 * Sonidos de interfaz sintetizados con Web Audio (los mismos tonos de la maqueta).
 * El audio se habilita recién tras la primera interacción del usuario, como exige el navegador.
 */
@Injectable({ providedIn: 'root' })
export class SoundService {
  private readonly doc = inject(DOCUMENT);
  private readonly storage = inject(StorageService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly enabled = signal(true);

  private context: AudioContext | null = null;
  private unlocked = false;
  private lastHoverAt = 0;
  private lastHovered: Element | null = null;

  init(): void {
    this.enabled.set(this.storage.get(STORAGE_KEYS.sound) !== '0');
    if (!this.isBrowser) return;

    const unlock = () => (this.unlocked = true);
    for (const type of ['pointerdown', 'keydown', 'touchstart']) {
      this.doc.addEventListener(type, unlock, true);
    }
    this.doc.addEventListener('pointerover', (e) => this.onPointerOver(e), true);
    this.doc.addEventListener('click', (e) => this.onClick(e), true);
  }

  /** Activa o desactiva los sonidos. Desde un gesto del usuario confirma con un tono. */
  set(on: boolean, fromUser = false): void {
    this.enabled.set(on);
    this.storage.set(STORAGE_KEYS.sound, on ? '1' : '0');
    if (!on) {
      this.cancelSpeech();
    } else if (fromUser) {
      this.unlocked = true;
      this.play('on');
    }
  }

  toggle(): void {
    this.set(!this.enabled(), true);
  }

  play(kind: SoundKind): void {
    if (!this.enabled() || this.doc.hidden) return;
    switch (kind) {
      case 'hover': {
        const now = performance.now();
        if (now - this.lastHoverAt < 70) return;
        this.lastHoverAt = now;
        this.tone(2100, 2600, 0.045, 0.012);
        break;
      }
      case 'click':
        this.tone(940, 780, 0.035, 0.05);
        this.tone(1880, 1500, 0.02, 0.012);
        break;
      case 'nav':
        this.tone(800, 700, 0.03, 0.04);
        this.tone(1300, 1200, 0.03, 0.035, 0.07);
        break;
      case 'open':
        this.tone(780, 900, 0.04, 0.045);
        this.tone(1170, 1300, 0.05, 0.04, 0.06);
        break;
      case 'close':
        this.tone(1100, 900, 0.035, 0.04);
        this.tone(740, 640, 0.045, 0.04, 0.06);
        break;
      case 'notify':
        this.tone(1040, 1060, 0.05, 0.05);
        this.tone(1560, 1580, 0.06, 0.045, 0.09);
        this.tone(2080, 2100, 0.08, 0.03, 0.18);
        break;
      case 'done':
        this.tone(900, 920, 0.04, 0.05);
        this.tone(1350, 1370, 0.07, 0.045, 0.07);
        break;
      case 'on':
        this.tone(660, 990, 0.1, 0.04);
        break;
    }
  }

  private onPointerOver(e: PointerEvent): void {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    const target = (e.target as Element | null)?.closest?.(INTERACTIVE_SELECTOR) ?? null;
    if (!target) {
      this.lastHovered = null;
      return;
    }
    if (target === this.lastHovered) return;
    this.lastHovered = target;
    this.play('hover');
  }

  private onClick(e: MouseEvent): void {
    if (!(e.target as Element | null)?.closest?.(INTERACTIVE_SELECTOR)) return;
    this.unlocked = true;
    this.play('click');
  }

  private audio(): AudioContext | null {
    if (!this.unlocked || !this.isBrowser) return null;
    if (!this.context) {
      try {
        this.context = new AudioContext();
      } catch {
        return null;
      }
    }
    if (this.context.state === 'suspended') void this.context.resume().catch(() => undefined);
    return this.context;
  }

  private tone(f0: number, f1: number, duration: number, volume: number, delay = 0): void {
    const ctx = this.audio();
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1, t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.03);
  }

  private cancelSpeech(): void {
    try {
      globalThis.speechSynthesis?.cancel();
    } catch {
      /* Sin síntesis de voz. */
    }
  }
}
