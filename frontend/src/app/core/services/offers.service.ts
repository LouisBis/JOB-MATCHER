import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Offer } from '../models';

/**
 * Fetches scored job offers.
 *
 * In dev mode, hits the n8n webhook at GET /jobs.
 * In mock mode (GitHub Pages), reads a static JSON file from assets.
 *
 * @returns Observable of the offers array
 */
@Injectable({ providedIn: 'root' })
export class OffersService {
  readonly #http = inject(HttpClient);

  getOffers(): Observable<Offer[]> {
    const url = environment.useMock
      ? 'assets/mock/offers.json'
      : `${environment.apiUrl}/jobs`;

    return this.#http.get<Offer[]>(url);
  }
}
