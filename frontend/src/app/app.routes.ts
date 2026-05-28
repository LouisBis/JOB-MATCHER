import { Routes } from '@angular/router';

// Each route is code-split into its own chunk — only loaded on navigation.
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'offers',
    pathMatch: 'full',
  },
  {
    path: 'offers',
    loadComponent: () =>
      import('./features/offers/pages/offers-list/offers-list.component').then(
        m => m.OffersListComponent
      ),
  },
  {
    path: 'offers/:id',
    loadComponent: () =>
      import('./features/offers/pages/offer-detail/offer-detail.component').then(
        m => m.OfferDetailComponent
      ),
  },
  {
    path: 'preferences',
    loadComponent: () =>
      import('./features/preferences/pages/preferences/preferences.component').then(
        m => m.PreferencesComponent
      ),
  },
  {
    path: '**',
    redirectTo: 'offers',
  },
];
