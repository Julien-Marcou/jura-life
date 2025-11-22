import { bootstrapApplication } from '@angular/platform-browser';

import 'scrollable-component';
import { AppComponent } from './app/app.component';
import { APP_CONFIG } from './app/app.config';

bootstrapApplication(AppComponent, APP_CONFIG).catch((error: unknown) => {
  console.error(error);
});
