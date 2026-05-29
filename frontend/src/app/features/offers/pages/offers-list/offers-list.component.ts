import { Component, inject, OnInit, signal } from '@angular/core';
import { OffersService } from '../../../../core/services';
import { Offer } from '../../../../core/models';
import { OfferCardComponent } from '../../components/offer-card/offer-card.component';
import { LABELS } from '../../../../core/i18n/fr';
import { environment } from '../../../../../environments/environment';

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
  readonly isMock = environment.useMock;
  readonly offers = signal<Offer[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly running = signal(false);
  readonly runMsg = signal<string | null>(null);

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

  /**
   * Triggers the scoring pipeline and shows feedback to the user.
   * The pipeline runs asynchronously — offers appear after a few minutes.
   */
  run(): void {
    if (this.running()) return;
    this.running.set(true);
    this.runMsg.set(null);

    this.#offersService.runPipeline().subscribe({
      next: () => {
        this.runMsg.set(this.labels.runSuccess);
        this.running.set(false);
      },
      error: (err) => {
        this.runMsg.set(this.labels.runError);
        this.running.set(false);
        console.error('[OffersListComponent] run', err);
      },
    });
  }
}
