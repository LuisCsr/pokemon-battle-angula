import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { SupabaseService } from './supabase.service';
import { routes } from './app.routes';

// Esta función conecta el inicio de la app con tu servicio
function initializeSupabase(supabaseService: SupabaseService) {
  return (): Promise<void> => supabaseService.initialize();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // withFetch es importante para Supabase v2
    provideHttpClient(withFetch()),
    provideClientHydration(),
    // Inicializador de la aplicación
    {
      provide: APP_INITIALIZER,
      useFactory: initializeSupabase,
      deps: [SupabaseService],
      multi: true
    }
  ]
};