import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FormControl } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { firstValueFrom } from 'rxjs';
import { CandidacyApi, CandidateContact, HttpCandidacyApi, zoneKey } from './candidacy.api';
import { dniValidator, emailValidator, formatDni, fullNameValidator, whatsappValidator } from './candidate-validators';
import { JobOffersResponse, JobPosting, formatDayMonth, toJobPosting } from './job-offer';
import { searchJobs } from './job-search';
import { API_BASE_URL } from '../../../core/api/api';
import { HttpOffersApi, OFFERS_URL, OffersApi } from './offers.api';

/** El mismo archivo que sirve la app en /mock/ofertas.json. */
const MOCK: JobOffersResponse = JSON.parse(readFileSync(join(process.cwd(), 'public/mock/ofertas.json'), 'utf8'));
const offer = (over: Partial<JobPosting> = {}): JobPosting => ({ ...toJobPosting(MOCK.ofertas[0]), ...over });

describe('mapeo de ofertas (mock JSON)', () => {
  it('toma solo los datos de la publicación', () => {
    expect(toJobPosting(MOCK.ofertas[0])).toEqual({
      ref: 'CSYP1233113446',
      title: 'Operario/a Pan 29',
      description: MOCK.ofertas[0].descripcion,
      zone: 'Gral. Pacheco',
      area: 'Logística',
      schedule: 'Martes 24/06 · 12 a 18 h',
      publishedOn: '2026-11-04',
      requirements: ['Disponibilidad para la jornada del martes 24/06', 'Sin experiencia obligatoria'],
      benefits: ['Pago al finalizar el mes'],
    });
  });

  it('todas las ofertas del mock se mapean sin exponer datos internos', () => {
    expect(new Set(MOCK.ofertas.map((o) => o.codigo)).size).toBe(MOCK.ofertas.length);
    for (const dto of MOCK.ofertas) {
      const job = toJobPosting(dto);
      expect(job.title).toBeTruthy();
      expect(job.zone).toBeTruthy();
      expect(job.publishedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(job.requirements.length).toBeGreaterThan(0);
      expect(job.benefits.length).toBeGreaterThan(0);
      const values = JSON.stringify(job);
      for (const internal of [dto.cliente, dto.convenio, dto.domicilioExplotacion.direccion, String(dto.salario), '@']) {
        expect(values).not.toContain(internal);
      }
    }
  });

  it('muestra la fecha de publicación como día y mes', () => {
    expect(formatDayMonth('2026-10-06')).toBe('06/10');
  });
});

describe('searchJobs', () => {
  const offers = [
    offer({ ref: 'A', title: 'Operario/a de depósito', description: 'Carga y descarga' }),
    offer({ ref: 'B', title: 'Chofer de reparto', description: 'Reparto en Moreno', area: 'Logística', zone: 'Moreno' }),
    offer({ ref: 'C', title: 'Analista administrativo', description: 'Trabajo de oficina', area: 'Administración', zone: 'CABA' }),
  ];

  it('sin consulta devuelve todas', () => {
    expect(searchJobs('  ', offers).jobs.map((j) => j.ref)).toEqual(['A', 'B', 'C']);
  });

  it('devuelve todas las ofertas relacionadas, de más a menos coincidencias', () => {
    const result = searchJobs('Chofer cerca de Moreno', offers);
    expect(result.matched).toBe(true);
    expect(result.jobs.map((j) => j.ref)).toEqual(['B']);
    expect(searchJobs('Trabajo de oficina', offers).jobs.map((j) => j.ref)).toEqual(['C']);
  });

  it('ignora tildes y mayúsculas', () => {
    expect(searchJobs('ADMINISTRACIÓN', offers).jobs.map((j) => j.ref)).toEqual(['C']);
  });

  it('sin coincidencias muestra todas e indica que no hubo match', () => {
    const result = searchJobs('Desarrollador Frontend', offers);
    expect(result.matched).toBe(false);
    expect(result.jobs).toHaveLength(3);
  });
});

describe('validadores del formulario de contacto', () => {
  const check = (validator: typeof dniValidator, value: string) => validator(new FormControl(value));

  it('nombre y apellido', () => {
    expect(check(fullNameValidator, 'Martina Rodríguez')).toBeNull();
    expect(check(fullNameValidator, 'Martina')).toEqual({ fullName: 'missingLastName' });
    expect(check(fullNameValidator, 'Martina 123')).toEqual({ fullName: 'invalidChars' });
    expect(check(fullNameValidator, '')).toBeNull();
  });

  it('DNI de 7 u 8 dígitos, con o sin puntos', () => {
    expect(check(dniValidator, '38.412.907')).toBeNull();
    expect(check(dniValidator, '5412907')).toBeNull();
    expect(check(dniValidator, '412907')).toEqual({ dni: true });
    expect(check(dniValidator, '38a412907')).toEqual({ dni: true });
    expect(formatDni('38412907')).toBe('38.412.907');
  });

  it('email con usuario, dominio y extensión', () => {
    expect(check(emailValidator, 'martina@ejemplo.com')).toBeNull();
    expect(check(emailValidator, 'martina@ejemplo')).toEqual({ email: true });
    expect(check(emailValidator, 'martina ejemplo.com')).toEqual({ email: true });
  });

  it('celular argentino de 10 dígitos, con o sin +54 9', () => {
    expect(check(whatsappValidator, '11 5555-0142')).toBeNull();
    expect(check(whatsappValidator, '+54 9 11 5555-0142')).toBeNull();
    expect(check(whatsappValidator, '(0351) 555-0142')).toBeNull();
    expect(check(whatsappValidator, '5555-0142')).toEqual({ whatsapp: true });
    expect(check(whatsappValidator, '11 5555 abc')).toEqual({ whatsapp: true });
  });
});

describe('OffersApi', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }));

  it('lee las ofertas del mock una sola vez y las mapea', async () => {
    const api = TestBed.inject(OffersApi);
    const http = TestBed.inject(HttpTestingController);
    const first = firstValueFrom(api.list());
    http.expectOne(OFFERS_URL).flush(MOCK);
    const offers = await first;
    expect(offers.map((o) => o.title)).toEqual(MOCK.ofertas.map((o) => o.titulo));
    await firstValueFrom(api.list());
    http.expectNone(OFFERS_URL);
    http.verify();
  });

  it('si la carga falla, el próximo pedido reintenta', async () => {
    const api = TestBed.inject(OffersApi);
    const http = TestBed.inject(HttpTestingController);
    const failed = firstValueFrom(api.list());
    http.expectOne(OFFERS_URL).flush('error', { status: 500, statusText: 'Error' });
    await expect(failed).rejects.toBeTruthy();
    const retry = firstValueFrom(api.list());
    http.expectOne(OFFERS_URL).flush(MOCK);
    await expect(retry).resolves.toHaveLength(MOCK.ofertas.length);
  });

  it('con el backend pide GET /job-offers y usa los items tal como vienen', async () => {
    TestBed.overrideProvider(API_BASE_URL, { useValue: 'http://api' });
    TestBed.overrideProvider(OffersApi, { useFactory: () => new HttpOffersApi() });
    const api = TestBed.inject(OffersApi);
    const http = TestBed.inject(HttpTestingController);
    const posting = toJobPosting(MOCK.ofertas[0]);
    const result = firstValueFrom(api.list());
    const req = http.expectOne((r) => r.url === 'http://api/job-offers');
    expect(req.request.params.get('limit')).toBe('100');
    req.flush({ items: [posting], total: 1, page: 1, limit: 100, query: '', matched: true });
    expect(await result).toEqual([posting]);
  });
});

describe('HttpCandidacyApi', () => {
  const contact: CandidateContact = {
    fullName: 'Martina Rodríguez',
    email: 'martina@ejemplo.com',
    dni: '38.412.907',
    whatsapp: '11 5555-0142',
    zone: 'monte grande ',
    position: 'Operario/a Pan 29',
  };
  let api: CandidacyApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://api' },
        { provide: CandidacyApi, useClass: HttpCandidacyApi },
      ],
    });
    api = TestBed.inject(CandidacyApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sube el CV como archivo y devuelve su id con los datos leídos', async () => {
    const file = new File(['cv'], 'cv.pdf', { type: 'application/pdf' });
    const result = firstValueFrom(api.readCv(file));
    const req = http.expectOne('http://api/cv');
    expect(req.request.method).toBe('POST');
    expect((req.request.body as FormData).get('file')).toBeInstanceOf(File);
    req.flush({ cvId: 'cv-1', fileName: 'cv.pdf', prefill: { fullName: 'Martina Rodríguez', zone: 'Monte Grande', zoneId: 'z1' } });
    expect(await result).toEqual({ cvId: 'cv-1', prefill: { fullName: 'Martina Rodríguez', zone: 'Monte Grande' } });
  });

  it('envía la postulación con zona, oferta y CV, y devuelve el código de seguimiento', async () => {
    const result = firstValueFrom(api.apply(contact, { offerRef: 'CSYP1233113446', cvId: 'cv-1' }));
    http.expectOne('http://api/zones').flush([{ id: 'z1', name: 'Monte Grande' }]);
    const req = http.expectOne('http://api/applications');
    expect(req.request.body).toEqual({
      fullName: 'Martina Rodríguez',
      email: 'martina@ejemplo.com',
      dni: '38.412.907',
      whatsapp: '11 5555-0142',
      position: 'Operario/a Pan 29',
      channel: 'new_web',
      zoneId: 'z1',
      offerCode: 'CSYP1233113446',
      cvId: 'cv-1',
    });
    req.flush({ trackingCode: 'GG-ABC123', status: 'received', stage: 0, position: 'Operario/a Pan 29', offer: null });
    expect(await result).toEqual({ trackingCode: 'GG-ABC123', position: 'Operario/a Pan 29' });
  });

  it('sin zona conocida ni oferta, se postula igual sin esos campos', async () => {
    const result = firstValueFrom(api.apply({ ...contact, zone: 'Atlántida' }, {}));
    http.expectOne('http://api/zones').flush('error', { status: 500, statusText: 'Error' });
    const req = http.expectOne('http://api/applications');
    expect(Object.keys(req.request.body)).toEqual(['fullName', 'email', 'dni', 'whatsapp', 'position', 'channel']);
    req.flush({ trackingCode: 'GG-XYZ789', position: contact.position });
    await result;
  });

  it('compara zonas sin tildes ni mayúsculas', () => {
    expect(zoneKey('  San  Martín ')).toBe(zoneKey('san martin'));
  });
});
