import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from './core/services/auth.service';
import { StorageService } from './core/services/storage.service';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App implements OnInit {
  private auth = inject(AuthService);
  private storage = inject(StorageService);

  ngOnInit(): void {
    if (this.storage.getAccessToken()) {
      this.auth.loadMe().subscribe();
    }
  }
}
