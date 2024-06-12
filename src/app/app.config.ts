import { ApplicationConfig } from '@angular/core';
import { Routes, provideRouter } from '@angular/router';
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
    provideRouter(APP_ROUTES),
  ],
};
