import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { of } from 'rxjs';
import { MotionService } from '../../../core/services/motion.service';
import { HoloAvatarLoaderService } from '../../../shared/three/holo-avatar-loader.service';
import { PortadaPage } from '../portada.page';
import { CandidacyApi, CandidateContact } from './candidacy.api';
import { OFFERS_URL } from './offers.api';

const MOCK = JSON.parse(readFileSync(join(process.cwd(), 'public/mock/ofertas.json'), 'utf8'));
const pendingLoader = { create: () => new Promise(() => undefined), loadModel: () => new Promise(() => undefined) };

describe('Panel del postulante: ofertas, CV y formulario', () => {
  let fixture: ComponentFixture<PortadaPage>;
  let el: HTMLElement;
  let http: HttpTestingController;
  let applied: CandidateContact[];

  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r));
    fixture.detectChanges();
  };
  const button = (text: string) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find((b) => b.textContent!.trim().startsWith(text))!;
  const type = (id: string, value: string) => {
    const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
  };
  const showOffers = async (text: string) => {
    button(text).click();
    await render();
    http.expectOne(OFFERS_URL).flush(MOCK);
    await render();
  };

  beforeEach(async () => {
    applied = [];
    await TestBed.configureTestingModule({
      imports: [PortadaPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HoloAvatarLoaderService, useValue: pendingLoader },
        { provide: MotionService, useValue: { reduced: () => true } },
        {
          provide: CandidacyApi,
          useValue: {
            readCv: () => of({ fullName: 'Martina Rodríguez', dni: '38.412.907', whatsapp: '11 5555-0142', zone: 'Monte Grande' }),
            apply: (contact: CandidateContact) => {
              applied.push(contact);
              return of(undefined);
            },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PortadaPage);
    el = fixture.nativeElement;
    http = TestBed.inject(HttpTestingController);
    await render();
    el.querySelector<HTMLButtonElement>('app-persona-figure .hit')!.click();
    await render();
  });

  afterEach(() => http.verify());

  it('"Ver todas las ofertas" muestra las ofertas del mock', async () => {
    await showOffers('Ver todas las ofertas');
    expect(el.querySelector('[appOfferResults] .say')!.textContent!.replace(/\s+/g, ' ')).toContain('Encontré una oferta');
    const jobs = Array.from(el.querySelectorAll('[appOfferResults] .job'));
    expect(jobs.map((j) => j.querySelector('b')!.textContent)).toEqual(['Operario/a Pan 29']);
    expect(jobs[0].querySelector('small')!.textContent).toBe(
      '9 de Julio 1450, El Talar Argentina · Industrial / Tecnica / Produccion',
    );
  });

  it('"Ver todas las ofertas" usa lo escrito en el buscador', async () => {
    type('q-post', 'Operario de depósito');
    await render();
    await showOffers('Ver todas las ofertas');
    expect(el.querySelector('[appOfferResults] .say')!.textContent).toContain('«Operario de depósito»');
    expect(el.querySelectorAll('[appOfferResults] .job')).toHaveLength(1);
  });

  it('una sugerencia muestra las ofertas relacionadas y, sin coincidencias, todas', async () => {
    button('Chofer cerca de Moreno').click();
    await render();
    http.expectOne(OFFERS_URL).flush(MOCK);
    await render();
    expect(el.querySelector('[appOfferResults] .say')!.textContent).toContain('No encontré ofertas para «Chofer cerca de Moreno»');
    expect(el.querySelectorAll('[appOfferResults] .job')).toHaveLength(1);
  });

  it('el detalle muestra los datos públicos de la oferta y no los internos', async () => {
    await showOffers('Ver todas las ofertas');
    el.querySelector<HTMLButtonElement>('[appOfferResults] .job')!.click();
    await render();
    const detail = el.querySelector('[appOfferDetail]')!;
    expect(detail.querySelector('h2')!.textContent).toBe('Operario/a Pan 29');
    expect(detail.querySelector('.kick')!.textContent).toContain('Ref. CSYP1233113446');
    expect(detail.querySelector('.meta')!.textContent).toContain('Salario $ 912.359');
    expect(detail.querySelector('.meta')!.textContent).toContain('1 vacante');
    expect(detail.textContent).not.toContain('BANK SA');
    expect(detail.textContent).not.toContain('@');
  });

  it('postularse desde el detalle: CV leído por la IA, formulario completo y postulación enviada', async () => {
    await showOffers('Ver todas las ofertas');
    el.querySelector<HTMLButtonElement>('[appOfferResults] .job')!.click();
    await render();
    button('Postularme').click();
    await render();
    expect(el.querySelector('[appCvUpload]')).not.toBeNull();

    const file = new File(['cv'], 'cv-martina.pdf', { type: 'application/pdf' });
    const picker = el.querySelector<HTMLInputElement>('[appCvUpload] input[type="file"]')!;
    Object.defineProperty(picker, 'files', { value: [file] });
    picker.dispatchEvent(new Event('change'));
    await render();

    expect(el.querySelector('[appPeekPanel] .ph')!.textContent!.trim()).toBe('La IA leyó tu CV y completó todo');
    expect(el.querySelector<HTMLInputElement>('#cf-fullName')!.value).toBe('Martina Rodríguez');
    expect(el.querySelector<HTMLInputElement>('#cf-position')!.value).toBe('Operario/a Pan 29');

    button('Enviar postulación').click();
    await render();
    expect(applied).toEqual([
      { fullName: 'Martina Rodríguez', dni: '38.412.907', whatsapp: '11 5555-0142', zone: 'Monte Grande', position: 'Operario/a Pan 29' },
    ]);
    expect(el.querySelector('[appApplicationSent]')!.textContent).toContain('¡Listo, Martina!');
  });

  it('el CV tiene que ser PDF o Word', async () => {
    button('Dejar mi CV con IA').click();
    await render();
    const picker = el.querySelector<HTMLInputElement>('[appCvUpload] input[type="file"]')!;
    Object.defineProperty(picker, 'files', { value: [new File(['x'], 'foto.png', { type: 'image/png' })] });
    picker.dispatchEvent(new Event('change'));
    await render();
    expect(el.querySelector('#cv-err')!.textContent).toContain('Subilo en PDF o Word');
  });

  it('el formulario a mano valida cada campo, marca los errores y no envía', async () => {
    button('Dejar mi CV con IA').click();
    await render();
    button('Prefiero completar mis datos a mano').click();
    await render();
    expect(el.querySelector<HTMLInputElement>('#cf-position')!.value).toBe('Postulación espontánea');

    type('cf-fullName', 'Martina');
    type('cf-dni', '123');
    type('cf-whatsapp', '5555');
    await render();
    button('Enviar postulación').click();
    await render();

    expect(applied).toEqual([]);
    expect(el.querySelector('.summary')!.textContent).toBe('Revisá 4 campos.');
    expect(el.querySelector('#cf-fullName')!.getAttribute('aria-invalid')).toBe('true');
    expect(el.querySelector('#cf-fullName-err')!.textContent).toBe('Sumá tu apellido.');
    expect(el.querySelector('#cf-dni-err')!.textContent).toBe('Revisá el DNI: son 7 u 8 números.');
    expect(el.querySelector('#cf-whatsapp-err')!.textContent).toContain('10 dígitos');
    expect(el.querySelector('#cf-zone-err')!.textContent).toBe('Contanos en qué zona vivís.');
    expect(document.activeElement).toBe(el.querySelector('#cf-fullName'));
  });

  it('"Sí, postulame" del aviso de WhatsApp abre la carga del CV para ese puesto', async () => {
    el.querySelectorAll<HTMLButtonElement>('button[appTopicChip]')[1].click();
    await render();
    button('Sí, postulame').click();
    await render();
    button('Prefiero completar mis datos a mano').click();
    await render();
    expect(el.querySelector<HTMLInputElement>('#cf-position')!.value).toBe('Operario/a de producción');
  });

  it('si no cargan las ofertas, avisa y permite reintentar', async () => {
    button('Ver todas las ofertas').click();
    await render();
    http.expectOne(OFFERS_URL).flush('error', { status: 500, statusText: 'Error' });
    await render();
    expect(el.querySelector('.notice')!.textContent).toContain('No pudimos cargar las ofertas');
    button('Reintentar').click();
    await render();
    http.expectOne(OFFERS_URL).flush(MOCK);
    await render();
    expect(el.querySelectorAll('[appOfferResults] .job')).toHaveLength(1);
  });
});
