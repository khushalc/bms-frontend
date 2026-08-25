import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

/**
 * Shared "Filters" hamburger button + menu. Content projection lets each
 * list page supply its own fields; this component owns the button, the
 * badge, the panel chrome, and the "Clear all" affordance.
 *
 * Usage:
 *   <bms-filters [activeCount]="activeFilterCount()" (clear)="clearFilters()">
 *     <mat-form-field appearance="outline">
 *       <mat-label>Search name</mat-label>
 *       <input matInput [formControl]="nameFilter" />
 *     </mat-form-field>
 *     ...more per-page fields...
 *   </bms-filters>
 */
@Component({
  selector: 'bms-filters',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatMenuModule, MatIconModule, MatBadgeModule],
  templateUrl: './filters.component.html',
  styleUrl: './filters.component.scss',
})
export class FiltersComponent {
  activeCount = input(0);
  label = input('Filters');
  clear = output<void>();

  onClear(evt: Event): void {
    evt.stopPropagation();
    this.clear.emit();
  }

  stopPropagation(evt: Event): void {
    evt.stopPropagation();
  }
}
