import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Offer } from '../models';

/**
 * Fetches scored job offers.
 *
 * In dev mode, hits n8n webhooks.
 * In mock mode (GitHub Pages), reads static JSON files from assets.
 */
@Injectable({ providedIn: 'root' })
export class OffersService {
  readonly #http = inject(HttpClient);

  /**
   * Returns all scored offers, sorted by the backend.
   *
   * @returns Observable of the offers array
   */
  getOffers(): Observable<Offer[]> {
    const url = environment.useMock
      ? 'assets/mock/offers.json'
      : `${environment.apiUrl}/jobs`;

    return this.#http.get<Offer[]>(url);
  }

  /**
   * Returns a single offer by id.
   * In mock mode, filters the full list client-side.
   * In dev mode, hits GET /jobs/:id.
   *
   * @param id - Offer identifier
   * @returns Observable of the matching offer, or undefined if not found
   */
  getOfferById(id: string): Observable<Offer | undefined> {
    if (environment.useMock) {
      return this.getOffers().pipe(
        map((offers) => offers.find((o) => o.id === id))
      );
    }

    return this.#http.get<Offer>(`${environment.apiUrl}/jobs/${id}`);
  }
}
