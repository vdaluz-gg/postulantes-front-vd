import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api';
import { MotionService } from '../../core/services/motion.service';
import { HoloAvatarLoaderService } from '../../shared/three/holo-avatar-loader.service';
import { AudienceConfig, FieldConfig } from '../backoffice/data/site-config.model';
import { findSection, updateField, updateItem } from '../backoffice/data/site-config.ops';
import { SITE_CONFIG_SEED } from '../backoffice/data/site-config.seed';
import { PERSONAS } from './portada.data';
import { PortadaPage } from './portada.page';
import { formFields } from './postulante/components/candidate-form/candidate-form.component';
import { CandidacyApi, CandidateContact } from './postulante/candidacy.api';
import {
  HttpPublishedConfigApi,
  PortadaConfig,
  PublishedConfigApi,
  activeAlerts,
  withCopy,
} from './published-config';

const post = PERSONAS[0];
const seedFields = findSection(SITE_CONFIG_SEED, 'postulantes', 'application')!.fields;
const text = (id: string, label: string, extra: Partial<FieldConfig> = {}): FieldConfig => ({
  id,
  label,
  type: 'text',
  required: false,
  visible: true,
  readonly: false,
  tone: 'neutral',
  ...extra,
});

describe('configuración publicada: reglas', () => {
  it('aplica los textos al perfil y parte el título en la última coma', () => {
    const copy = [
      { id: 'title', label: '', value: 'Trabajo de verdad, cerca tuyo.', multiline: false },
      { id: 'suggestions', label: '', value: 'Chofer\n\n  Cocina  \n', multiline: true },
      { id: 'footnote', label: '', value: '  ', multiline: false },
    ];
    const persona = withCopy(post, copy);
    expect(persona).toEqual(
      expect.objectContaining({
        title: 'Trabajo de verdad,',
        highlight: 'cerca tuyo.',
        suggestions: ['Chofer', 'Cocina'],
        footnote: post.footnote,
      }),
    );
    expect(
      withCopy(post, [{ id: 'title', label: '', value: 'Sin coma', multiline: false }]),
    ).toEqual(expect.objectContaining({ title: 'Sin coma', highlight: '' }));
  });

  it('muestra solo los avisos activos, con mensaje y en fecha', () => {
    const base = { level: 'info' as const, title: 't', message: 'm', active: true };
    const alerts = [
      { ...base, id: 'a' },
      { ...base, id: 'b', active: false },
      { ...base, id: 'c', message: ' ' },
      { ...base, id: 'd', startsOn: '2026-12-01' },
      { ...base, id: 'e', endsOn: '2026-11-05' },
      { ...base, id: 'f', startsOn: '2026-11-06', endsOn: '2026-11-06' },
    ];
    expect(activeAlerts(alerts, '2026-11-06').map((a) => a.id)).toEqual(['a', 'f']);
  });

  it('los datos que necesita la postulación siempre están y son obligatorios; lo oculto no es obligatorio', () => {
    const fields = formFields([
      text('fullName', 'Nombre y apellido'),
      text('firstName', 'Nombre', { visible: false, required: false }),
      text('zone', 'Zona', { visible: false, required: true }),
      text('extra', 'Extra', { required: true, visible: false }),
    ]);
    const by = (id: string) => fields.find((f) => f.config.id === id)!;
    expect(by('firstName')).toEqual(expect.objectContaining({ visible: true, required: true }));
    expect(by('zone')).toEqual(expect.objectContaining({ visible: false, required: false }));
    expect(by('extra')).toEqual(expect.objectContaining({ visible: false, required: false }));
    // Los que faltan se agregan; el puesto oculto (lo completa la oferta).
    // El campo viejo "Nombre y apellido" ya no se muestra.
    expect(fields.map((f) => f.config.id)).toEqual([
      'firstName',
      'zone',
      'extra',
      'lastName',
      'dni',
      'cuil',
      'email',
      'whatsapp',
      'position',
    ]);
    expect(by('position').visible).toBe(false);
  });

  it('con backend pide lo publicado y, si no hay nada, usa la configuración inicial', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://api' },
        { provide: PublishedConfigApi, useClass: HttpPublishedConfigApi },
      ],
    });
    const api = TestBed.inject(PublishedConfigApi);
    const ctrl = TestBed.inject(HttpTestingController);
    const published = firstValueFrom(api.audience('postulantes'));
    ctrl
      .expectOne('http://api/site-config/postulantes')
      .flush({ message: 'x' }, { status: 404, statusText: 'Not Found' });
    expect(await published).toBe(SITE_CONFIG_SEED.audiences.postulantes);
  });
});

describe('configuración publicada con el formato anterior', () => {
  it('la portada la pone al día: "Nombre y apellido" pasa a ser Nombre y Apellido, y suma el CUIL', () => {
    const legacy: AudienceConfig = {
      ...SITE_CONFIG_SEED.audiences.postulantes,
      sections: SITE_CONFIG_SEED.audiences.postulantes.sections.map((s) =>
        s.id === 'application'
          ? {
              ...s,
              fields: [
                text('fullName', 'Nombre y apellido', { required: true }),
                ...s.fields.filter((f) => !['firstName', 'lastName', 'cuil'].includes(f.id)),
              ],
            }
          : s,
      ),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: PublishedConfigApi, useValue: { audience: () => of(legacy) } }],
    });
    const config = TestBed.inject(PortadaConfig);
    config.load();
    expect(config.applicationFields().map((f) => f.id)).toEqual([
      'firstName',
      'lastName',
      'dni',
      'cuil',
      'email',
      'whatsapp',
      'zone',
      'position',
    ]);
  });
});

describe('la portada muestra lo que publicó el backoffice', () => {
  let fixture: ComponentFixture<PortadaPage>;
  let el: HTMLElement;
  let applied: CandidateContact[];

  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r));
    fixture.detectChanges();
  };
  const button = (label: string) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.textContent!.trim().startsWith(label),
    )!;
  const type = (id: string, value: string) => {
    const field = el.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)!;
    field.value = value;
    field.dispatchEvent(new Event(field instanceof HTMLSelectElement ? 'change' : 'input'));
    field.dispatchEvent(new Event('blur'));
  };

  beforeEach(async () => {
    applied = [];
    let config = SITE_CONFIG_SEED;
    config = updateItem(config, 'postulantes', 'copy', 'title', {
      value: 'Tu próximo trabajo, más cerca.',
    });
    config = updateItem(config, 'postulantes', 'alerts', 'no-money', {
      title: 'Atención',
      message: 'Nunca te pedimos plata.',
    });
    config = updateField(config, 'postulantes', 'application', 'zone', {
      placeholder: 'Barrio o ciudad',
    });
    const [firstName, ...rest] = findSection(config, 'postulantes', 'application')!.fields;
    const fields = [
      firstName,
      text('middleName', 'Segundo nombre', { required: true, placeholder: 'Si tenés' }),
      ...rest,
      text('shift', 'Turno', {
        type: 'select',
        options: [
          { value: 'manana', label: 'Mañana' },
          { value: 'tarde', label: 'Tarde' },
        ],
      }),
    ];
    const postulantes: AudienceConfig = {
      ...config.audiences.postulantes,
      sections: config.audiences.postulantes.sections.map((s) =>
        s.id === 'application' ? { ...s, fields } : s,
      ),
    };

    await TestBed.configureTestingModule({
      imports: [PortadaPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: HoloAvatarLoaderService,
          useValue: {
            create: () => new Promise(() => undefined),
            loadModel: () => new Promise(() => undefined),
          },
        },
        { provide: MotionService, useValue: { reduced: () => true } },
        { provide: PublishedConfigApi, useValue: { audience: () => of(postulantes) } },
        {
          provide: CandidacyApi,
          useValue: {
            readCv: () => of({ cvId: null, prefill: {} }),
            apply: (contact: CandidateContact) => {
              applied.push(contact);
              return of({ trackingCode: 'GG-ABC123', position: contact.position });
            },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PortadaPage);
    el = fixture.nativeElement;
    await render();
    el.querySelector<HTMLButtonElement>('app-persona-figure .hit')!.click();
    await render();
  });

  it('el título y los avisos publicados', () => {
    expect(el.querySelector('app-persona-panel h2')!.textContent!.replace(/\s+/g, ' ').trim()).toBe(
      'Tu próximo trabajo, más cerca.',
    );
    expect(el.querySelector('app-persona-panel h2 em')!.textContent).toBe('más cerca.');
    expect(el.querySelector('.alert')!.textContent!.replace(/\s+/g, ' ').trim()).toBe(
      'Atención Nunca te pedimos plata.',
    );
  });

  it('el formulario a mano trae el campo nuevo en su lugar, lo exige y lo envía', async () => {
    button('Dejar mi CV con IA').click();
    await render();
    button('Prefiero completar mis datos a mano').click();
    await render();

    const ids = Array.from(el.querySelectorAll('app-candidate-form .field')).map(
      (f) => f.querySelector('input,select,textarea,[role=group]')!.id,
    );
    expect(ids).toEqual([
      'cf-firstName',
      'cf-middleName',
      'cf-lastName',
      'cf-dni',
      'cf-cuil',
      'cf-email',
      'cf-whatsapp',
      'cf-zone',
      'cf-position',
      'cf-shift',
    ]);
    expect(el.querySelector<HTMLInputElement>('#cf-middleName')!.placeholder).toBe('Si tenés');
    expect(el.querySelector<HTMLInputElement>('#cf-zone')!.placeholder).toBe('Barrio o ciudad');
    expect(el.querySelector('label[for="cf-shift"]')!.textContent).toBe('Turno (opcional)');

    type('cf-firstName', 'Lucía');
    type('cf-lastName', 'Fernández');
    type('cf-dni', '40123456');
    type('cf-email', 'lucia@ejemplo.com');
    type('cf-whatsapp', '11 4444-0101');
    type('cf-zone', 'Monte Grande');
    await render();
    button('Enviar postulación').click();
    await render();
    expect(applied).toEqual([]);
    expect(el.querySelector('#cf-middleName-err')!.textContent).toBe('Completá «Segundo nombre».');

    type('cf-middleName', ' Sofía ');
    type('cf-shift', 'tarde');
    await render();
    button('Enviar postulación').click();
    await render();
    expect(applied).toEqual([
      expect.objectContaining({
        firstName: 'Lucía',
        lastName: 'Fernández',
        dni: '40.123.456',
        answers: { middleName: 'Sofía', shift: 'tarde' },
      }),
    ]);
  });

  it('la configuración inicial coincide con los campos que usa el formulario', () => {
    expect(seedFields.map((f) => f.id)).toEqual([
      'firstName',
      'lastName',
      'dni',
      'cuil',
      'email',
      'whatsapp',
      'zone',
      'position',
    ]);
  });
});
