import { TestBed } from '@angular/core/testing';
import { SessionService } from './session.service';
import { STORAGE_KEYS } from './storage.service';

describe('SessionService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('inicia y cierra sesión guardando el correo', () => {
    const session = TestBed.inject(SessionService);
    expect(session.authenticated()).toBe(false);
    session.start('camila@ejemplo.com');
    expect(session.authenticated()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.session)).toBe('camila@ejemplo.com');
    session.end();
    expect(session.authenticated()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.session)).toBeNull();
  });

  it('recupera una sesión previa', () => {
    localStorage.setItem(STORAGE_KEYS.session, 'previa@ejemplo.com');
    const session = TestBed.inject(SessionService);
    expect(session.authenticated()).toBe(true);
    expect(session.email()).toBe('previa@ejemplo.com');
  });
});
