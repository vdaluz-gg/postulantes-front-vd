import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SoundService } from './sound.service';
import { STORAGE_KEYS, StorageService } from './storage.service';
import { ThemeService } from './theme.service';

describe('servicios core', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  describe('StorageService', () => {
    it('guarda, lee y borra valores', () => {
      const storage = TestBed.inject(StorageService);
      storage.set('k', 'v');
      expect(storage.get('k')).toBe('v');
      storage.remove('k');
      expect(storage.get('k')).toBeNull();
    });

    it('lee JSON y tolera valores corruptos', () => {
      const storage = TestBed.inject(StorageService);
      storage.set('ok', '{"a":1}');
      storage.set('roto', '{');
      expect(storage.getJson('ok')).toEqual({ a: 1 });
      expect(storage.getJson('roto')).toBeNull();
    });

    it('no falla si el navegador bloquea el almacenamiento', () => {
      const storage = TestBed.inject(StorageService);
      const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('bloqueado');
      });
      expect(storage.get('k')).toBeNull();
      spy.mockRestore();
    });
  });

  describe('ThemeService', () => {
    it('arranca en oscuro y aplica data-theme en <html>', () => {
      const theme = TestBed.inject(ThemeService);
      theme.init();
      expect(theme.theme()).toBe('dark');
      expect(TestBed.inject(DOCUMENT).documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('recupera el tema guardado y persiste los cambios', () => {
      localStorage.setItem(STORAGE_KEYS.theme, 'light');
      const theme = TestBed.inject(ThemeService);
      theme.init();
      expect(theme.theme()).toBe('light');
      theme.toggle();
      expect(theme.theme()).toBe('dark');
      expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe('dark');
    });
  });

  describe('SoundService', () => {
    const oscillators: { frequency: number }[] = [];

    beforeEach(() => {
      oscillators.length = 0;
      const param = () => ({ setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() });
      (globalThis as { AudioContext?: unknown }).AudioContext = jest.fn().mockImplementation(() => ({
        currentTime: 0,
        state: 'running',
        destination: {},
        createOscillator: () => {
          const osc = { type: '', frequency: param(), connect: jest.fn(), start: jest.fn(), stop: jest.fn() };
          oscillators.push({ frequency: 0 });
          return osc;
        },
        createGain: () => ({ gain: param(), connect: jest.fn() }),
        resume: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      }));
    });

    afterEach(() => delete (globalThis as { AudioContext?: unknown }).AudioContext);

    it('respeta la preferencia guardada', () => {
      localStorage.setItem(STORAGE_KEYS.sound, '0');
      const sound = TestBed.inject(SoundService);
      sound.init();
      expect(sound.enabled()).toBe(false);
    });

    it('no suena antes de la primera interacción', () => {
      const sound = TestBed.inject(SoundService);
      sound.init();
      sound.play('click');
      expect(oscillators).toHaveLength(0);
    });

    it('suena al hacer click en un botón y se puede silenciar', () => {
      const sound = TestBed.inject(SoundService);
      sound.init();
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(oscillators).toHaveLength(2);

      sound.toggle();
      expect(sound.enabled()).toBe(false);
      expect(localStorage.getItem(STORAGE_KEYS.sound)).toBe('0');
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(oscillators).toHaveLength(2);
      button.remove();
    });

    it('confirma con un tono al reactivar desde un gesto', () => {
      const sound = TestBed.inject(SoundService);
      sound.init();
      sound.set(false);
      sound.set(true, true);
      expect(oscillators).toHaveLength(1);
    });
  });
});
