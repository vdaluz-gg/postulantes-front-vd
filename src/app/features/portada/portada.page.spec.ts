import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
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
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HoloAvatarLoaderService, useValue: pendingLoader },
      ],
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

  it('las figuras arrancan oscuras y se ilumina solo la que se señala', async () => {
    expect(figures().map((f) => f.className)).toEqual(['idle', 'idle', 'idle']);
    figures()[0].querySelector('.hit')!.dispatchEvent(new Event('mouseenter'));
    await render();
    expect(figures().map((f) => f.className)).toEqual(['lit', 'idle', 'idle']);
    figures()[0].querySelector('.hit')!.dispatchEvent(new Event('mouseleave'));
    await render();
    expect(figures().map((f) => f.className)).toEqual(['idle', 'idle', 'idle']);
  });

  it('arrastrar la figura la gira sin abrir el perfil; un click sin arrastre lo abre', async () => {
    const hit = figures()[0].querySelector<HTMLButtonElement>('.hit')!;
    const press = (type: string, x: number) => hit.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: 200, bubbles: true }));
    press('pointerdown', 100);
    press('pointermove', 160);
    await render();
    expect(figures()[0].classList).toContain('grabbing');
    press('pointerup', 160);
    hit.click();
    await render();
    expect(figures()[0].classList).not.toContain('grabbing');
    expect(figures()[0].classList).not.toContain('selected');

    hit.click();
    await render();
    expect(figures()[0].classList).toContain('selected');
  });

  it('al elegir el postulante abre su panel con acceso al portal y se cierra con Escape', async () => {
    figures()[0].querySelector<HTMLButtonElement>('.hit')!.click();
    await render();
    expect(el.querySelector('.stage')!.classList).toContain('open');
    expect(figures()[0].classList).toContain('selected');
    expect(figures()[1].classList).toContain('away');
    expect(el.querySelector('app-persona-panel h2')!.textContent).toContain('El trabajo de la Argentina');
    expect(el.querySelector('.topportal')!.textContent).toContain('Ingresar a tu portal');
    expect(el.querySelector('button[appBackTab]')).not.toBeNull();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await render();
    expect(el.querySelector('.stage')!.classList).not.toContain('open');
    expect(el.querySelector('app-persona-panel')).toBeNull();
    expect(el.querySelector('.topportal')).toBeNull();
  });

  it('el perfil sin portal muestra el botón "Ingresar a tu portal" sin destino y sus acciones quedan deshabilitadas', async () => {
    figures()[1].querySelector<HTMLButtonElement>('.hit')!.click();
    await render();
    const portal = el.querySelector<HTMLElement>('.topportal')!;
    expect(portal.tagName).toBe('BUTTON');
    expect(portal.getAttribute('title')).toBe('Próximamente');
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

  describe('panel del postulante', () => {
    const chips = () => Array.from(el.querySelectorAll<HTMLButtonElement>('button[appTopicChip]'));
    const pressed = () => chips().map((c) => c.getAttribute('aria-pressed'));
    const peekTitle = () => el.querySelector('[appPeekPanel] .ph')?.textContent!.trim();
    const hover = async (chip: HTMLElement) => {
      chip.dispatchEvent(new Event('pointerenter'));
      await render();
    };

    beforeEach(async () => {
      figures()[0].querySelector<HTMLButtonElement>('.hit')!.click();
      await render();
    });

    it('una sugerencia completa la consulta y queda resaltada', async () => {
      const suggestion = el.querySelector<HTMLButtonElement>('button[appSuggestionPill]')!;
      suggestion.click();
      await render();
      expect(el.querySelector<HTMLInputElement>('#q-post')!.value).toBe(suggestion.textContent!.trim());
      expect(suggestion.classList).toContain('on');
    });

    it('al abrir muestra el mapa de ofertas cercanas, con las distancias como lista', () => {
      expect(pressed()).toEqual(['true', 'false', 'false']);
      expect(peekTitle()).toBe('Ordenado por cercanía a tu casa');
      const pins = Array.from(el.querySelectorAll('[appNearbyMap] .pin'));
      expect(pins.map((p) => p.textContent!.trim())).toEqual([
        'Operario/a · 12 min',
        'Autoelevador · 18 min',
        'Chofer · 25 min',
      ]);
      expect(el.querySelectorAll('[appNearbyMap] path')).toHaveLength(3);
      expect(pins[1].classList).toContain('flip');
    });

    it('al pasar por "Avisos por WhatsApp" muestra el aviso con "Sí, postulame" y "Ver más ofertas"', async () => {
      await hover(chips()[1]);
      expect(pressed()).toEqual(['false', 'true', 'false']);
      expect(peekTitle()).toBe('Así te avisa la IA');
      expect(el.querySelector('[appWhatsappPreview] .wa b')!.textContent).toBe('Operario/a de producción');
      const replies = Array.from(el.querySelectorAll<HTMLButtonElement>('[appWhatsappPreview] button[appPortadaButton]'));
      expect(replies.map((b) => [b.textContent!.trim(), b.disabled, b.classList.contains('pri')])).toEqual([
        ['Sí, postulame', false, true],
        ['Ver más ofertas', false, false],
      ]);
    });

    it('al enfocar "Seguí cada postulación" muestra las etapas con la actual marcada', async () => {
      chips()[2].dispatchEvent(new Event('focus'));
      await render();
      expect(peekTitle()).toBe('Tu postulación, en tiempo real');
      const steps = Array.from(el.querySelectorAll('[appApplicationTracker] .step'));
      expect(steps.map((s) => s.classList.contains('done'))).toEqual([true, true, false, false]);
      expect(steps[2].getAttribute('aria-current')).toBe('step');
    });

    it('un tema tocado queda fijo aunque se pase por otro', async () => {
      chips()[2].click();
      await render();
      await hover(chips()[0]);
      expect(pressed()).toEqual(['false', 'false', 'true']);
      expect(peekTitle()).toBe('Tu postulación, en tiempo real');
      chips()[1].click();
      await render();
      expect(peekTitle()).toBe('Así te avisa la IA');
    });

    it('las acciones del panel usan el botón de la portada', () => {
      const actions = Array.from(el.querySelectorAll<HTMLButtonElement>('.cta button[appPortadaButton]'));
      expect(actions.map((a) => a.textContent!.trim())).toEqual(['Ver todas las ofertas →', 'Dejar mi CV con IA']);
      expect(actions[0].classList).toContain('pri');
      expect(actions.every((a) => !a.disabled)).toBe(true);
    });
  });

  it('los perfiles sin vista previa no muestran el recuadro', async () => {
    figures()[1].querySelector<HTMLButtonElement>('.hit')!.click();
    await render();
    expect(el.querySelector('[appPeekPanel]')).toBeNull();
    expect(el.querySelectorAll('button[appTopicChip]')).toHaveLength(5);
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
