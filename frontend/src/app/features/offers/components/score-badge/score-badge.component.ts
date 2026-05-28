import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Displays a numeric score (1–10) as a colored pill.
 * Green 8–10 / Orange 5–7 / Red 1–4.
 *
 * @param score - Integer score produced by the LLM
 */
@Component({
  selector: 'app-score-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './score-badge.component.html',
  styleUrl: './score-badge.component.scss',
})
export class ScoreBadgeComponent {
  readonly score = input.required<number>();

  readonly colorClass = computed(() => {
    const s = this.score();
    if (s >= 8) return 'badge--success';
    if (s >= 5) return 'badge--warning';
    return 'badge--error';
  });
}
