import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { AuthApi } from './auth.api';
import { MockAuthApi } from './mock/mock-auth.api';
import {
  MockApplicationsApi,
  MockDocumentsApi,
  MockInterviewsApi,
  MockJobsApi,
  MockMessagesApi,
  MockProfileApi,
} from './mock/mock-postulante.apis';
import {
  ApplicationsApi,
  DocumentsApi,
  InterviewsApi,
  JobsApi,
  MessagesApi,
  ProfileApi,
} from './postulante.apis';

/**
 * Punto único donde se elige la implementación de cada API.
 * Para conectar el backend, reemplazar cada clase Mock por su implementación HTTP.
 */
export function provideDataAccess(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: AuthApi, useClass: MockAuthApi },
    { provide: ProfileApi, useClass: MockProfileApi },
    { provide: ApplicationsApi, useClass: MockApplicationsApi },
    { provide: InterviewsApi, useClass: MockInterviewsApi },
    { provide: DocumentsApi, useClass: MockDocumentsApi },
    { provide: MessagesApi, useClass: MockMessagesApi },
    { provide: JobsApi, useClass: MockJobsApi },
  ]);
}
