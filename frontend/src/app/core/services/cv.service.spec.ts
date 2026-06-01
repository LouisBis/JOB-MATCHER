import { TestBed, waitForAsync } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CvService } from './cv.service';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

const MOCK_META = {
  filename: 'louis-cv.txt',
  uploadedAt: '2026-01-15T10:30:00Z',
  preview: 'Louis Bis — Frontend Developer',
  exists: true,
};

describe('CvService', () => {
  let service: CvService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CvService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getCv', () => {
    it('makes GET request to /cv', () => {
      service.getCv().subscribe();
      const req = httpMock.expectOne(`${API}/cv`);
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_META);
    });

    it('returns the CvMeta from the response', () => {
      let result: unknown;
      service.getCv().subscribe((r) => (result = r));
      httpMock.expectOne(`${API}/cv`).flush(MOCK_META);
      expect(result).toEqual(MOCK_META);
    });
  });

  describe('uploadCv', () => {
    it('reads file as UTF-8 text and POSTs {text, filename} to /cv', (done) => {
      const file = new File(['hello CV content'], 'cv.txt', { type: 'text/plain' });

      service.uploadCv(file).subscribe((result) => {
        expect(result.success).toBeTrue();
        done();
      });

      // FileReader is async — give it a tick before intercepting the HTTP request
      setTimeout(() => {
        const req = httpMock.expectOne(`${API}/cv`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ text: 'hello CV content', filename: 'cv.txt' });
        req.flush({ success: true, filename: 'cv.txt', uploadedAt: '2026-01-15T10:30:00Z' });
      }, 50);
    });

    it('forwards HTTP errors to the subscriber', (done) => {
      const file = new File(['content'], 'cv.txt', { type: 'text/plain' });

      service.uploadCv(file).subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
          done();
        },
      });

      setTimeout(() => {
        httpMock.expectOne(`${API}/cv`).error(new ProgressEvent('error'));
      }, 50);
    });
  });
});
