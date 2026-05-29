import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Offer, PipelineStatus } from '../models';

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
  /**
   * Triggers the scoring pipeline via the n8n POST /run webhook.
   * Returns immediately — the pipeline runs asynchronously in the background.
   *
   * @returns Observable that completes when the trigger is acknowledged
   */
  runPipeline(): Observable<void> {
    return this.#http.post<void>(`${environment.apiUrl}/run`, null);
  }

  /**
   * Returns the current pipeline status (step index, step labels, running flag).
   * Intended for polling — call every 2 s while the pipeline is running.
   *
   * @returns Observable of PipelineStatus
   */
  getStatus(): Observable<PipelineStatus> {
    if (environment.useMock) {
      return of({ running: false, step: 0, steps: [] });
    }
    return this.#http.get<PipelineStatus>(`${environment.apiUrl}/status`);
  }

  getOfferById(id: string): Observable<Offer | undefined> {
    if (environment.useMock) {
      return this.getOffers().pipe(
        map((offers) => offers.find((o) => o.id === id))
      );
    }

    return this.#http.get<Offer>(`${environment.apiUrl}/jobs/${id}`);
  }
}
