import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FormControl } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { firstValueFrom } from 'rxjs';
import { dniValidator, formatDni, fullNameValidator, whatsappValidator } from './candidate-validators';
import { JobOffersResponse, JobPosting, formatDayMonth, toJobPosting } from './job-offer';
import { searchJobs } from './job-search';
import { OFFERS_URL, OffersApi } from './offers.api';

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
});
