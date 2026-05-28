import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { OffersService } from '../../../../core/services';
import { Offer } from '../../../../core/models';
import { ScoreBadgeComponent } from '../../components/score-badge/score-badge.component';
import { SourceBadgeComponent } from '../../components/source-badge/source-badge.component';
import { LABELS } from '../../../../core/i18n/fr';

/**
 * Full detail view for a single job offer.
 * The offer id is read from the route param `:id`.
 */
@Component({
    selector: 'app-offer-detail',
    imports: [RouterLink, DatePipe, ScoreBadgeComponent, SourceBadgeComponent],
    templateUrl: './offer-detail.component.html',
    styleUrl: './offer-detail.component.scss'
})
export class OfferDetailComponent implements OnInit {
  readonly #route = inject(ActivatedRoute);
  readonly #offersService = inject(OffersService);

  readonly labels = LABELS.offers;
  readonly offer = signal<Offer | undefined>(undefined);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.#route.snapshot.paramMap.get('id') ?? '';

    this.#offersService.getOfferById(id).subscribe({
      next: (data) => {
        if (!data) {
          this.error.set(this.labels.notFound);
        } else {
          this.offer.set(data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.labels.loadError);
        this.loading.set(false);
        console.error('[OfferDetailComponent]', err);
      },
    });
  }
}
