import { AvatarSpin, SPIN_PER_PX } from './avatar-spin';

const FRAME = 1 / 60;
const run = (spin: AvatarSpin, seconds: number, still = false) => {
  let yaw = 0;
  for (let t = 0; t < seconds; t += FRAME) yaw = spin.step(FRAME, still);
  return yaw;
};

describe('AvatarSpin', () => {
  it('gira según lo que se arrastra en horizontal', () => {
    const spin = new AvatarSpin();
    spin.grab();
    spin.drag(100);
    expect(spin.step(FRAME, false)).toBeCloseTo(100 * SPIN_PER_PX, 5);
    expect(spin.dragging).toBe(true);
  });

  it('al soltar sigue girando por inercia y frena', () => {
    const spin = new AvatarSpin();
    spin.grab();
    spin.drag(20);
    spin.release();
    const released = spin.step(FRAME, false);
    const later = run(spin, 0.5);
    const muchLater = run(spin, 0.5);
    expect(later).toBeGreaterThan(released);
    expect(muchLater - later).toBeLessThan(later - released);
  });

  it('sin movimiento reducido no hay inercia', () => {
    const spin = new AvatarSpin();
    spin.grab();
    spin.drag(20);
    spin.release();
    const released = spin.step(FRAME, true);
    expect(run(spin, 0.5, true)).toBeCloseTo(released, 5);
  });

  it('quieto unos segundos vuelve a mirar al frente', () => {
    const spin = new AvatarSpin();
    spin.grab();
    spin.drag(150);
    spin.release();
    expect(spin.facingFront).toBe(false);
    run(spin, 8);
    expect(spin.facingFront).toBe(true);
  });

  it('vuelve al frente más cercano: después de una vuelta casi entera no deshace el giro', () => {
    const spin = new AvatarSpin();
    spin.nudge(Math.PI * 2 - 0.2);
    expect(run(spin, 8)).toBeCloseTo(Math.PI * 2, 1);
  });

  it('mientras se arrastra no vuelve al frente', () => {
    const spin = new AvatarSpin();
    spin.grab();
    spin.drag(150);
    expect(run(spin, 8)).toBeCloseTo(150 * SPIN_PER_PX, 5);
  });

  it('las flechas del teclado giran de a pasos', () => {
    const spin = new AvatarSpin();
    spin.nudge(0.4);
    expect(spin.step(FRAME, false)).toBeCloseTo(0.4, 5);
  });
});
