import { Component, inject, OnInit, signal } from '@angular/core';
import { OffersService } from '../../../../core/services';
import { Offer } from '../../../../core/models';
import { OfferCardComponent } from '../../components/offer-card/offer-card.component';
import { LABELS } from '../../../../core/i18n/fr';

/**
 * Dashboard page listing all scored job offers.
 * Fetches from n8n webhook (dev) or mock JSON (GitHub Pages).
 */
@Component({
    selector: 'app-offers-list',
    imports: [OfferCardComponent],
    templateUrl: './offers-list.component.html',
    styleUrl: './offers-list.component.scss'
})
export class OffersListComponent implements OnInit {
  readonly #offersService = inject(OffersService);

  readonly labels = LABELS.offers;
  readonly offers = signal<Offer[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.#offersService.getOffers().subscribe({
      next: (data) => {
        this.offers.set(data.sort((a, b) => b.score - a.score));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.labels.loadError);
        this.loading.set(false);
        console.error('[OffersListComponent]', err);
      },
    });
  }
}
