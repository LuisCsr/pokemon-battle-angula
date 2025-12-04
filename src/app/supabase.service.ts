import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Observable, BehaviorSubject, from, of } from 'rxjs';

// ⚠️ TUS CLAVES
const SUPABASE_URL = 'https://lobbfeodsebnjctoaddl.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvYmJmZW9kc2VibmpjdG9hZGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NTExMTQsImV4cCI6MjA4MDIyNzExNH0.EJQi325MXDJtBdezZjkWuYJ4y6hPTXfHff1vJA00j1o'; 

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient | null = null;
  private _currentUser = new BehaviorSubject<User | null>(null);
  currentUser$ = this._currentUser.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Inicialización segura para SSR (Servidor)
    if (isPlatformBrowser(this.platformId)) {
      try {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        this.supabase.auth.onAuthStateChange((event, session) => {
          this._currentUser.next(session?.user ?? null);
        });
      } catch (error) {
        console.error('Supabase init error:', error);
      }
    }
  }

  // --- Inicialización ---
  
  // 1. Método principal (usado por app.config.ts)
  public async initialize(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.supabase) return Promise.resolve();
    try {
      const { data } = await this.supabase.auth.getSession();
      this._currentUser.next(data.session?.user ?? null);
    } catch (e) {
      console.warn("No session found");
    }
  }

  // 2. Método de compatibilidad (usado por Home.ts) - 🚨 ESTE FALTABA
  public async checkSession(): Promise<void> {
    return this.initialize();
  }

  private getClient(): SupabaseClient | null {
    return this.supabase;
  }

  // --- 🔐 Autenticación ---
  signUp(email: string, password: string): Observable<any> {
    const client = this.getClient();
    if (!client) return of({ error: { message: 'SSR: No client' } });
    return from(client.auth.signUp({ email, password }));
  }

  signIn(email: string, password: string): Observable<any> {
    const client = this.getClient();
    if (!client) return of({ error: { message: 'SSR: No client' } });
    return from(client.auth.signInWithPassword({ email, password }));
  }

  signOut(): Observable<any> {
    const client = this.getClient();
    if (!client) return of(null);
    return from(client.auth.signOut());
  }

  signInWithPhone(phone: string): Observable<any> {
    const client = this.getClient();
    if (!client) return of({ error: { message: 'SSR: No client' } });
    return from(client.auth.signInWithOtp({ phone }));
  }

  verifyOtp(phone: string, token: string): Observable<any> {
    const client = this.getClient();
    if (!client) return of({ error: { message: 'SSR: No client' } });
    return from(client.auth.verifyOtp({ phone, token, type: 'sms' }));
  }

  // --- 🏆 Base de Datos ---

  // Registrar Victoria o Derrota
  async registrarPartida(userId: string, esVictoria: boolean): Promise<void> {
    const client = this.getClient();
    if (!client) return;

    const { data } = await client
      .from('partidas_ganadas')
      .select('victorias_pokemon, derrotas_pokemon')
      .eq('user_id', userId)
      .single();

    let victorias = data?.victorias_pokemon || 0;
    let derrotas = data?.derrotas_pokemon || 0;

    if (esVictoria) victorias++;
    else derrotas++;

    const { error } = await client
      .from('partidas_ganadas')
      .upsert(
        { user_id: userId, victorias_pokemon: victorias, derrotas_pokemon: derrotas }, 
        { onConflict: 'user_id' } 
      );
      
    if (error) console.error('Error guardando:', error);
  }

  // Obtener estadísticas
  async getUserStats(userId: string): Promise<{ wins: number, losses: number }> {
    const client = this.getClient();
    if (!client) return { wins: 0, losses: 0 };

    const { data, error } = await client
      .from('partidas_ganadas')
      .select('victorias_pokemon, derrotas_pokemon')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { wins: 0, losses: 0 };
    }
    return { 
      wins: data?.victorias_pokemon || 0, 
      losses: data?.derrotas_pokemon || 0 
    };
  }
  
  // Legacy
  async incrementarVictoria(userId: string): Promise<void> {
    return this.registrarPartida(userId, true);
  }
  
  async getVictorias(userId: string): Promise<number> {
    const stats = await this.getUserStats(userId);
    return stats.wins;
  }
}