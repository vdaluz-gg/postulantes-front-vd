/** Radianes de giro por píxel arrastrado. */
export const SPIN_PER_PX = 0.012;
/** Segundos quieto antes de volver a mirar al frente. */
const RETURN_AFTER = 3;
const TURN = Math.PI * 2;
const nearestFront = (yaw: number) => Math.round(yaw / TURN) * TURN;

/**
 * Giro del avatar con el puntero, como al girar un personaje para personalizarlo: sigue al
 * arrastre horizontal, al soltar continúa por inercia y frena, y después de unos segundos quieto
 * vuelve al frente más cercano. Con movimiento reducido no hay inercia ni transición de vuelta.
 */
export class AvatarSpin {
  private yaw = 0;
  /** Último giro por cuadro (a 60 fps), usado como inercia al soltar. */
  private velocity = 0;
  private idle = RETURN_AFTER;
  private held = false;

  get dragging(): boolean {
    return this.held;
  }

  /** De frente: el cuerpo puede seguir al puntero y la cabeza mirarlo. */
  get facingFront(): boolean {
    return Math.abs(this.yaw - nearestFront(this.yaw)) < 0.3;
  }

  grab(): void {
    this.held = true;
    this.velocity = 0;
    this.idle = 0;
  }

  /** Desplazamiento horizontal del puntero desde el evento anterior, en píxeles. */
  drag(dx: number): void {
    this.velocity = dx * SPIN_PER_PX;
    this.yaw += this.velocity;
    this.idle = 0;
  }

  release(): void {
    this.held = false;
  }

  /** Giro directo, sin inercia (teclado). */
  nudge(radians: number): void {
    this.velocity = 0;
    this.yaw += radians;
    this.idle = 0;
  }

  /** Avanza un cuadro y devuelve el giro en radianes. */
  step(dt: number, still: boolean): number {
    if (this.held) return this.yaw;
    this.idle += dt;
    if (still) {
      this.velocity = 0;
      if (this.idle > RETURN_AFTER) this.yaw = nearestFront(this.yaw);
      return this.yaw;
    }
    this.yaw += this.velocity * dt * 60;
    this.velocity *= Math.exp(-dt * 2.8);
    if (this.idle > RETURN_AFTER) this.yaw += (nearestFront(this.yaw) - this.yaw) * (1 - Math.exp(-dt * 2));
    return this.yaw;
  }
}
