import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Preferences } from '../models';

/**
 * Reads and writes user scoring preferences.
 *
 * In dev mode, talks to the n8n webhook at /preferences.
 * In mock mode (GitHub Pages), reads a static JSON file from assets (read-only).
 *
 * @returns Observable of the preferences object
 */
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  readonly #http = inject(HttpClient);

  getPreferences(): Observable<Preferences> {
    const url = environment.useMock
      ? 'assets/mock/preferences.json'
      : `${environment.apiUrl}/preferences`;

    return this.#http.get<Preferences>(url);
  }

  savePreferences(prefs: Preferences): Observable<void> {
    return this.#http.post<void>(`${environment.apiUrl}/preferences`, prefs);
  }
}
