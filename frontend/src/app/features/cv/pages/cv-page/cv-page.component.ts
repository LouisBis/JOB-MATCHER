import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { CvService } from '../../../../core/services';
import { CvMeta } from '../../../../core/models';
import { LABELS } from '../../../../core/i18n/fr';
import { environment } from '../../../../../environments/environment';

const ACCEPTED_TYPES = ['text/plain'];
const MAX_SIZE_MB = 5;

/**
 * Dedicated page for CV management.
 * Drop/select → file preview + confirm button → upload.
 * In mock mode, simulates the upload without touching the backend.
 */
@Component({
  selector: 'app-cv-page',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './cv-page.component.html',
  styleUrl: './cv-page.component.scss',
})
export class CvPageComponent implements OnInit {
  readonly #cvService = inject(CvService);

  readonly labels = LABELS.cv;
  readonly isMock = environment.useMock;
  readonly cvMeta = signal<CvMeta | null>(null);
  readonly loading = signal(true);
  readonly pendingFile = signal<File | null>(null);
  readonly uploading = signal(false);
  readonly isDragging = signal(false);
  readonly uploadMsg = signal<{ text: string; error: boolean } | null>(null);

  ngOnInit(): void {
    this.#cvService.getCv().subscribe({
      next: (meta) => {
        this.cvMeta.set(meta);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.#selectFile(file);
  }

  onFileSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.#selectFile(file);
    (event.target as HTMLInputElement).value = '';
  }

  cancelPending(): void {
    this.pendingFile.set(null);
    this.uploadMsg.set(null);
  }

  confirmUpload(): void {
    const file = this.pendingFile();
    if (!file) return;
    this.uploading.set(true);
    this.uploadMsg.set(null);

    this.#cvService.uploadCv(file).subscribe({
      next: (res) => {
        if (!res?.success) {
          this.uploading.set(false);
          this.uploadMsg.set({ text: this.labels.uploadError, error: true });
          return;
        }
        this.cvMeta.set({
          filename: res.filename,
          uploadedAt: res.uploadedAt,
          preview: this.cvMeta()?.preview ?? null,
          exists: true,
        });
        this.uploading.set(false);
        this.pendingFile.set(null);
        this.uploadMsg.set({ text: this.labels.uploadSuccess, error: false });
      },
      error: () => {
        this.uploading.set(false);
        this.uploadMsg.set({ text: this.labels.uploadError, error: true });
      },
    });
  }

  #selectFile(file: File): void {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      this.uploadMsg.set({ text: this.labels.errorFormat, error: true });
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      this.uploadMsg.set({ text: this.labels.errorSize, error: true });
      return;
    }
    this.uploadMsg.set(null);
    this.pendingFile.set(file);
  }
}
