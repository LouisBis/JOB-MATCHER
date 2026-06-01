import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OffersService } from './offers.service';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

const MOCK_OFFER = {
  id: 'abc123',
  title: 'Développeur Frontend Angular',
  company: 'Acme Corp',
  location: 'Paris',
  score: 85,
  source: 'indeed',
  url: 'https://example.com/job/1',
  description: 'Description du poste',
  contractType: 'CDI',
  matchReasons: ['Angular expertise'],
  concerns: [],
  summary: 'Bon match.',
  publishedAt: '2026-01-01',
  fetchedAt: '2026-01-15T10:00:00Z',
};

describe('OffersService', () => {
  let service: OffersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OffersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getOffers', () => {
    it('makes GET request to /jobs', () => {
      service.getOffers().subscribe();
      const req = httpMock.expectOne(`${API}/jobs`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('returns the offers array', () => {
      let result: unknown;
      service.getOffers().subscribe((r) => (result = r));
      httpMock.expectOne(`${API}/jobs`).flush([MOCK_OFFER]);
      expect(result).toEqual([MOCK_OFFER]);
    });
  });

  describe('getOfferById', () => {
    it('makes GET request to /jobs/:id', () => {
      service.getOfferById('abc123').subscribe();
      const req = httpMock.expectOne(`${API}/jobs/abc123`);
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_OFFER);
    });

    it('returns the matching offer', () => {
      let result: unknown;
      service.getOfferById('abc123').subscribe((r) => (result = r));
      httpMock.expectOne(`${API}/jobs/abc123`).flush(MOCK_OFFER);
      expect(result).toEqual(MOCK_OFFER);
    });
  });

  describe('getStatus', () => {
    it('makes GET request to /status', () => {
      service.getStatus().subscribe();
      const req = httpMock.expectOne(`${API}/status`);
      expect(req.request.method).toBe('GET');
      req.flush({ running: false, step: 0, steps: [] });
    });

    it('returns the full pipeline status', () => {
      const status = { running: true, step: 2, steps: ['Fetch', 'Deduplicate', 'Score'] };
      let result: unknown;
      service.getStatus().subscribe((r) => (result = r));
      httpMock.expectOne(`${API}/status`).flush(status);
      expect(result).toEqual(status);
    });
  });

  describe('runPipeline', () => {
    it('makes POST request to /run', () => {
      service.runPipeline().subscribe();
      const req = httpMock.expectOne(`${API}/run`);
      expect(req.request.method).toBe('POST');
      req.flush(null);
    });
  });
});
