import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
import { AvatarSpin } from '../avatar-spin';
import { HoloAvatarLoaderService } from '../holo-avatar-loader.service';
import { HoloAvatarConfig, HoloAvatarEngine } from '../holo-avatar.types';

/** idle: silueta oscura; lit: iluminado (al pasar el cursor); selected: elegido y al frente. */
export type HoloAvatarState = 'idle' | 'lit' | 'selected' | 'away';
export type HoloAvatarStatus = 'ready' | 'failed';

const WAVE_SECONDS = 2.8;
/** Escala de la figura iluminada (la aplica el contenedor con CSS). */
const LIT_SCALE = 1.22;
/** Lo que tarda el contenedor en cambiar de tamaño al elegir o cerrar (persona-figure: .7 s). */
const SETTLE_MS = 750;
/** Tope para darse vuelta al cerrar, por si el motor no llega a avisar que terminó. */
const LEAVE_MAX_MS = 2500;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Avatar holográfico de cuerpo entero renderizado con three.js. Ocupa la caja de su contenedor
 * (los pies quedan en el borde inferior) y dibuja con margen para que el saludo no se recorte.
 * Sigue al puntero con la mirada y el torso, flota, saluda al iluminarse, se ilumina o
 * apaga según el estado y gira con el arrastre (spin). Al elegirla se disuelve y se rearma en
 * su nuevo lugar; al cerrar el perfil se da vuelta, se disuelve y se rearma en la fila.
 */
@Component({
  selector: 'app-holo-avatar',
  templateUrl: './holo-avatar.component.html',
  styleUrl: './holo-avatar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
})
export class HoloAvatarComponent {
  readonly model = input.required<string>();
  readonly config = input.required<HoloAvatarConfig>();
  readonly state = input<HoloAvatarState>('idle');
  /** Giro con el puntero; sin él, el cuerpo solo se orienta apenas hacia el cursor. */
  readonly spin = input<AvatarSpin | null>(null);
  readonly status = output<HoloAvatarStatus>();

  private readonly loader = inject(HoloAvatarLoaderService);
  private readonly theme = inject(ThemeService);
  private readonly doc = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private engine: HoloAvatarEngine | null = null;
  private rafId = 0;
  private destroyed = false;
  private lastFrameAt = 0;
  private readonly phase = Math.random() * Math.PI * 2;
  private readonly pointer = { x: 0, y: 0, on: false };
  private removePointer: () => void = () => undefined;

  private lock = 1;
  private bodyYaw = 0;
  private wave = -1;
  private wavePending = false;
  private fadeIn = 0;
  private announced = false;
  /** Momento del último cambio de estado: al elegirla, se rearma recién cuando terminó de moverse. */
  private changedAt = 0;
  /** Al cerrar el perfil se da vuelta y se disuelve; después se vuelve a armar en su lugar. */
  private leavingSince: number | null = null;

  constructor() {
    let previous: HoloAvatarState = 'idle';
    effect(() => {
      const next = this.state();
      untracked(() => {
        if (
          (next === 'lit' && previous === 'idle') ||
          (next === 'selected' && previous !== 'selected')
        ) {
          this.wavePending = true;
        }
        if (
          previous === 'selected' &&
          next !== 'selected' &&
          next !== 'away' &&
          !this.reducedMotion()
        ) {
          this.leavingSince = performance.now();
          this.wavePending = false;
        }
        if (next === 'selected') this.leavingSince = null;
        this.changedAt = performance.now();
        previous = next;
      });
    });

    afterNextRender(() => void this.start());
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  private async start(): Promise<void> {
    try {
      const [engine, glb] = await Promise.all([
        this.loader.create(this.config()),
        this.loader.loadModel(this.model()),
      ]);
      if (this.destroyed) return;
      const ok = await engine.init(this.canvas().nativeElement, glb);
      if (this.destroyed) return;
      if (!ok) throw new Error('El motor 3D no pudo preparar la escena');
      this.engine = engine;
      this.listenPointer();
      this.lastFrameAt = performance.now();
      this.rafId = requestAnimationFrame(this.tick);
    } catch (error) {
      console.error('Avatar 3D', error);
      this.status.emit('failed');
    }
  }

  private readonly tick = (now: number): void => {
    if (this.destroyed) return;
    this.rafId = requestAnimationFrame(this.tick);
    if (!this.engine || this.doc.hidden) return;

    const canvas = this.canvas().nativeElement;
    const box = this.host.getBoundingClientRect();
    const area = canvas.getBoundingClientRect();
    if (box.width < 2 || box.height < 2 || area.bottom < 0 || area.top > innerHeight) return;

    const dt = Math.min(0.05, (now - this.lastFrameAt) / 1000);
    this.lastFrameAt = now;
    const t = now / 1000;
    const still = this.reducedMotion();
    const height = box.height;
    const centerX = box.left + box.width / 2;
    const centerY = box.top + box.height / 2;

    // Termina de darse vuelta cuando quedó de espaldas y disuelta (o al llegar al tope).
    if (this.leavingSince !== null) {
      const turned = this.engine.faceBack && (this.engine.fd ?? 1) < 0.02;
      if (turned || now - this.leavingSince > LEAVE_MAX_MS) this.leavingSince = null;
    }
    const leaving = this.leavingSince !== null;

    // Mientras se da vuelta sigue iluminada; se oscurece al rearmarse en su lugar.
    const lockTarget = this.state() === 'idle' && !leaving ? 1 : 0;
    this.lock += (lockTarget - this.lock) * (1 - Math.exp(-dt * 8));

    const follow = this.pointer.on && !still && !leaving;
    const look: [number, number] = follow
      ? [
          clamp((this.pointer.y - (centerY - height * 0.36)) / (innerHeight * 0.45), -1, 1),
          clamp((this.pointer.x - centerX) / (innerWidth * 0.3), -1, 1),
        ]
      : [0, 0];
    const spin = this.spin();
    const turn = spin ? spin.step(dt, still) : 0;
    const leans = follow && (!spin || (spin.facingFront && !spin.dragging));
    const yawTarget = leans
      ? clamp((this.pointer.x - centerX) / (innerWidth * 0.35), -1, 1) * 0.32
      : 0;
    this.bodyYaw += (yawTarget - this.bodyYaw) * (1 - Math.exp(-dt * 4));

    if (this.wavePending && this.wave < 0 && !still) {
      this.wave = 0;
      this.wavePending = false;
    }
    if (this.wave >= 0) {
      this.wave += dt / WAVE_SECONDS;
      if (this.wave > 1) this.wave = -1;
    }

    const lift = still ? 0 : (Math.sin(t * 1.15 + this.phase) * 0.5 + 0.5) * height * 0.016;

    this.engine.frame({
      W: area.width,
      H: area.height,
      // Iluminada, la figura se agranda con CSS: se dibuja con más resolución para que no se vea borrosa.
      dpr: Math.min(2, devicePixelRatio || 1) * (this.state() === 'lit' ? LIT_SCALE : 1),
      cx: centerX - area.left,
      feetY: box.bottom - area.top,
      height,
      lift,
      lock: this.lock,
      theme: this.theme.theme(),
      look,
      wave: this.wave,
      walk: 0,
      away: leaving,
      open: this.state() === 'selected',
      // Al elegirla se disuelve y se vuelve a armar recién cuando llegó a su lugar.
      settled: still || now - this.changedAt > SETTLE_MS,
      fast: true,
      yaw: this.bodyYaw + turn,
      dt,
      t,
    });

    this.fadeIn = Math.min(1, this.fadeIn + dt * 2.2);
    const built = this.engine.fd ?? 1;
    canvas.style.opacity = String(this.fadeIn * built);
    canvas.style.filter =
      built < 0.995
        ? `blur(${((1 - built) * 10).toFixed(1)}px) brightness(${(1 + (1 - built) * 0.6).toFixed(2)})`
        : '';

    if (!this.announced) {
      this.announced = true;
      this.status.emit('ready');
    }
  };

  private listenPointer(): void {
    const win = this.doc.defaultView;
    if (!win) return;
    const move = (e: PointerEvent) => {
      this.pointer.x = e.clientX;
      this.pointer.y = e.clientY;
      this.pointer.on = true;
    };
    const leave = () => (this.pointer.on = false);
    win.addEventListener('pointermove', move, { passive: true });
    this.doc.documentElement.addEventListener('pointerleave', leave);
    this.removePointer = () => {
      win.removeEventListener('pointermove', move);
      this.doc.documentElement.removeEventListener('pointerleave', leave);
    };
  }

  private reducedMotion(): boolean {
    const root = this.doc.documentElement;
    return (
      root.getAttribute('data-motion') === 'reduce' ||
      root.getAttribute('data-cube') === 'off' ||
      !!this.doc.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  private stop(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.rafId);
    this.removePointer();
    if (!this.engine) return;
    const canvas = this.canvas().nativeElement;
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    this.engine = null;
  }
}
