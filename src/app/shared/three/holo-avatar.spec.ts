import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HoloAvatarComponent, HoloAvatarStatus } from './holo-avatar/holo-avatar.component';
import { HoloAvatarLoaderService } from './holo-avatar-loader.service';
import { HoloAvatarEngine } from './holo-avatar.types';

describe('HoloAvatarLoaderService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));
  afterEach(() => {
    delete (globalThis as { fetch?: unknown }).fetch;
    delete window.AvatarHolo;
  });

  it('descarga el modelo una sola vez y lo entrega en base64', async () => {
    const bytes = new TextEncoder().encode('glTF');
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ ok: true, arrayBuffer: () => Promise.resolve(bytes.buffer) });
    (globalThis as { fetch?: unknown }).fetch = fetchMock;
    const loader = TestBed.inject(HoloAvatarLoaderService);

    await expect(loader.loadModel('assets/models/x.glb')).resolves.toBe(btoa('glTF'));
    await loader.loadModel('assets/models/x.glb');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rechaza si el modelo no existe y permite reintentar', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: false, status: 404 });
    (globalThis as { fetch?: unknown }).fetch = fetchMock;
    const loader = TestBed.inject(HoloAvatarLoaderService);
    await expect(loader.loadModel('falta.glb')).rejects.toThrow('404');
    await expect(loader.loadModel('falta.glb')).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('carga el motor con un <script> y crea instancias con la configuración', async () => {
    const engine = {} as HoloAvatarEngine;
    const factory = jest.fn().mockReturnValue(engine);
    const loader = TestBed.inject(HoloAvatarLoaderService);
    const created = loader.create({ rotD: 0, rotL: 0 });

    const script = document.head.querySelector<HTMLScriptElement>(
      'script[src="avatar/avatar-holo.js"]',
    )!;
    expect(script).not.toBeNull();
    window.AvatarHolo = factory;
    script.onload!(new Event('load'));

    await expect(created).resolves.toBe(engine);
    expect(factory).toHaveBeenCalledWith({ rotD: 0, rotL: 0 });
    script.remove();
  });
});

@Component({
  imports: [HoloAvatarComponent],
  template: `<app-holo-avatar
    model="m.glb"
    [config]="{ rotD: 0, rotL: 0 }"
    (status)="status.set($event)"
  />`,
})
class HostComponent {
  readonly status = signal<HoloAvatarStatus | null>(null);
}

describe('HoloAvatarComponent', () => {
  const setup = async (loader: Partial<HoloAvatarLoaderService>) => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: HoloAvatarLoaderService, useValue: loader }],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r));
    return fixture;
  };

  it('avisa "failed" si el motor no se puede cargar, para mostrar la silueta', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const fixture = await setup({
      create: () => Promise.reject(new Error('sin WebGL')),
      loadModel: () => Promise.resolve(''),
    });
    expect(fixture.componentInstance.status()).toBe('failed');
  });

  it('inicializa la escena en su propio canvas con el modelo descargado', async () => {
    const frame = jest.fn();
    const init = jest.fn().mockResolvedValue(true);
    const engine = { init, frame, reset: jest.fn(), fd: 1 } as unknown as HoloAvatarEngine;
    const fixture = await setup({
      create: () => Promise.resolve(engine),
      loadModel: () => Promise.resolve('QUJD'),
    });

    const canvas = (fixture.nativeElement as HTMLElement).querySelector('canvas');
    expect(init).toHaveBeenCalledWith(canvas, 'QUJD');
    fixture.destroy();
  });
});
