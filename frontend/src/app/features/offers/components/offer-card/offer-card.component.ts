import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Offer } from '../../../../core/models';
import { ScoreBadgeComponent } from '../score-badge/score-badge.component';
import { SourceBadgeComponent } from '../source-badge/source-badge.component';

/**
 * Card summarizing a single job offer.
 * Clicking the title navigates to the offer detail page.
 *
 * @param offer - The offer to display
 */
@Component({
  selector: 'app-offer-card',
  standalone: true,
  imports: [DatePipe, RouterLink, ScoreBadgeComponent, SourceBadgeComponent],
  templateUrl: './offer-card.component.html',
  styleUrl: './offer-card.component.scss',
})
export class OfferCardComponent {
  readonly offer = input.required<Offer>();
}
