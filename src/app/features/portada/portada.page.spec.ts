import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HoloAvatarLoaderService } from '../../shared/three/holo-avatar-loader.service';
import { PortadaPage } from './portada.page';
import { personaForQuery } from './portada.data';

/** El motor 3D no corre en jsdom: queda cargando y se ve la silueta. */
const pendingLoader = { create: () => new Promise(() => undefined), loadModel: () => new Promise(() => undefined) };

describe('personaForQuery', () => {
  it('elige el perfil según lo que escribió la persona', () => {
    expect(personaForQuery('¿Cuándo cobro el aguinaldo?')).toBe('col');
    expect(personaForQuery('Necesito 40 operarios para mi empresa')).toBe('cli');
    expect(personaForQuery('Busco trabajo de chofer en Moreno')).toBe('post');
    expect(personaForQuery('Liquidación de sueldos')).toBe('col');
  });
});

describe('PortadaPage', () => {
  let fixture: ComponentFixture<PortadaPage>;
  let el: HTMLElement;

  const figures = () => Array.from(el.querySelectorAll('app-persona-figure'));
  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [PortadaPage],
      providers: [provideRouter([]), { provide: HoloAvatarLoaderService, useValue: pendingLoader }],
    }).compileComponents();
    fixture = TestBed.createComponent(PortadaPage);
    el = fixture.nativeElement;
    await render();
  });

  it('muestra el titular, los tres perfiles y la caja de IA', () => {
    expect(el.querySelector('h1')!.textContent).toContain('Bienvenido a donde');
    expect(figures().map((f) => f.querySelector('.hit')!.getAttribute('aria-label'))).toEqual([
      'Postulantes: ¿Sos postulante?',
      'Empresas: ¿Sos cliente?',
      'Colaboradores: ¿Sos colaborador?',
    ]);
    expect(el.querySelector('#q-route')!.getAttribute('placeholder')).toBe('Contale a la IA qué buscás y te llevo');
  });

  it('ilumina al postulante por defecto y al perfil que se señala', async () => {
    expect(figures().map((f) => f.className)).toEqual(['lit', 'idle', 'idle']);
    figures()[1].querySelector('.hit')!.dispatchEvent(new Event('mouseenter'));
    await render();
    expect(figures().map((f) => f.className)).toEqual(['idle', 'lit', 'idle']);
  });

  it('al elegir el postulante abre su panel con acceso al portal y se cierra con Escape', async () => {
    figures()[0].querySelector<HTMLButtonElement>('.hit')!.click();
    await render();
    expect(el.querySelector('.stage')!.classList).toContain('open');
    expect(figures()[0].classList).toContain('selected');
    expect(figures()[1].classList).toContain('away');
    expect(el.querySelector('app-persona-panel h2')!.textContent).toContain('El trabajo de la Argentina');
    expect(el.querySelector('.topportal')!.getAttribute('href')).toBe('/postulante');
    expect(el.querySelector('button[appBackTab]')).not.toBeNull();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await render();
    expect(el.querySelector('.stage')!.classList).not.toContain('open');
    expect(el.querySelector('app-persona-panel')).toBeNull();
  });

  it('el perfil sin portal todavía no ofrece "Ingresar a tu portal" y sus acciones quedan deshabilitadas', async () => {
    figures()[1].querySelector<HTMLButtonElement>('.hit')!.click();
    await render();
    expect(el.querySelector('.topportal')).toBeNull();
    const actions = Array.from(el.querySelectorAll<HTMLButtonElement>('app-persona-panel .cta button'));
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.every((b) => b.disabled)).toBe(true);
  });

  it('la caja de IA lleva al perfil que corresponde con la consulta precargada', async () => {
    jest.useFakeTimers();
    try {
      const input = el.querySelector<HTMLInputElement>('#q-route')!;
      input.value = 'Necesito 40 operarios';
      input.dispatchEvent(new Event('input'));
      el.querySelector('.route form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      fixture.detectChanges();
      expect(el.querySelector('.reply .typing')).not.toBeNull();

      jest.advanceTimersByTime(500);
      fixture.detectChanges();
      expect(el.querySelector('.reply')!.textContent).toContain('Te llevo a Empresas');

      jest.advanceTimersByTime(650);
      fixture.detectChanges();
      expect(el.querySelector('app-persona-panel h2')!.textContent).toContain('Tu dotación');
      expect(el.querySelector<HTMLInputElement>('#q-cli')!.value).toBe('Necesito 40 operarios');
    } finally {
      jest.useRealTimers();
    }
  });

  it('el panel completa la consulta con una sugerencia y marca un tema', async () => {
    figures()[0].querySelector<HTMLButtonElement>('.hit')!.click();
    await render();
    const suggestion = el.querySelector<HTMLButtonElement>('.sugg button')!;
    suggestion.click();
    await render();
    expect(el.querySelector<HTMLInputElement>('#q-post')!.value).toBe(suggestion.textContent!.trim());

    const chip = el.querySelector<HTMLButtonElement>('.chips .chip')!;
    chip.click();
    await render();
    expect(chip.getAttribute('aria-pressed')).toBe('true');
    chip.click();
    await render();
    expect(chip.getAttribute('aria-pressed')).toBe('false');
  });

  it('los controles de la barra superior tienen nombre y estado accesibles', async () => {
    const sound = el.querySelector('button[appSoundToggle]')!;
    const theme = el.querySelector('button[appThemeToggle]')!;
    expect(sound.getAttribute('aria-pressed')).toBe('true');
    expect(sound.getAttribute('aria-label')).toBe('Silenciar sonidos y voz');
    expect(theme.getAttribute('role')).toBe('switch');
    (theme as HTMLButtonElement).click();
    await render();
    expect(theme.getAttribute('aria-checked')).toBe('false');
    expect(theme.getAttribute('aria-label')).toBe('Cambiar a modo oscuro');
    (sound as HTMLButtonElement).click();
    await render();
    expect(sound.getAttribute('aria-pressed')).toBe('false');
  });
});
