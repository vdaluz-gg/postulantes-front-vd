import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { routes } from './app.routes';
import { API_TOKEN, authInterceptor } from './core/api/api';
import { AuthStore } from './features/backoffice/data/auth.store';
import { SoundService } from './core/services/sound.service';
import { ThemeService } from './core/services/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    {
      provide: API_TOKEN,
      useFactory: () => {
        const auth = inject(AuthStore);
        return () => auth.token();
      },
    },
    provideClientHydration(),
    provideAppInitializer(() => {
      inject(ThemeService).init();
      inject(SoundService).init();
    }),
  ],
};
