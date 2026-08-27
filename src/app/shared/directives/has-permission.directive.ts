import {
  Directive,
  effect,
  inject,
  Input,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';

import { AuthService } from '../../core/services/auth.service';

/**
 * Structural directive: renders the template only if the current user holds
 * every listed permission. Reacts to auth signal changes.
 *
 *   <button *hasPermission="'user.disable'">Disable</button>
 *   <button *hasPermission="['role.write', 'user.write']">Edit</button>
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private tpl = inject(TemplateRef<unknown>);
  private vcr = inject(ViewContainerRef);
  private auth = inject(AuthService);

  private required: string[] = [];
  private rendered = false;

  constructor() {
    // effect() runs when `auth.permissions` changes so the directive
    // reactively creates/destroys the embedded view when the user signs
    // in, signs out, or gains/loses a role at runtime.
    effect(() => {
      // touch the signal so effect() tracks it as a dependency
      this.auth.permissions();
      this.sync();
    });
  }

  /**
   * The permission key(s) this template requires. Accepts a single string
   * OR an array — array form requires ALL of them (AND semantics), matching
   * the backend's `require_permission` dependency.
   */
  @Input()
  set hasPermission(value: string | string[]) {
    this.required = Array.isArray(value) ? value : [value];
    this.sync();
  }

  /**
   * Create the embedded view when the caller holds every required key,
   * clear it when they don't. Idempotent — checks `rendered` state to
   * avoid creating duplicate views on repeated signal ticks.
   */
  private sync(): void {
    const ok = this.required.every((p) => this.auth.hasPermission(p));
    if (ok && !this.rendered) {
      this.vcr.createEmbeddedView(this.tpl);
      this.rendered = true;
    } else if (!ok && this.rendered) {
      this.vcr.clear();
      this.rendered = false;
    }
  }
}
