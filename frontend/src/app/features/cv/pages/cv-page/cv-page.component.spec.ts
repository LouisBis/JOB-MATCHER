import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CvPageComponent } from './cv-page.component';
import { CvService } from '../../../../core/services';
import { CvMeta } from '../../../../core/models';

const NO_CV: CvMeta = { filename: null, uploadedAt: null, preview: null, exists: false };
const EXISTING_CV: CvMeta = {
  filename: 'louis-cv.txt',
  uploadedAt: '2026-01-15T10:30:00Z',
  preview: 'Louis Bis — Frontend Developer',
  exists: true,
};

function makeFile(name: string, type: string, sizeBytes: number): File {
  return new File(['x'.repeat(sizeBytes)], name, { type });
}

function selectFile(component: CvPageComponent, file: File): void {
  component.onFileSelect({ target: { files: [file], value: '' } } as unknown as Event);
}

describe('CvPageComponent', () => {
  let fixture: ComponentFixture<CvPageComponent>;
  let component: CvPageComponent;
  let cvServiceSpy: jasmine.SpyObj<CvService>;

  beforeEach(async () => {
    cvServiceSpy = jasmine.createSpyObj('CvService', ['getCv', 'uploadCv']);
    cvServiceSpy.getCv.and.returnValue(of(NO_CV));

    await TestBed.configureTestingModule({
      imports: [CvPageComponent],
      providers: [{ provide: CvService, useValue: cvServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(CvPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('ngOnInit', () => {
    it('sets cvMeta from service on load', () => {
      cvServiceSpy.getCv.and.returnValue(of(EXISTING_CV));
      component.ngOnInit();
      expect(component.cvMeta()).toEqual(EXISTING_CV);
    });

    it('sets loading to false after a successful response', () => {
      expect(component.loading()).toBeFalse();
    });

    it('sets loading to false even when the service errors', () => {
      cvServiceSpy.getCv.and.returnValue(throwError(() => new Error('Network error')));
      component.ngOnInit();
      expect(component.loading()).toBeFalse();
    });
  });

  describe('file selection — validation', () => {
    it('rejects non-.txt files and shows an error message', () => {
      selectFile(component, makeFile('cv.pdf', 'application/pdf', 100));
      expect(component.pendingFile()).toBeNull();
      expect(component.uploadMsg()?.error).toBeTrue();
    });

    it('rejects files larger than 5 MB and shows an error message', () => {
      selectFile(component, makeFile('cv.txt', 'text/plain', 6 * 1024 * 1024));
      expect(component.pendingFile()).toBeNull();
      expect(component.uploadMsg()?.error).toBeTrue();
    });

    it('accepts a valid .txt file and sets pendingFile', () => {
      const file = makeFile('cv.txt', 'text/plain', 1024);
      selectFile(component, file);
      expect(component.pendingFile()).toBe(file);
      expect(component.uploadMsg()).toBeNull();
    });

    it('clears a previous error message when a valid file is selected', () => {
      selectFile(component, makeFile('cv.pdf', 'application/pdf', 100));
      selectFile(component, makeFile('cv.txt', 'text/plain', 1024));
      expect(component.uploadMsg()).toBeNull();
    });
  });

  describe('drag events', () => {
    it('sets isDragging to true on dragover', () => {
      const event = new DragEvent('dragover');
      spyOn(event, 'preventDefault');
      component.onDragOver(event);
      expect(component.isDragging()).toBeTrue();
    });

    it('sets isDragging to false on dragleave', () => {
      component.onDragOver(new DragEvent('dragover'));
      component.onDragLeave();
      expect(component.isDragging()).toBeFalse();
    });
  });

  describe('cancelPending', () => {
    it('clears pendingFile and uploadMsg', () => {
      selectFile(component, makeFile('cv.txt', 'text/plain', 100));
      component.cancelPending();
      expect(component.pendingFile()).toBeNull();
      expect(component.uploadMsg()).toBeNull();
    });
  });

  describe('confirmUpload', () => {
    const VALID_FILE = new File(['content'], 'cv.txt', { type: 'text/plain' });
    const SUCCESS_RESULT = { success: true, filename: 'cv.txt', uploadedAt: '2026-01-15T10:30:00Z' };

    it('does nothing when there is no pending file', () => {
      component.confirmUpload();
      expect(cvServiceSpy.uploadCv).not.toHaveBeenCalled();
    });

    it('updates cvMeta and clears pendingFile on success', fakeAsync(() => {
      cvServiceSpy.uploadCv.and.returnValue(of(SUCCESS_RESULT));
      component.pendingFile.set(VALID_FILE);
      component.confirmUpload();
      tick();
      expect(component.cvMeta()?.filename).toBe('cv.txt');
      expect(component.pendingFile()).toBeNull();
      expect(component.uploading()).toBeFalse();
      expect(component.uploadMsg()?.error).toBeFalse();
    }));

    it('shows error message when the server returns success:false', fakeAsync(() => {
      cvServiceSpy.uploadCv.and.returnValue(of({ ...SUCCESS_RESULT, success: false }));
      component.pendingFile.set(VALID_FILE);
      component.confirmUpload();
      tick();
      expect(component.uploadMsg()?.error).toBeTrue();
      expect(component.uploading()).toBeFalse();
    }));

    it('shows error message on HTTP error', fakeAsync(() => {
      cvServiceSpy.uploadCv.and.returnValue(throwError(() => new Error('timeout')));
      component.pendingFile.set(VALID_FILE);
      component.confirmUpload();
      tick();
      expect(component.uploadMsg()?.error).toBeTrue();
      expect(component.uploading()).toBeFalse();
    }));
  });
});
