import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobSource } from '../../../../core/models';

/**
 * Displays the job source (Indeed / France Travail) as a styled pill.
 *
 * @param source - Source identifier from the Offer model
 */
@Component({
  selector: 'app-source-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './source-badge.component.html',
  styleUrl: './source-badge.component.scss',
})
export class SourceBadgeComponent {
  readonly source = input.required<JobSource>();

  /**
   * Human-readable label for the source.
   *
   * @returns Formatted source name
   */
  label(): string {
    return this.source() === 'france-travail' ? 'France Travail' : 'Indeed';
  }
}
