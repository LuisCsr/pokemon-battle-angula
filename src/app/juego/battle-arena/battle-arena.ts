import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pokemon, Move } from '../../services/pokeapi';
import { BattleAiService } from '../../services/battle-ai';
// 🚨 IMPORTANTE: Importamos el servicio de audio
import { AudioService } from '../../services/audio';

@Component({
  selector: 'app-battle-arena',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="arena-wrapper">
      
      <div *ngIf="turn === 'CPU' && !gameOver" class="cpu-thinking-overlay">
        <div class="spinner-pokeball"></div>
        <p>Rival pensando...</p>
      </div>

      <div *ngIf="showFinishHim" class="dramatic-text finish-him">FINISH HIM!</div>
      <div *ngIf="showFatality" class="dramatic-text fatality">FATALITY</div>
      <div *ngIf="screenFlash" class="screen-flash"></div>

      <div *ngIf="damageText" class="floating-damage" 
           [class.player-target]="damageTarget === 'player'" 
           [class.cpu-target]="damageTarget === 'cpu'">
        {{ damageText }}
      </div>

      <div class="battle-scene" [class.darken]="showFinishHim || showFatality">
        
        <div class="fighter-container cpu">
          <div class="hud">
            <h3>{{ cpuActive.name | titlecase }} <small>Lv.50</small></h3>
            <div class="hp-bar-bg">
              <div class="hp-bar-fill" [style.width.%]="getHpPercent(cpuActive)" [ngClass]="getHpColor(cpuActive)"></div>
            </div>
            <span class="hp-text">{{ cpuActive.currentHp | number:'1.0-0' }} / {{ cpuActive.maxHp | number:'1.0-0' }}</span>
          </div>
          <div class="sprite-box">
             <img [src]="cpuActive.image" class="sprite" [class.hit]="cpuHitAnim" [class.attacking]="cpuAttackAnim" [class.destroyed]="cpuDestroyed">
          </div>
        </div>

        <div class="fighter-container player">
          <div class="sprite-box">
             <img [src]="playerActive.imageBack || playerActive.image" class="sprite" [class.hit]="playerHitAnim" [class.attacking]="playerAttackAnim" [class.destroyed]="playerDestroyed">
          </div>
          <div class="hud">
            <h3>{{ playerActive.name | titlecase }} <small>Lv.50</small></h3>
            <div class="hp-bar-bg">
              <div class="hp-bar-fill" [style.width.%]="getHpPercent(playerActive)" [ngClass]="getHpColor(playerActive)"></div>
            </div>
            <span class="hp-text">{{ playerActive.currentHp | number:'1.0-0' }} / {{ playerActive.maxHp | number:'1.0-0' }}</span>
          </div>
        </div>
      </div>

      <div class="control-deck" [class.disabled-panel]="showFinishHim || showFatality || turn === 'CPU'">
        <div class="log-console">
          <p *ngFor="let l of logs.slice().reverse()">> {{ l }}</p>
        </div>
        <div class="moves-panel" *ngIf="!gameOver">
          <p class="prompt" *ngIf="turn === 'Player'">¡Tu turno! Elige un ataque:</p>
          <p class="prompt" *ngIf="turn === 'CPU'">Esperando...</p>
          <div class="moves-grid">
            <button *ngFor="let move of playerActive.moves" class="move-btn" [class]="move.type" (click)="onPlayerAttack(move)" [disabled]="turn !== 'Player'">
              <span class="move-name">{{ move.name }}</span>
              <span class="move-type">{{ move.type | uppercase }}</span>
              <span class="move-pow">{{ move.power }} BP</span>
            </button>
          </div>
        </div>
        <div class="game-over-panel" *ngIf="gameOver">
          <h2 [class.win]="winner === 'Player'">{{ winner === 'Player' ? '¡VICTORIA!' : '¡DERROTA!' }}</h2>
          <button class="btn-restart" (click)="restart()">Volver al Menú</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ESTILOS COMPLETOS RESPONSIVOS */
    :host { display: block; width: 100%; height: 100vh; position: fixed; top: 0; left: 0; z-index: 1000; background: #000; }
    .arena-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; background: linear-gradient(180deg, #1a1a1a 0%, #000 100%); }
    .battle-scene { flex: 1; position: relative; background: url('https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1470&auto=format&fit=crop'); background-size: cover; background-position: center bottom; display: flex; justify-content: space-between; align-items: flex-end; padding: 20px 5%; overflow: hidden; }
    .battle-scene.darken { filter: brightness(0.3) grayscale(0.8); transition: 0.5s; }
    .fighter-container { position: relative; width: 45%; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; }
    .fighter-container.cpu { align-items: flex-end; padding-bottom: 10%; } .fighter-container.player { align-items: flex-start; padding-bottom: 2%; }
    .sprite { width: 100%; max-width: 350px; min-width: 150px; height: auto; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.6)); transition: transform 0.2s; }
    .hud { background: rgba(255, 255, 255, 0.9); padding: 10px 20px; border-radius: 12px; width: 280px; box-shadow: 0 5px 15px rgba(0,0,0,0.4); border-left: 8px solid #333; margin-bottom: 10px; z-index: 10; }
    .hud h3 { margin: 0 0 5px 0; font-size: 1.1rem; color: #222; display: flex; justify-content: space-between; }
    .hp-bar-bg { width: 100%; height: 15px; background: #ccc; border-radius: 10px; overflow: hidden; }
    .hp-bar-fill { height: 100%; transition: width 0.5s ease-out; }
    .hp-green { background: #4caf50; } .hp-yellow { background: #ffc107; } .hp-red { background: #f44336; }
    .hp-text { display: block; text-align: right; font-size: 0.9rem; color: #444; font-weight: bold; }
    .control-deck { height: 280px; background: #1a1a1a; border-top: 4px solid #ffcb05; display: flex; padding: 15px; gap: 20px; position: relative; }
    .log-console { flex: 1; background: #000; border: 1px solid #444; border-radius: 10px; padding: 10px; overflow-y: auto; color: #ccc; font-family: monospace; font-size: 0.9rem; }
    .moves-panel { flex: 2; display: flex; flex-direction: column; }
    .prompt { color: #fff; margin: 0 0 10px 0; font-size: 1.2rem; }
    .moves-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; height: 100%; }
    .move-btn { background: #333; border: 2px solid #555; color: white; border-radius: 10px; cursor: pointer; display: flex; flex-direction: column; justify-content: center; align-items: center; transition: all 0.2s; }
    .move-btn:hover { background: #444; border-color: #ffcb05; transform: translateY(-2px); }
    .move-name { font-weight: bold; font-size: 1rem; } .move-type { font-size: 0.7rem; background: #555; padding: 2px 6px; border-radius: 4px; margin-top: 4px; }
    .move-btn.fire { border-color: #f08030; } .move-btn.water { border-color: #6890f0; } .move-btn.grass { border-color: #78c850; } .move-btn.electric { border-color: #f8d030; }
    .game-over-panel { position: absolute; inset: 0; background: rgba(0,0,0,0.95); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 50; }
    .game-over-panel h2 { font-size: 3rem; color: #ff5252; margin-bottom: 20px; text-transform: uppercase; }
    .game-over-panel h2.win { color: #4caf50; }
    .btn-restart { background: #ffcb05; border: none; padding: 20px 60px; font-size: 1.5rem; font-weight: 900; border-radius: 50px; cursor: pointer; box-shadow: 0 0 20px rgba(255, 203, 5, 0.5); transition: transform 0.2s; }
    
    @media (max-width: 768px) {
      .battle-scene { flex-direction: column; justify-content: center; align-items: center; padding: 10px; }
      .fighter-container { width: 100%; height: 45%; flex-direction: row; align-items: center; justify-content: center; }
      .fighter-container.cpu { align-items: flex-end; padding-bottom: 0; margin-bottom: 10px; } .fighter-container.player { align-items: flex-end; padding-bottom: 0; }
      .hud { width: 150px; padding: 5px 10px; font-size: 0.8rem; margin: 0 10px; } .sprite { max-width: 160px; }
      .control-deck { flex-direction: column-reverse; height: auto; padding: 10px; }
      .log-console { height: 80px; flex: none; } .moves-grid { height: 140px; } .move-btn { padding: 5px; }
      .game-over-panel h2 { font-size: 2rem; } .btn-restart { padding: 15px 40px; font-size: 1.2rem; }
    }
    
    .attacking { animation: attackJump 0.3s ease-in-out; }
    @keyframes attackJump { 0% { transform: translateY(0); } 50% { transform: translateY(-30px); } 100% { transform: translateY(0); } }
    .hit { animation: shakeHit 0.4s; filter: brightness(2) sepia(1) hue-rotate(-50deg) saturate(5); }
    @keyframes shakeHit { 0%, 100% { transform: translate(0); } 20%, 60% { transform: translate(-5px); } 40%, 80% { transform: translate(5px); } }
    .destroyed { animation: disintegrate 1s forwards; filter: grayscale(100%); }
    @keyframes disintegrate { to { opacity: 0; transform: scale(1.5); filter: blur(10px); } }
    .dramatic-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0); font-size: 10vw; font-weight: 900; z-index: 200; animation: dramaticPop 0.5s forwards; pointer-events: none; }
    .finish-him { color: #a30000; text-shadow: 0 0 20px #ff0000; font-family: 'Impact', sans-serif; -webkit-text-stroke: 2px black; }
    .fatality { color: #ff0000; text-shadow: 0 0 30px #ff0000; font-family: 'Impact', sans-serif; letter-spacing: 5px; -webkit-text-stroke: 2px black; animation: bloodDrip 2s forwards; }
    .screen-flash { position: absolute; inset: 0; background: red; opacity: 0; z-index: 150; animation: flash 0.2s; }
    @keyframes flash { 50% { opacity: 0.6; } }
    @keyframes dramaticPop { 80% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; } }
    .floating-damage { position: absolute; font-size: 4rem; font-weight: 900; color: #ff5252; text-shadow: 2px 2px 0 #fff; z-index: 100; animation: floatUp 1s forwards; }
    .player-target { top: 50%; left: 20%; } .cpu-target { top: 20%; right: 20%; }
    @keyframes floatUp { to { opacity: 0; transform: translateY(-80px); } }
    
    .cpu-thinking-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.7); padding: 20px 40px; border-radius: 50px; display: flex; align-items: center; gap: 15px; z-index: 50; border: 1px solid #ffcb05; color: #ffcb05; font-weight: bold; }
    .spinner-pokeball { width: 30px; height: 30px; border: 4px solid #fff; border-top-color: #ff5252; border-bottom-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class BattleArena implements OnInit {
  @Input() playerTeam: Pokemon[] = [];
  @Input() cpuTeam: Pokemon[] = [];
  @Output() battleEnd = new EventEmitter<'Player' | 'CPU'>();

  playerIdx = 0; cpuIdx = 0; turn: 'Player' | 'CPU' = 'Player';
  logs: string[] = []; gameOver = false; winner: 'Player' | 'CPU' | null = null;
  playerHitAnim = false; cpuHitAnim = false; playerAttackAnim = false; cpuAttackAnim = false; playerDestroyed = false; cpuDestroyed = false;
  showFinishHim = false; showFatality = false; screenFlash = false; damageText: string | null = null; damageTarget: 'player' | 'cpu' | null = null;

  constructor(
    private aiService: BattleAiService, 
    private audio: AudioService // 👈 Inyección para efectos de sonido
  ) {}

  ngOnInit() { this.logs.push('¡Batalla iniciada!'); }

  get playerActive() { return this.playerTeam[this.playerIdx]; }
  get cpuActive() { return this.cpuTeam[this.cpuIdx]; }
  getHpPercent(p: Pokemon) { return (p.currentHp / p.maxHp) * 100; }
  getHpColor(p: Pokemon) { const pct = this.getHpPercent(p); return { 'hp-green': pct > 50, 'hp-yellow': pct <= 50 && pct > 20, 'hp-red': pct <= 20 }; }

  onPlayerAttack(move: Move) {
    if (this.turn !== 'Player') return;
    this.executeTurn(this.playerActive, this.cpuActive, move, 'cpu');
  }

  executeTurn(attacker: Pokemon, defender: Pokemon, move: Move, targetSide: 'player' | 'cpu') {
    // 🎵 Sonido de ataque
    this.audio.playSfx('/sounds/attack.mp3');
    
    if (targetSide === 'cpu') this.playerAttackAnim = true; else this.cpuAttackAnim = true;
    setTimeout(() => { this.playerAttackAnim = false; this.cpuAttackAnim = false; }, 300);

    const effectiveness = this.aiService.getEffectiveness(move.type, defender.type);
    const rawDamage = (attacker.attack / defender.defense) * move.power * 0.5;
    const finalDamage = Math.floor(rawDamage * effectiveness) + 5;
    defender.currentHp = Math.max(0, defender.currentHp - finalDamage);

    let log = `${attacker.name} usó ${move.name}.`;
    if (effectiveness > 1) log += ' ¡Súper eficaz!';
    this.logs.push(log);
    this.showDamage(finalDamage, targetSide);
    
    // 🎵 Sonido de golpe
    setTimeout(() => {
      this.audio.playSfx('/sounds/hit.mp3');
      if (targetSide === 'cpu') this.cpuHitAnim = true; else this.playerHitAnim = true;
    }, 200);
    setTimeout(() => { this.cpuHitAnim = false; this.playerHitAnim = false; }, 600);

    if (defender.currentHp <= 0) {
      this.logs.push(`${defender.name} se debilitó.`);
      setTimeout(() => this.handleFaint(targetSide), 1000);
    } else {
      this.changeTurn();
    }
  }

  changeTurn() {
    if (this.turn === 'Player') { this.turn = 'CPU'; setTimeout(() => this.cpuTurn(), 1500); }
    else { this.turn = 'Player'; }
  }

  cpuTurn() {
    if (this.gameOver) return;
    const bestMove = this.aiService.chooseMove(this.cpuActive, this.playerActive);
    this.executeTurn(this.cpuActive, this.playerActive, bestMove, 'player');
  }

  handleFaint(side: 'player' | 'cpu') {
    if (side === 'cpu') {
      if (this.cpuIdx < this.cpuTeam.length - 1) {
        this.cpuIdx++;
        this.logs.push(`Rival envía a ${this.cpuActive.name}.`);
        this.turn = 'Player';
      } else { this.triggerFatality('Player'); }
    } else {
      if (this.playerIdx < this.playerTeam.length - 1) {
        this.playerIdx++;
        this.logs.push(`¡Adelante ${this.playerActive.name}!`);
        this.turn = 'Player';
      } else { this.triggerFatality('CPU'); }
    }
  }

  triggerFatality(winner: 'Player' | 'CPU') {
     this.showFinishHim = true;
     // 🎵 Sonido Finish Him
     this.audio.playSfx('/sounds/finish-him.mp3'); 
     setTimeout(() => {
         this.showFinishHim = false;
         if (winner === 'Player') this.playerAttackAnim = true; else this.cpuAttackAnim = true;
         setTimeout(() => {
             if (winner === 'Player') this.playerAttackAnim = false; else this.cpuAttackAnim = false;
             this.screenFlash = true;
             if (winner === 'Player') this.cpuDestroyed = true; else this.playerDestroyed = true;
             setTimeout(() => { 
               this.screenFlash = false; 
               this.showFatality = true;
               setTimeout(() => {
                 this.showFatality = false;
                 this.endGame(winner); 
               }, 2500); 
             }, 200);
         }, 500); 
     }, 2000); 
  }

  showDamage(val: number, side: 'player' | 'cpu') {
    this.damageText = `-${val}`;
    this.damageTarget = side;
    setTimeout(() => { this.damageText = null; }, 1000);
  }

  endGame(winner: 'Player' | 'CPU') {
    this.gameOver = true;
    this.winner = winner;
  }

  restart() {
    this.battleEnd.emit(this.winner!);
  }
}