import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../supabase.service';
import { PokeApiService, Pokemon } from '../services/pokeapi';
import { BattleArena } from './battle-arena/battle-arena';
// 🚨 IMPORTANTE: Importamos el servicio de audio
import { AudioService } from '../services/audio';

@Component({
  selector: 'app-juego',
  standalone: true,
  imports: [CommonModule, BattleArena],
  template: `
    <div class="juego-main">
      
      <div class="user-stats" *ngIf="currentUserId">
        <div class="stat-badge win">
          <span class="icon">🏆</span>
          <span class="count">{{ userStats.wins }}</span>
          <span class="label">Victorias</span>
        </div>
        <div class="stat-badge lose">
          <span class="icon">💀</span>
          <span class="count">{{ userStats.losses }}</span>
          <span class="label">Derrotas</span>
        </div>
      </div>

      <div *ngIf="!battleStarted" class="selection-screen">
        <header>
          <h2>⚔️ Elige tu Equipo 🛡️</h2>
          <p class="subtitle">Selecciona 5 Pokémon para entrar a la arena</p>
          
          <button class="btn-start" 
             [disabled]="selectedCount !== 5"
             (click)="iniciarBatalla()">
             {{ selectedCount === 5 ? '¡LUCHAR!' : 'Elige ' + (5 - selectedCount) + ' más' }}
          </button>
        </header>

        <div class="pokemon-grid">
          <div *ngFor="let p of pokemons" 
               class="pokemon-card" 
               [class.selected]="p.selected"
               (click)="toggleSelection(p)">
            
            <img [src]="p.image" [alt]="p.name">
            <h4>{{ p.name | titlecase }}</h4>
            
            <div class="types">
              <span class="badge" [class]="p.type">{{ p.type }}</span>
            </div>
            
            <div class="stats-row">
              <div class="stat">
                <span class="label">HP</span>
                <span class="value">{{ p.hp | number:'1.0-0' }}</span>
              </div>
              <div class="stat">
                <span class="label">ATK</span>
                <span class="value">{{ p.attack }}</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      <app-battle-arena 
        *ngIf="battleStarted"
        [playerTeam]="playerTeam"
        [cpuTeam]="cpuTeam"
        (battleEnd)="onBattleEnd($event)">
      </app-battle-arena>

    </div>
  `,
  styles: [`
    .juego-main { width: 100%; min-height: 100vh; background: #121212; padding: 20px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; position: relative; }
    .user-stats { position: absolute; top: 20px; right: 20px; display: flex; gap: 15px; z-index: 100; }
    .stat-badge { background: rgba(30, 30, 30, 0.9); border: 1px solid #444; padding: 8px 15px; border-radius: 12px; display: flex; align-items: center; gap: 8px; color: #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
    .stat-badge.win { border-bottom: 3px solid #4caf50; } .stat-badge.lose { border-bottom: 3px solid #f44336; }
    .stat-badge .icon { font-size: 1.2rem; } .stat-badge .count { font-weight: 800; font-size: 1.2rem; } .stat-badge .label { font-size: 0.8rem; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; }
    .selection-screen { width: 100%; max-width: 1600px; display: flex; flex-direction: column; align-items: center; }
    header { text-align: center; margin-bottom: 40px; margin-top: 20px; }
    h2 { font-size: 3rem; color: #ffcb05; text-transform: uppercase; letter-spacing: 2px; text-shadow: 0 0 15px rgba(255, 203, 5, 0.4); margin: 0; }
    .subtitle { color: #888; font-size: 1.2rem; margin-top: 10px; margin-bottom: 30px; }
    .btn-start { background: linear-gradient(135deg, #ffcb05, #f9a825); color: #121212; padding: 15px 60px; border: none; border-radius: 50px; font-size: 1.5rem; font-weight: 800; cursor: pointer; transition: 0.3s; box-shadow: 0 0 25px rgba(255, 203, 5, 0.3); text-transform: uppercase; }
    .btn-start:disabled { background: #333; color: #555; box-shadow: none; cursor: not-allowed; opacity: 0.7; }
    .btn-start:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 0 35px rgba(255, 203, 5, 0.6); }
    .pokemon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 25px; width: 100%; }
    .pokemon-card { background: #1e1e1e; border: 2px solid #333; border-radius: 20px; padding: 15px; text-align: center; cursor: pointer; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); position: relative; overflow: hidden; }
    .pokemon-card:hover { transform: translateY(-10px); border-color: #555; box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 10; }
    .pokemon-card.selected { border-color: #ffcb05; background: #262626; box-shadow: 0 0 0 2px #ffcb05, 0 10px 30px rgba(0,0,0,0.6); }
    .pokemon-card img { width: 100px; height: 100px; filter: drop-shadow(0 5px 10px rgba(0,0,0,0.6)); transition: 0.3s; }
    .pokemon-card:hover img { transform: scale(1.1); }
    .pokemon-card h4 { margin: 15px 0 10px; font-size: 1.1rem; color: #fff; letter-spacing: 0.5px; }
    .badge { font-size: 0.7rem; padding: 4px 10px; border-radius: 20px; background: #444; text-transform: uppercase; font-weight: bold; color: white; letter-spacing: 1px; }
    .badge.fire { background: #ff5252; } .badge.water { background: #448aff; } .badge.grass { background: #69f0ae; color: #000; } .badge.electric { background: #ffd740; color: #000; } .badge.bug { background: #9ccc65; color: #000; }
    .stats-row { display: flex; justify-content: space-between; margin-top: 15px; background: rgba(0,0,0,0.4); padding: 8px; border-radius: 10px; }
    .stat { display: flex; flex-direction: column; width: 45%; }
    .label { font-size: 0.7rem; color: #888; font-weight: bold; }
    .value { font-size: 0.9rem; color: #eee; font-weight: bold; }
  `]
})
export class Juego implements OnInit {
  pokemons: Pokemon[] = [];
  selectedCount = 0;
  battleStarted = false;
  playerTeam: Pokemon[] = [];
  cpuTeam: Pokemon[] = [];
  currentUserId: string | null = null;
  userStats = { wins: 0, losses: 0 };

  constructor(
    private pokeApi: PokeApiService, 
    private supabase: SupabaseService,
    // 🚨 INYECCIÓN DEL SERVICIO DE AUDIO (Recuperada)
    private audio: AudioService
  ) {
    this.supabase.currentUser$.subscribe(u => {
      this.currentUserId = u?.id || null;
      if (this.currentUserId) this.loadStats();
    });
  }

  ngOnInit() {
    this.pokeApi.getOriginalPokemons().subscribe(data => {
      this.pokemons = data;
    });
  }

  async loadStats() {
    if (this.currentUserId) {
      this.userStats = await this.supabase.getUserStats(this.currentUserId);
    }
  }

  toggleSelection(p: Pokemon) {
    if (p.selected) {
      p.selected = false;
      this.selectedCount--;
    } else if (this.selectedCount < 5) {
      p.selected = true;
      this.selectedCount++;
    }
  }

  iniciarBatalla() {
    this.playerTeam = this.pokemons.filter(p => p.selected).map(p => JSON.parse(JSON.stringify(p)));
    this.cpuTeam = [];
    const available = [...this.pokemons];
    for (let i = 0; i < 5; i++) {
      const idx = Math.floor(Math.random() * available.length);
      this.cpuTeam.push(JSON.parse(JSON.stringify(available[idx])));
      available.splice(idx, 1);
    }
    
    this.battleStarted = true;
    // 🎵 REPRODUCIR MÚSICA DE BATALLA
    this.audio.playMusic('/sounds/battle.mp3', 0.4);
  }

  async onBattleEnd(winner: 'Player' | 'CPU') {
    // 🎵 DETENER MÚSICA
    this.audio.stopMusic();
    const esVictoria = winner === 'Player';
    
    // 🎵 SONIDOS DE FIN DE JUEGO
    if (esVictoria) {
      this.audio.playSfx('/sounds/victory.mp3', 0.5);
    } else {
      this.audio.playSfx('/sounds/defeat.mp3', 0.6);
    }

    if (this.currentUserId) {
      try {
        await this.supabase.registrarPartida(this.currentUserId, esVictoria);
        
        if (esVictoria) this.userStats.wins++;
        else this.userStats.losses++;

        if (esVictoria) {
          alert('¡HAS GANADO! 🏆\nVictoria registrada.');
        } else {
          alert('¡HAS PERDIDO! 💀\nDerrota registrada.');
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      alert(esVictoria ? '¡Ganaste! (Sin guardar)' : '¡Perdiste! (Sin guardar)');
    }

    this.battleStarted = false;
    this.selectedCount = 0;
    this.pokemons.forEach(p => p.selected = false);
  }
}