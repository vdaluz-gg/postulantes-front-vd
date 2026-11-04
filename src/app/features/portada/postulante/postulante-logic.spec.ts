import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FormControl } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { firstValueFrom } from 'rxjs';
import { dniValidator, formatDni, fullNameValidator, whatsappValidator } from './candidate-validators';
import { JobOffersResponse, JobPosting, formatSalary, toJobPosting } from './job-offer';
import { searchJobs } from './job-search';
import { OFFERS_URL, OffersApi } from './offers.api';

/** El mismo archivo que sirve la app en /mock/ofertas.json. */
const MOCK: JobOffersResponse = JSON.parse(readFileSync(join(process.cwd(), 'public/mock/ofertas.json'), 'utf8'));
const offer = (over: Partial<JobPosting> = {}): JobPosting => ({ ...toJobPosting(MOCK.ofertas[0]), ...over });

describe('mapeo de ofertas (mock JSON)', () => {
  it('toma solo los datos que puede ver el postulante', () => {
    const job = toJobPosting(MOCK.ofertas[0]);
    expect(job).toEqual(
      expect.objectContaining({
        ref: 'CSYP1233113446',
        title: 'Operario/a Pan 29',
        vacancies: 1,
        salary: 912359,
        address: '9 de Julio 1450, El Talar Argentina',
        radiusKm: 20,
        area: 'Industrial / Tecnica / Produccion',
        hiring: 'Temporarios',
        experienceRequired: false,
      }),
    );
    const values = JSON.stringify(job);
    expect(values).not.toContain('BANK SA');
    expect(values).not.toContain('@');
    expect(values).not.toContain('ALTA');
  });

  it('formatea el salario en pesos', () => {
    expect(formatSalary(912359)).toBe('$ 912.359');
  });
});

describe('searchJobs', () => {
  const offers = [
    offer({ ref: 'A', title: 'Operario/a de depósito', description: 'Carga y descarga' }),
    offer({ ref: 'B', title: 'Chofer de reparto', description: 'Reparto en Moreno', area: 'Logística', address: 'Moreno' }),
    offer({ ref: 'C', title: 'Analista administrativo', description: 'Trabajo de oficina', area: 'Administración', address: 'CABA' }),
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
    expect(offers.map((o) => o.title)).toEqual(['Operario/a Pan 29']);
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
    await expect(retry).resolves.toHaveLength(1);
  });
});
