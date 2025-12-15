import type { ApplicationConfig } from '@angular/core';
import type { Routes } from '@angular/router';

import { provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { GoogleMapsComponent } from './components/google-maps/google-maps.component';

const APP_ROUTES: Routes = [
  {
    path: '',
    component: GoogleMapsComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];

export const APP_CONFIG: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(APP_ROUTES),
  ],
};
