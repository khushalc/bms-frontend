import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

export interface ActiveFilterChip {
  /** Internal key used by the parent to identify which filter to remove. */
  key: string;
  /** Human-readable label (e.g. "Building"). */
  label: string;
  /** Human-readable value (e.g. "Rose Garden"). */
  value: string;
}

/**
 * Chip row displayed above a table showing every currently-applied filter as
 * a removable chip. Clicking the × on a chip emits (remove) with the chip
 * key; the parent clears just that one filter and re-searches.
 */
@Component({
  selector: 'bms-active-filters',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatIconModule],
  template: `
    @if (chips().length > 0) {
      <div class="active-filters">
        <mat-chip-set>
          @for (c of chips(); track c.key) {
            <mat-chip (removed)="remove.emit(c.key)">
              <span class="af-label">{{ c.label }}:</span>
              <strong class="af-value">{{ c.value }}</strong>
              <button matChipRemove [attr.aria-label]="'Remove ' + c.label + ' filter'">
                <mat-icon>cancel</mat-icon>
              </button>
            </mat-chip>
          }
        </mat-chip-set>
      </div>
    }
  `,
  styleUrl: './active-filters.component.scss',
})
export class ActiveFiltersComponent {
  chips = input.required<ActiveFilterChip[]>();
  remove = output<string>();
}
