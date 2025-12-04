import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pokemon, Move } from '../../services/pokeapi';
import { BattleAiService } from '../../services/battle-ai';
import { AudioService } from '../../services/audio';

@Component({
  selector: 'app-battle-arena',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="arena-wrapper">
      
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
          <div class="hud" [class.fade-out]="showFatality">
            <h3>{{ cpuActive.name | titlecase }} <small>Lv.50</small></h3>
            <div class="hp-bar-bg">
              <div class="hp-bar-fill" 
                   [style.width.%]="getHpPercent(cpuActive)" 
                   [ngClass]="getHpColor(cpuActive)">
              </div>
            </div>
            <span class="hp-text">{{ cpuActive.currentHp | number:'1.0-0' }} / {{ cpuActive.maxHp | number:'1.0-0' }}</span>
          </div>
          <div class="sprite-box">
             <img [src]="cpuActive.image" 
                  class="sprite" 
                  [class.hit]="cpuHitAnim" 
                  [class.attacking]="cpuAttackAnim"
                  [class.destroyed]="cpuDestroyed">
          </div>
        </div>

        <div class="fighter-container player">
          <div class="sprite-box">
             <img [src]="playerActive.imageBack || playerActive.image" 
                  class="sprite" 
                  [class.hit]="playerHitAnim" 
                  [class.attacking]="playerAttackAnim"
                  [class.destroyed]="playerDestroyed">
          </div>
          <div class="hud" [class.fade-out]="showFatality">
            <h3>{{ playerActive.name | titlecase }} <small>Lv.50</small></h3>
            <div class="hp-bar-bg">
              <div class="hp-bar-fill" 
                   [style.width.%]="getHpPercent(playerActive)" 
                   [ngClass]="getHpColor(playerActive)">
              </div>
            </div>
            <span class="hp-text">{{ playerActive.currentHp | number:'1.0-0' }} / {{ playerActive.maxHp | number:'1.0-0' }}</span>
          </div>
        </div>

      </div>

      <div class="control-deck" [class.disabled-panel]="showFinishHim || showFatality">
        <div class="log-console">
          <p *ngFor="let l of logs.slice().reverse()">> {{ l }}</p>
        </div>

        <div class="moves-panel" *ngIf="!gameOver && turn === 'Player'">
          <p class="prompt">¿Qué hará <strong>{{ playerActive.name | titlecase }}</strong>?</p>
          <div class="moves-grid">
            <button *ngFor="let move of playerActive.moves" 
                    class="move-btn" 
                    [class]="move.type"
                    (click)="onPlayerAttack(move)">
              <span class="move-name">{{ move.name }}</span>
              <span class="move-type">{{ move.type | uppercase }}</span>
              <span class="move-pow">POW: {{ move.power }}</span>
            </button>
          </div>
        </div>

        <div class="waiting-panel" *ngIf="!gameOver && turn === 'CPU'">
          <p>El rival está pensando...</p>
        </div>

        <div class="game-over-panel" *ngIf="gameOver">
          <h2 [class.win]="winner === 'Player'">{{ winner === 'Player' ? '¡VICTORIA!' : '¡DERROTA!' }}</h2>
          <button class="btn-restart" (click)="restart()">Volver al Menú</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dramatic-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0); font-size: 6rem; font-weight: 900; text-transform: uppercase; z-index: 1000; pointer-events: none; animation: dramaticPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
    .finish-him { color: #a30000; text-shadow: 0 0 20px #ff0000, 4px 4px 0px #000; font-family: 'Impact', sans-serif; letter-spacing: 5px; }
    .fatality { color: #ff0000; text-shadow: 0 0 30px #ff0000, 5px 5px 0px #330000; font-family: 'Impact', sans-serif; letter-spacing: 8px; animation: bloodDrip 2s forwards; }
    .screen-flash { position: absolute; inset: 0; background: red; opacity: 0; z-index: 500; animation: flash 0.2s; }
    .battle-scene.darken { filter: brightness(0.4) contrast(1.2); transition: 0.5s; }
    .fade-out { opacity: 0; transition: 0.5s; }
    .destroyed { animation: disintegrate 1s forwards; filter: grayscale(100%) contrast(200%); }
    @keyframes dramaticPop { 0% { transform: translate(-50%, -50%) scale(0); opacity: 0; } 80% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; } }
    @keyframes flash { 0% { opacity: 0; } 50% { opacity: 0.6; } 100% { opacity: 0; } }
    @keyframes disintegrate { 0% { opacity: 1; transform: scale(1) rotate(0); } 100% { opacity: 0; transform: scale(1.5); filter: blur(10px); } }

    /* ESTILOS BASE */
    .arena-wrapper { width: 100%; height: 80vh; border: 4px solid #222; border-radius: 20px; overflow: hidden; background: linear-gradient(180deg, #2a2a2a 0%, #000 100%); box-shadow: 0 20px 50px rgba(0,0,0,0.8); font-family: 'Poppins', sans-serif; display: flex; flex-direction: column; position: relative; }
    .battle-scene { flex: 1; position: relative; background: url('https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1470&auto=format&fit=crop'); background-size: cover; background-position: center bottom; display: flex; justify-content: space-between; padding: 40px; transition: 0.5s; }
    .fighter-container { position: relative; width: 40%; display: flex; flex-direction: column; }
    .fighter-container.cpu { align-items: flex-end; } .fighter-container.player { align-items: flex-start; justify-content: flex-end; }
    .sprite { width: 250px; height: 250px; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.6)); transition: transform 0.2s; }
    .attacking { animation: attackJump 0.3s ease-in-out; }
    @keyframes attackJump { 0% { transform: translateY(0) scale(1); } 50% { transform: translateY(-30px) scale(1.1); } 100% { transform: translateY(0) scale(1); } }
    .hit { animation: shakeHit 0.4s cubic-bezier(.36,.07,.19,.97) both; filter: brightness(2) sepia(1) hue-rotate(-50deg) saturate(5); }
    @keyframes shakeHit { 10%, 90% { transform: translate3d(-2px, 0, 0); } 20%, 80% { transform: translate3d(4px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-6px, 0, 0); } 40%, 60% { transform: translate3d(6px, 0, 0); } }
    .hud { background: rgba(255, 255, 255, 0.95); padding: 15px 25px; border-radius: 15px; width: 300px; box-shadow: 0 8px 20px rgba(0,0,0,0.4); border-left: 10px solid #333; margin-bottom: 20px; transition: opacity 0.5s; }
    .hud h3 { margin: 0 0 5px 0; font-size: 1.2rem; color: #222; display: flex; justify-content: space-between; }
    .hp-bar-bg { width: 100%; height: 20px; background: #ddd; border-radius: 10px; overflow: hidden; border: 2px solid #bbb; }
    .hp-bar-fill { height: 100%; transition: width 0.5s ease-out; }
    .hp-green { background: #4caf50; } .hp-yellow { background: #ffc107; } .hp-red { background: #f44336; }
    .hp-text { display: block; text-align: right; font-size: 0.9rem; color: #444; margin-top: 5px; font-weight: bold; }
    .control-deck { height: 200px; background: #222; border-top: 5px solid #ffcb05; display: flex; padding: 20px; gap: 20px; transition: opacity 0.5s; }
    .control-deck.disabled-panel { opacity: 0.3; pointer-events: none; }
    .log-console { flex: 1; background: #111; border: 2px solid #444; border-radius: 12px; padding: 15px; overflow-y: auto; color: #ccc; font-family: monospace; }
    .moves-panel { flex: 2; display: flex; flex-direction: column; }
    .prompt { color: white; margin: 0 0 10px 0; font-size: 1.2rem; }
    .moves-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; height: 100%; }
    .move-btn { background: #333; border: 2px solid #555; color: white; border-radius: 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; transition: all 0.2s; }
    .move-btn:hover { background: #444; border-color: #ffcb05; transform: translateY(-3px); }
    .move-name { font-weight: bold; font-size: 1.1rem; }
    .move-type { font-size: 0.8rem; background: #555; padding: 3px 8px; border-radius: 4px; }
    .move-btn.fire { border-color: #f08030; } .move-btn.water { border-color: #6890f0; } .move-btn.grass { border-color: #78c850; } .move-btn.electric { border-color: #f8d030; }
    .waiting-panel, .game-over-panel { flex: 2; display: flex; flex-direction: column; justify-content: center; align-items: center; color: white; }
    .btn-restart { background: #ffcb05; border: none; padding: 15px 40px; font-size: 1.2rem; font-weight: bold; border-radius: 50px; cursor: pointer; margin-top: 10px; }
    .floating-damage { position: absolute; font-size: 4rem; font-weight: 900; color: #ff5252; text-shadow: 3px 3px 0 #fff; z-index: 100; animation: floatUp 1s forwards; }
    .player-target { top: 40%; left: 20%; } .cpu-target { top: 15%; right: 20%; }
    @keyframes floatUp { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-80px); } }
  `]
})
export class BattleArena implements OnInit {
  @Input() playerTeam: Pokemon[] = [];
  @Input() cpuTeam: Pokemon[] = [];
  @Output() battleEnd = new EventEmitter<'Player' | 'CPU'>();

  playerIdx = 0;
  cpuIdx = 0;
  turn: 'Player' | 'CPU' = 'Player';
  logs: string[] = [];
  gameOver = false;
  winner: 'Player' | 'CPU' | null = null;
  
  playerHitAnim = false; cpuHitAnim = false;
  playerAttackAnim = false; cpuAttackAnim = false;
  playerDestroyed = false; cpuDestroyed = false;
  
  showFinishHim = false;
  showFatality = false;
  screenFlash = false;

  damageText: string | null = null;
  damageTarget: 'player' | 'cpu' | null = null;

  constructor(private aiService: BattleAiService, private audio: AudioService) {}

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
    if (this.turn === 'Player') {
      this.turn = 'CPU';
      setTimeout(() => this.cpuTurn(), 1500);
    } else {
      this.turn = 'Player';
    }
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
      } else {
        this.triggerFatality('Player');
      }
    } else {
      if (this.playerIdx < this.playerTeam.length - 1) {
        this.playerIdx++;
        this.logs.push(`¡Adelante ${this.playerActive.name}!`);
        this.turn = 'Player';
      } else {
        this.triggerFatality('CPU');
      }
    }
  }

  triggerFatality(winner: 'Player' | 'CPU') {
     // 1. PAUSA Y SONIDO
     this.showFinishHim = true;
     this.audio.playSfx('/sounds/finish-him.mp3'); 

     setTimeout(() => {
         this.showFinishHim = false;
         
         // 2. GOLPE FINAL
         if (winner === 'Player') this.playerAttackAnim = true; else this.cpuAttackAnim = true;
         
         setTimeout(() => {
             if (winner === 'Player') this.playerAttackAnim = false; else this.cpuAttackAnim = false;

             // 3. DESTRUCCIÓN
             this.screenFlash = true;
             if (winner === 'Player') this.cpuDestroyed = true; else this.playerDestroyed = true;

             setTimeout(() => { 
               this.screenFlash = false; 
               // 4. TEXTO FATALITY
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