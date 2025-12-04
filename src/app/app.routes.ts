import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs';

// --- Importación de Componentes ---
import { Saludo } from './saludo/saludo'; 
import { Segundo } from './segundo/segundo';
import { Auth } from './auth/auth';
import { Home } from './home/home';
import { Juego } from './juego/juego';

import { SupabaseService } from './supabase.service';

// Función de guardia para proteger rutas
const isAuthenticated = () => {
    const supabaseService = inject(SupabaseService);
    // Permite el acceso si hay usuario, o redirige a /auth
    return supabaseService.currentUser$.pipe(
        map(user => user ? true : '/auth')
    );
};

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'juego', component: Juego, canActivate: [isAuthenticated] },
    { path: 'saludo', component: Saludo },
    { path: 'segundo', component: Segundo },
    { path: 'auth', component: Auth },
    { path: '**', redirectTo: '' }
];