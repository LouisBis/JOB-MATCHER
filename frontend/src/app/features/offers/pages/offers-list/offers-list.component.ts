import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { OffersService } from '../../../../core/services';
import { Offer } from '../../../../core/models';
import { OfferCardComponent } from '../../components/offer-card/offer-card.component';
import { LABELS } from '../../../../core/i18n/fr';
import { environment } from '../../../../../environments/environment';

/**
 * Dashboard page listing all scored job offers.
 * Fetches from n8n webhook (dev) or mock JSON (GitHub Pages).
 * Polls GET /status every 2 s while the pipeline is running.
 */
@Component({
    selector: 'app-offers-list',
    imports: [OfferCardComponent],
    templateUrl: './offers-list.component.html',
    styleUrl: './offers-list.component.scss'
})
export class OffersListComponent implements OnInit, OnDestroy {
  readonly #offersService = inject(OffersService);

  readonly labels = LABELS.offers;
  readonly isMock = environment.useMock;

  // Mirror of config.js PIPELINE_STEPS — used for the mock simulation only
  readonly #mockSteps = [
    'Récupération des offres',
    'Déduplication',
    'Filtrage',
    'Scoring Ollama',
    'Sauvegarde',
  ];

  // Simulated delay per step (ms) — longer on step 4 to mimic LLM latency
  readonly #mockDelays = [700, 400, 300, 1800, 500];
  readonly offers = signal<Offer[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly running = signal(false);
  readonly runMsg = signal<string | null>(null);
  readonly pipelineStep = signal(0);
  readonly pipelineSteps = signal<string[]>([]);

  readonly progressPct = computed(() => {
    const total = this.pipelineSteps().length;
    return total > 0 ? Math.round((this.pipelineStep() / total) * 100) : 0;
  });

  readonly stepProgressText = computed(() => {
    const steps = this.pipelineSteps();
    const step = this.pipelineStep();
    const label = steps[step - 1] ?? '';
    const fraction = `${step}/${steps.length}`;
    return label ? `Étape ${fraction} — ${label}` : `Étape ${fraction}`;
  });

  #pollSub: Subscription | null = null;

  ngOnInit(): void {
    this.#loadOffers();
  }

  ngOnDestroy(): void {
    this.#stopPolling();
  }

  /**
   * Triggers the scoring pipeline, then starts polling GET /status every 2 s.
   * Stops polling and reloads offers when running becomes false.
   */
  run(): void {
    if (this.running()) return;
    this.running.set(true);
    this.runMsg.set(null);

    if (this.isMock) {
      this.#simulatePipeline();
      return;
    }

    this.#offersService.runPipeline().subscribe({
      next: () => this.#startPolling(),
      error: (err) => {
        this.runMsg.set(this.labels.runError);
        this.running.set(false);
        console.error('[OffersListComponent] run', err);
      },
    });
  }

  /**
   * Fake pipeline progression for the GitHub Pages demo.
   * Advances one step at a time using the delays defined in #mockDelays,
   * then marks the run as complete without touching real data.
   */
  #simulatePipeline(): void {
    this.pipelineSteps.set(this.#mockSteps);
    this.pipelineStep.set(0);

    const advance = (step: number): void => {
      this.pipelineStep.set(step);
      if (step < this.#mockSteps.length) {
        setTimeout(() => advance(step + 1), this.#mockDelays[step] ?? 500);
      } else {
        setTimeout(() => {
          this.running.set(false);
          this.runMsg.set(this.labels.runSuccess);
        }, 400);
      }
    };

    setTimeout(() => advance(1), 300);
  }

  #loadOffers(): void {
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

  #startPolling(): void {
    this.#pollSub = interval(2000).pipe(
      switchMap(() => this.#offersService.getStatus())
    ).subscribe({
      next: (status) => {
        this.pipelineStep.set(status.step);
        this.pipelineSteps.set(status.steps);

        if (!status.running) {
          this.#stopPolling();
          this.running.set(false);
          this.runMsg.set(this.labels.runSuccess);
          this.loading.set(true);
          this.#loadOffers();
        }
      },
      error: () => {
        // Polling failed (network glitch) — stop silently, let user retry
        this.#stopPolling();
        this.running.set(false);
        this.runMsg.set(this.labels.runError);
      },
    });
  }

  #stopPolling(): void {
    this.#pollSub?.unsubscribe();
    this.#pollSub = null;
  }
}
