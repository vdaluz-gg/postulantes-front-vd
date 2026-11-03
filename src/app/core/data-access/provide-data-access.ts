import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { AuthApi } from './auth.api';
import { MockAuthApi } from './mock/mock-auth.api';

/**
 * Punto único donde se elige la implementación de cada API.
 * Para conectar el backend, reemplazar cada clase Mock por su implementación HTTP.
 */
export function provideDataAccess(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: AuthApi, useClass: MockAuthApi }]);
}
