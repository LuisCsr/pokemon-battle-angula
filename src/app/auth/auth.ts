import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../supabase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-container">
      <h2>{{ isLogin ? 'Iniciar Sesión' : 'Registrarse' }}</h2>
      
      <form *ngIf="authMode === 'email'" (ngSubmit)="submitForm()">
        <input type="email" placeholder="Email" [(ngModel)]="email" name="email" required class="input-field">
        <input type="password" placeholder="Contraseña" [(ngModel)]="password" name="password" required class="input-field">
        
        <button type="submit" [disabled]="loading" class="btn-primary">
          {{ loading ? 'Cargando...' : (isLogin ? 'Acceder' : 'Crear Cuenta') }}
        </button>
      </form>

      <div *ngIf="authMode === 'phone'" class="phone-form">
        <div *ngIf="!otpSent">
          <p class="info-text">Ingresa tu número con código de país (ej: +52...)</p>
          <input type="tel" placeholder="+52 123 456 7890" [(ngModel)]="phone" name="phone" class="input-field">
          <button (click)="sendOtp()" [disabled]="loading" class="btn-primary">
            {{ loading ? 'Enviando...' : 'Enviar Código SMS' }}
          </button>
        </div>
        
        <div *ngIf="otpSent">
          <p class="info-text">Introduce el código de 6 dígitos enviado a {{ phone }}</p>
          <input type="text" placeholder="123456" [(ngModel)]="token" name="token" class="input-field text-center">
          <button (click)="verifyOtp()" [disabled]="loading" class="btn-primary">
            {{ loading ? 'Verificando...' : 'Verificar y Entrar' }}
          </button>
          <button (click)="otpSent = false" class="btn-link">Cambiar número</button>
        </div>
      </div>

      <div class="divider">O usa otra opción</div>

      <div class="auth-switch">
        <button (click)="authMode = 'phone'" class="btn-outline" *ngIf="authMode !== 'phone'">
          📱 Iniciar con Teléfono
        </button>
         <button (click)="authMode = 'email'" class="btn-outline" *ngIf="authMode !== 'email'">
          📧 Iniciar con Email
        </button>
      </div>

      <p class="toggle-link" (click)="isLogin = !isLogin" *ngIf="authMode === 'email'">
        {{ isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión' }}
      </p>
      
      <p *ngIf="error" class="error-message">{{ error }}</p>
    </div>
  `,
  styles: [`
    /* 1. FONDO DE PANTALLA COMPLETO (El oscuro) */
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      width: 100%;
      /* Imagen oscura externa */
      background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), 
                  url('https://images4.alphacoders.com/936/936378.jpg');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }

    /* 2. CONTENEDOR (Con efecto cristal para que se vea moderno) */
    .auth-container { 
      max-width: 400px; width: 90%; padding: 35px; 
      
      /* Fondo semitransparente + desenfoque */
      background: rgba(30, 30, 30, 0.85); 
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);

      border-radius: 20px; 
      box-shadow: 0 25px 50px rgba(0,0,0,0.5); 
      color: #fff; 
    }

    h2 { text-align: center; margin-bottom: 25px; color: #ffcb05; text-transform: uppercase; letter-spacing: 1px; }
    
    .input-field { 
      width: 100%; padding: 12px; margin-bottom: 15px; 
      border: 1px solid #444; border-radius: 8px; 
      background: #222; color: white; box-sizing: border-box; 
      font-size: 1rem;
    }
    .input-field:focus { border-color: #ffcb05; outline: none; }
    .text-center { text-align: center; letter-spacing: 3px; font-weight: bold; }

    .btn-primary { 
      width: 100%; padding: 12px; background: linear-gradient(45deg, #ffcb05, #f9a825);
      color: #121212; border: none; border-radius: 8px; cursor: pointer; 
      font-weight: bold; margin-bottom: 10px; transition: 0.3s; font-size: 1rem;
    }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(255, 203, 5, 0.4); }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
    
    .divider { text-align: center; margin: 20px 0; color: #888; font-size: 0.85rem; position: relative; }
    .divider::before, .divider::after { content: ""; position: absolute; top: 50%; width: 30%; height: 1px; background: #444; }
    .divider::before { left: 0; } .divider::after { right: 0; }
    
    .auth-switch { display: flex; flex-direction: column; gap: 10px; }
    .btn-outline { 
      width: 100%; padding: 12px; background: transparent; 
      border: 2px solid #555; color: #ccc; border-radius: 8px; 
      cursor: pointer; font-weight: bold; transition: 0.3s; 
    }
    .btn-outline:hover { border-color: #ffcb05; color: #ffcb05; background: rgba(255, 203, 5, 0.1); }
    
    .toggle-link { margin-top: 20px; text-align: center; color: #aaa; cursor: pointer; font-size: 0.9rem; }
    .toggle-link:hover { color: #fff; text-decoration: underline; }
    
    .btn-link { background: none; border: none; color: #888; cursor: pointer; font-size: 0.8rem; text-decoration: underline; width: 100%; margin-top: 5px; }
    .info-text { color: #aaa; font-size: 0.9rem; margin-bottom: 10px; text-align: center; }
    .error-message { color: #ff5252; text-align: center; margin-top: 15px; background: rgba(255, 82, 82, 0.1); padding: 10px; border-radius: 8px; border: 1px solid rgba(255, 82, 82, 0.3); }
  `]
})
export class Auth implements OnInit {
  isLogin = true;
  authMode: 'email' | 'phone' = 'email';
  email = ''; password = ''; phone = ''; token = ''; otpSent = false; loading = false; error: string | null = null;

  constructor(private supabaseService: SupabaseService, private router: Router) {}

  ngOnInit(): void {
    this.supabaseService.currentUser$.subscribe(user => {
      if (user) this.router.navigate(['/']);
    });
  }

  submitForm() {
    this.loading = true; this.error = null;
    const action = this.isLogin ? this.supabaseService.signIn(this.email, this.password) : this.supabaseService.signUp(this.email, this.password);
    action.subscribe({ next: (res) => this.handleResponse(res), error: (err) => this.handleError(err) });
  }

  sendOtp() {
    if (!this.phone) { this.error = 'Ingresa un número válido'; return; }
    this.loading = true; this.error = null;
    this.supabaseService.signInWithPhone(this.phone).subscribe({
      next: (res) => { this.loading = false; if (res.error) this.handleError(res.error); else this.otpSent = true; },
      error: (err) => this.handleError(err)
    });
  }

  verifyOtp() {
    if (!this.token) { this.error = 'Ingresa el código'; return; }
    this.loading = true;
    this.supabaseService.verifyOtp(this.phone, this.token).subscribe({
      next: (res) => { this.loading = false; if (res.error) this.handleError(res.error); else this.router.navigate(['/']); },
      error: (err) => this.handleError(err)
    });
  }

  private handleResponse(response: any) {
    this.loading = false;
    if (response.error) this.error = response.error.message;
    else if (!response.data.user && !this.isLogin) { this.error = 'Registro exitoso. Revisa tu email.'; this.isLogin = true; }
    else this.router.navigate(['/']);
  }

  private handleError(err: any) { this.loading = false; console.error(err); this.error = err.message || 'Ocurrió un error inesperado.'; }
}