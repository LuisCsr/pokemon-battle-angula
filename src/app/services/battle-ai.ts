import { Injectable } from '@angular/core';
import { Pokemon, Move } from './pokeapi';

@Injectable({
  providedIn: 'root'
})
export class BattleAiService {

  // Tabla de tipos para que la IA sepa qué duele más
  private typeChart: any = {
    fire: { grass: 2, bug: 2, ice: 2, water: 0.5, rock: 0.5, dragon: 0.5 },
    water: { fire: 2, ground: 2, rock: 2, grass: 0.5, dragon: 0.5 },
    grass: { water: 2, ground: 2, rock: 2, fire: 0.5, flying: 0.5, bug: 0.5, poison: 0.5, dragon: 0.5 },
    electric: { water: 2, flying: 2, ground: 0, dragon: 0.5 },
    // ... se asume 1 neutro por defecto
  };

  constructor() { }

  /**
   * La CPU elige el mejor movimiento posible contra el jugador.
   */
  chooseMove(attacker: Pokemon, defender: Pokemon): Move {
    // Filtramos los movimientos para encontrar el que haga más daño
    let bestMove = attacker.moves[0];
    let maxEffectiveness = 0;

    for (const move of attacker.moves) {
      const effectiveness = this.getEffectiveness(move.type, defender.type);
      
      // La IA prefiere ataques con STAB (Same Type Attack Bonus) y efectivos
      let score = move.power * effectiveness;
      
      // Si el movimiento es del mismo tipo que el atacante, bonificación de 1.5x
      if (move.type === attacker.type) score *= 1.5;

      // Pequeño factor aleatorio para que no sea 100% predecible
      score += Math.random() * 10;

      if (score > maxEffectiveness) {
        maxEffectiveness = score;
        bestMove = move;
      }
    }

    console.log(`🤖 IA (${attacker.name}) eligió ${bestMove.name} con puntuación ${maxEffectiveness.toFixed(1)}`);
    return bestMove;
  }

  getEffectiveness(attackType: string, defenseType: string): number {
    if (this.typeChart[attackType] && this.typeChart[attackType][defenseType] !== undefined) {
      return this.typeChart[attackType][defenseType];
    }
    return 1; // Neutro
  }
}