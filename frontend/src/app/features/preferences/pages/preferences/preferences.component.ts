import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PreferencesService } from '../../../../core/services';
import { Preferences } from '../../../../core/models';
import { LABELS } from '../../../../core/i18n/fr';
import { environment } from '../../../../../environments/environment';

/**
 * Preferences form page.
 * Loads current preferences on init and POSTs updates to n8n on save.
 * In mock mode (GitHub Pages), the form is read-only.
 */
@Component({
    selector: 'app-preferences',
    imports: [ReactiveFormsModule],
    templateUrl: './preferences.component.html',
    styleUrl: './preferences.component.scss'
})
export class PreferencesComponent implements OnInit {
  readonly #prefsService = inject(PreferencesService);
  readonly #fb = inject(FormBuilder);

  readonly labels = LABELS.preferences;
  readonly isMock = environment.useMock;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly successMsg = signal<string | null>(null);
  readonly errorMsg = signal<string | null>(null);

  readonly form = this.#fb.group({
    minScore: [6, [Validators.required, Validators.min(1), Validators.max(10)]],
    targetTitles: [''],
    excludedKeywords: [''],
    locations: [''],
    contractTypes: [''],
  });

  ngOnInit(): void {
    this.#prefsService.getPreferences().subscribe({
      next: (prefs) => {
        this.form.patchValue({
          minScore: prefs.minScore,
          targetTitles: prefs.targetTitles.join(', '),
          excludedKeywords: prefs.excludedKeywords.join(', '),
          locations: prefs.locations.join(', '),
          contractTypes: prefs.contractTypes.join(', '),
        });
        if (this.isMock) this.form.disable();
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMsg.set(this.labels.loadError);
        this.loading.set(false);
        console.error('[PreferencesComponent]', err);
      },
    });
  }

  /**
   * Converts form values back to the Preferences model and POSTs to the backend.
   */
  save(): void {
    if (this.form.invalid || this.saving()) return;

    const raw = this.form.getRawValue();
    const prefs: Preferences = {
      minScore: raw.minScore ?? 6,
      targetTitles: this.#toArray(raw.targetTitles),
      excludedKeywords: this.#toArray(raw.excludedKeywords),
      locations: this.#toArray(raw.locations),
      contractTypes: this.#toArray(raw.contractTypes),
    };

    this.saving.set(true);
    this.successMsg.set(null);
    this.errorMsg.set(null);

    this.#prefsService.savePreferences(prefs).subscribe({
      next: () => {
        this.successMsg.set(this.labels.saveSuccess);
        this.saving.set(false);
      },
      error: (err) => {
        this.errorMsg.set(this.labels.saveError);
        this.saving.set(false);
        console.error('[PreferencesComponent]', err);
      },
    });
  }

  /**
   * Splits a comma-separated string into a trimmed, non-empty array.
   *
   * @param value - Raw form string value
   * @returns Array of trimmed strings
   */
  #toArray(value: string | null): string[] {
    if (!value?.trim()) return [];
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }
}
