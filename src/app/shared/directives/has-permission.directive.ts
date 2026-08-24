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
    effect(() => {
      // touch signals so we re-run on auth changes
      this.auth.permissions();
      this.sync();
    });
  }

  @Input()
  set hasPermission(value: string | string[]) {
    this.required = Array.isArray(value) ? value : [value];
    this.sync();
  }

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
