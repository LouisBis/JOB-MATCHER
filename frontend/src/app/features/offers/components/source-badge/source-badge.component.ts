import { Component, computed, input } from '@angular/core';
import { JobSource } from '../../../../core/models';
import { LABELS } from '../../../../core/i18n/fr';

/**
 * Displays the job source (Indeed / France Travail) as a styled pill.
 *
 * @param source - Source identifier from the Offer model
 */
@Component({
    selector: 'app-source-badge',
    imports: [],
    templateUrl: './source-badge.component.html',
    styleUrl: './source-badge.component.scss'
})
export class SourceBadgeComponent {
  readonly source = input.required<JobSource>();
  readonly label = computed(() => LABELS.source[this.source()]);
}
