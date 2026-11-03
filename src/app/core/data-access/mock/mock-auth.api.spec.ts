import { firstValueFrom } from 'rxjs';
import { MockAuthApi } from './mock-auth.api';

describe('MockAuthApi', () => {
  it('genera un código de 6 dígitos y lo verifica', async () => {
    const api = new MockAuthApi();
    const { devCode } = await firstValueFrom(api.requestCode('camila@ejemplo.com'));
    expect(devCode).toMatch(/^\d{6}$/);
    expect(await firstValueFrom(api.verifyCode('camila@ejemplo.com', devCode!))).toBe(true);
  });

  it('rechaza códigos equivocados o de otro correo', async () => {
    const api = new MockAuthApi();
    const { devCode } = await firstValueFrom(api.requestCode('camila@ejemplo.com'));
    expect(await firstValueFrom(api.verifyCode('camila@ejemplo.com', '000000'))).toBe(devCode === '000000');
    expect(await firstValueFrom(api.verifyCode('otra@ejemplo.com', devCode!))).toBe(false);
  });
});
