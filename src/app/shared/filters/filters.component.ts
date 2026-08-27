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
  /** Number of filters currently applied — drives the badge on the button. */
  activeCount = input(0);
  /** Button label (defaults to "Filters"). */
  label = input('Filters');

  /** Emitted when the user clicks "Clear" — parent should reset all fields + applied state. */
  clear = output<void>();
  /** Emitted when the user clicks "Search" (or presses Enter) — parent applies. */
  search = output<void>();

  @ViewChild(MatMenuTrigger) private trigger?: MatMenuTrigger;

  /**
   * Handle Clear click. Menu stays open so the user can immediately
   * re-type + Search. stopPropagation prevents mat-menu from closing
   * as a bubble side effect.
   */
  onClear(evt: Event): void {
    evt.stopPropagation();
    this.clear.emit();
    // menu stays open so user can immediately re-search or continue editing
  }

  /**
   * Handle Search click. Emit + close the menu so results appear
   * unobstructed. `trigger?.closeMenu()` because Material's @ViewChild
   * is optional pre-init.
   */
  onSearch(evt: Event): void {
    evt.stopPropagation();
    this.search.emit();
    this.trigger?.closeMenu();
  }

  /** Prevents propagated clicks/keydowns inside the panel from closing
   *  the menu (Material's default is close-on-outside; the panel content
   *  isn't 'outside' visually but the event bubbles). */
  stopPropagation(evt: Event): void {
    evt.stopPropagation();
  }

  /**
   * Enter-on-any-field behaves like clicking Search — natural for
   * keyboard users typing in an input inside the menu.
   */
  onEnter(evt: Event): void {
    evt.stopPropagation();
    // hitting Enter in any field inside the menu should behave like clicking Search
    this.search.emit();
    this.trigger?.closeMenu();
  }
}
