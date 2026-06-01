import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { delay, Observable, of, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CvMeta } from '../models';

type UploadResult = { success: boolean; filename: string; uploadedAt: string };

@Injectable({ providedIn: 'root' })
export class CvService {
  readonly #http = inject(HttpClient);

  /**
   * Returns current CV metadata and text preview.
   *
   * @returns Observable of CvMeta
   */
  getCv(): Observable<CvMeta> {
    if (environment.useMock) {
      return this.#http.get<CvMeta>('assets/mock/cv.json');
    }
    return this.#http.get<CvMeta>(`${environment.apiUrl}/cv`);
  }

  /**
   * Reads the file as UTF-8 text and POSTs it as JSON to the backend.
   * Avoids multipart/form-data binary handling issues in n8n Code nodes.
   *
   * @param file - A .txt file selected or dropped by the user
   * @returns Observable of upload result
   */
  uploadCv(file: File): Observable<UploadResult> {
    if (environment.useMock) {
      return of({ success: true, filename: file.name, uploadedAt: new Date().toISOString() }).pipe(
        delay(1400)
      );
    }

    return new Observable<UploadResult>(observer => {
      const reader = new FileReader();
      reader.onload = () => {
        this.#http
          .post<UploadResult>(`${environment.apiUrl}/cv`, {
            text: reader.result as string,
            filename: file.name,
          })
          .pipe(timeout(30_000))
          .subscribe(observer);
      };
      reader.onerror = () => observer.error(reader.error);
      reader.readAsText(file, 'utf-8');
    });
  }
}
