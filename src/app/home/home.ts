import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../supabase.service';
import { Observable } from 'rxjs';
import { User } from '@supabase/supabase-js';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="menu-container">
      <h2>🎮 Menú Principal ⚔️</h2>
      
      <nav class="nav-menu">
        <a 
          routerLink="/juego" 
          class="menu-item main-action"
          [class.disabled]="!(currentUser$ | async)"
          [title]="(currentUser$ | async) ? '' : 'Debes iniciar sesión para jugar'"
        >
          Batalla Pokémon (Juego)
        </a>
        <a routerLink="/saludo" class="menu-item">Práctica Saludo</a>
        <a routerLink="/segundo" class="menu-item">Práctica Segundo</a>
      </nav>
      
      <div class="separator"></div>
      
      <div class="auth-card">
        <div *ngIf="(currentUser$ | async) as user; else notLoggedIn">
          <p class="welcome-text">Bienvenido, <span class="user-email">{{ user.email }}</span></p>
          <button (click)="signOut()" class="btn-logout">Cerrar Sesión</button>
        </div>
        <ng-template #notLoggedIn>
          <p class="info-text">Debes iniciar sesión para jugar.</p>
          <a routerLink="/auth" class="btn-login">Iniciar Sesión / Registrarse</a>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    /* 1. FONDO DE PANTALLA COMPLETO (Pikachu Local) */
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      width: 100%;
      /* Capa oscura al 60% sobre la imagen local de Pikachu */
      background: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), 
                  url('/sounds/pikachu.jpeg'); /* 👈 RUTA LOCAL */
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      background-attachment: fixed;
    }

    /* 2. CONTENEDOR CRISTAL (Igual que antes) */
    .menu-container { 
      max-width: 500px; width: 90%; padding: 40px; text-align: center; 
      background: rgba(30, 30, 30, 0.85); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.7); border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex; flex-direction: column; gap: 25px; 
    }
    h2 { color: #ffcb05; margin: 0 0 10px 0; font-size: 2.2rem; text-transform: uppercase; letter-spacing: 2px; text-shadow: 0 0 15px rgba(255, 203, 5, 0.4); }

    /* 3. BOTONES GRANDES (Igual que antes) */
    .nav-menu { display: flex; flex-direction: column; gap: 15px; width: 100%; }
    .menu-item {
      display: flex; align-items: center; justify-content: center; padding: 18px; 
      background: #2c2c2c; color: #e0e0e0; text-decoration: none; border-radius: 12px;
      font-weight: 600; font-size: 1.1rem; transition: all 0.3s; border: 1px solid #444;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    }
    .menu-item:hover { background: #383838; transform: translateY(-4px); border-color: #ffcb05; color: #fff; box-shadow: 0 10px 20px rgba(0,0,0,0.5); }
    .menu-item.main-action { background: linear-gradient(135deg, #333 0%, #444 100%); font-size: 1.2rem; border: 1px solid #666; }
    .menu-item.disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; background: #1a1a1a; box-shadow: none; }
    .separator { height: 1px; background: linear-gradient(90deg, transparent, #555, transparent); width: 100%; margin: 10px 0; }

    /* SECCIÓN USUARIO */
    .auth-card { background: rgba(0, 0, 0, 0.3); padding: 20px; border-radius: 16px; }
    .welcome-text, .info-text { color: #ccc; margin-bottom: 15px; font-size: 0.95rem; }
    .user-email { color: #ffcb05; font-weight: 700; }
    .btn-login, .btn-logout {
      display: inline-block; padding: 12px 30px; border-radius: 50px; text-decoration: none;
      font-weight: 700; font-size: 1rem; border: none; cursor: pointer; transition: all 0.3s; width: 100%;
    }
    .btn-login { background: #3b4cca; color: white; box-shadow: 0 4px 15px rgba(59, 76, 202, 0.4); }
    .btn-login:hover { background: #4b5cdb; transform: scale(1.03); }
    .btn-logout { background: #cf6679; color: #121212; }
    .btn-logout:hover { background: #ff8a80; transform: scale(1.03); }
  `]
})
export class Home implements OnInit {
  currentUser$: Observable<User | null>;
  constructor(private supabaseService: SupabaseService, private router: Router) {
    this.currentUser$ = this.supabaseService.currentUser$;
  }
  ngOnInit(): void { this.supabaseService.checkSession(); }
  signOut() { this.supabaseService.signOut().subscribe(() => { this.router.navigate(['/auth']); }); }
}