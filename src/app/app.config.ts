import { ApplicationConfig, inject } from "@angular/core";
import { NavigationError, Router, Routes, provideRouter, withNavigationErrorHandler } from "@angular/router";

const APP_ROUTES: Routes = [];

const navigationErrorHandler = (error: NavigationError): void => {
  console.error(error);
  inject(Router).navigate(['']);
};

export const APP_CONFIG: ApplicationConfig = {
  providers: [
    provideRouter(
      APP_ROUTES, withNavigationErrorHandler(navigationErrorHandler),
    )
  ],
};
