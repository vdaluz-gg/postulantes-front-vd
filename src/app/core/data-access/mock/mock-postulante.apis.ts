import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  Application,
  CandidateDocument,
  CandidateProfile,
  InboxMessage,
  Interview,
  JobOpening,
} from '../../models';
import {
  ApplicationsApi,
  DocumentsApi,
  InterviewsApi,
  JobsApi,
  MessagesApi,
  ProfileApi,
} from '../postulante.apis';
import { MockSeed, createSeed } from './mock-seed';

/** Base de datos en memoria compartida por los mocks, para que los cambios sean coherentes entre APIs. */
@Injectable({ providedIn: 'root' })
export class MockDatabase {
  seed: MockSeed = createSeed();

  reset(now?: Date): void {
    this.seed = createSeed(now);
  }
}

@Injectable()
export class MockProfileApi extends ProfileApi {
  private readonly db = inject(MockDatabase);
  get(): Observable<CandidateProfile> {
    return of(this.db.seed.profile);
  }
}

@Injectable()
export class MockApplicationsApi extends ApplicationsApi {
  private readonly db = inject(MockDatabase);
  list(): Observable<Application[]> {
    return of([...this.db.seed.applications]);
  }
}

@Injectable()
export class MockInterviewsApi extends InterviewsApi {
  private readonly db = inject(MockDatabase);
  list(): Observable<Interview[]> {
    return of([...this.db.seed.interviews]);
  }
  confirm(id: string): Observable<void> {
    this.db.seed.interviews = this.db.seed.interviews.map((i) => (i.id === id ? { ...i, status: 'confirmed' } : i));
    return of(undefined);
  }
  requestReschedule(id: string, slot: Date): Observable<void> {
    this.db.seed.interviews = this.db.seed.interviews.map((i) =>
      i.id === id ? { ...i, status: 'reschedule-requested', rescheduleRequestedFor: slot } : i,
    );
    return of(undefined);
  }
}

@Injectable()
export class MockDocumentsApi extends DocumentsApi {
  private readonly db = inject(MockDatabase);
  list(): Observable<CandidateDocument[]> {
    return of([...this.db.seed.documents]);
  }
}

@Injectable()
export class MockMessagesApi extends MessagesApi {
  private readonly db = inject(MockDatabase);
  list(): Observable<InboxMessage[]> {
    return of([...this.db.seed.messages]);
  }
}

@Injectable()
export class MockJobsApi extends JobsApi {
  private readonly db = inject(MockDatabase);
  catalog(): Observable<JobOpening[]> {
    return of([...this.db.seed.jobs]);
  }
}
