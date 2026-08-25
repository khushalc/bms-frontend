import { CommonModule } from '@angular/common';
import { Component, input, output, ViewChild } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';

/**
 * Shared "Filters" hamburger button + menu with an explicit Search action.
 * Fields are projected via ng-content — each page owns its FormControls.
 * Filters are NOT applied live; the parent applies them when this component
 * fires the (search) event. `activeCount` reflects the number of filters
 * currently applied (parent-tracked, not derived from FormControl values).
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
  search = output<void>();

  @ViewChild(MatMenuTrigger) private trigger?: MatMenuTrigger;

  onClear(evt: Event): void {
    evt.stopPropagation();
    this.clear.emit();
    // menu stays open so user can immediately re-search or continue editing
  }

  onSearch(evt: Event): void {
    evt.stopPropagation();
    this.search.emit();
    this.trigger?.closeMenu();
  }

  stopPropagation(evt: Event): void {
    evt.stopPropagation();
  }

  onEnter(evt: Event): void {
    evt.stopPropagation();
    // hitting Enter in any field inside the menu should behave like clicking Search
    this.search.emit();
    this.trigger?.closeMenu();
  }
}
