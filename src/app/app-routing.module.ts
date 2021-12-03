import { NgModule } from '@angular/core';
import { Router, RouterModule, Routes } from '@angular/router';

const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {

  constructor(private readonly router: Router) {
    this.router.errorHandler = (): void => {
      this.router.navigate(['']);
    };
  }

}
