import { DOCUMENT, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HoloAvatarConfig, HoloAvatarEngine, HoloAvatarFactory } from './holo-avatar.types';

const ENGINE_URL = 'vendor/gg-holo.js';

/**
 * Carga diferida del motor 3D (575 KB) y de los modelos GLB. Cada recurso se descarga una
 * sola vez y queda en caché para los siguientes avatares.
 */
@Injectable({ providedIn: 'root' })
export class HoloAvatarLoaderService {
  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private engine: Promise<HoloAvatarFactory> | null = null;
  private readonly models = new Map<string, Promise<string>>();

  /** Crea una instancia del motor lista para init(). Rechaza si el navegador no puede cargarlo. */
  async create(config: HoloAvatarConfig): Promise<HoloAvatarEngine> {
    const factory = await this.loadEngine();
    return factory(config);
  }

  /** Modelo GLB codificado en base64, como lo espera el motor. */
  loadModel(url: string): Promise<string> {
    let model = this.models.get(url);
    if (!model) {
      model = fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`No se pudo descargar el modelo ${url} (${res.status})`);
          return res.arrayBuffer();
        })
        .then(toBase64);
      model.catch(() => this.models.delete(url));
      this.models.set(url, model);
    }
    return model;
  }

  private loadEngine(): Promise<HoloAvatarFactory> {
    if (!this.isBrowser) return Promise.reject(new Error('El motor 3D solo corre en el navegador'));
    if (this.engine) return this.engine;

    this.engine = new Promise<HoloAvatarFactory>((resolve, reject) => {
      const win = this.doc.defaultView;
      if (win?.GGMake) {
        resolve(win.GGMake);
        return;
      }
      const script = this.doc.createElement('script');
      script.src = ENGINE_URL;
      script.async = true;
      script.onload = () => (win?.GGMake ? resolve(win.GGMake) : reject(new Error('El motor 3D no expuso GGMake')));
      script.onerror = () => reject(new Error('No se pudo cargar el motor 3D'));
      this.doc.head.appendChild(script);
    });
    this.engine.catch(() => (this.engine = null));
    return this.engine;
  }
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
