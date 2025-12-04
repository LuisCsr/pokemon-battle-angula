import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export interface Move {
  name: string;
  type: string;
  power: number;
  accuracy: number;
}

export interface Pokemon {
  id: number;
  name: string;
  image: string;
  imageBack: string;
  hp: number;
  attack: number;
  defense: number;
  // Propiedades de Batalla
  maxHp: number;
  currentHp: number;
  type: string;
  selected: boolean;
  moves: Move[];
}

@Injectable({
  providedIn: 'root'
})
export class PokeApiService {
  private apiUrl = 'https://pokeapi.co/api/v2/pokemon';

  // Banco de movimientos
  private movePool: any = {
    fire: [
      { name: 'Lanzallamas', type: 'fire', power: 90, accuracy: 100 },
      { name: 'Llamarada', type: 'fire', power: 110, accuracy: 85 },
      { name: 'Ascuas', type: 'fire', power: 40, accuracy: 100 }
    ],
    water: [
      { name: 'Hidrobomba', type: 'water', power: 110, accuracy: 80 },
      { name: 'Surf', type: 'water', power: 90, accuracy: 100 },
      { name: 'Pistola Agua', type: 'water', power: 40, accuracy: 100 }
    ],
    grass: [
      { name: 'Rayo Solar', type: 'grass', power: 120, accuracy: 100 },
      { name: 'Hoja Afilada', type: 'grass', power: 55, accuracy: 95 },
      { name: 'Látigo Cepa', type: 'grass', power: 45, accuracy: 100 }
    ],
    electric: [
      { name: 'Trueno', type: 'electric', power: 110, accuracy: 70 },
      { name: 'Rayo', type: 'electric', power: 90, accuracy: 100 },
      { name: 'Impactrueno', type: 'electric', power: 40, accuracy: 100 }
    ],
    normal: [
      { name: 'Hiperrayo', type: 'normal', power: 150, accuracy: 90 },
      { name: 'Golpe Cuerpo', type: 'normal', power: 85, accuracy: 100 },
      { name: 'Ataque Rápido', type: 'normal', power: 40, accuracy: 100 }
    ]
  };

  constructor(private http: HttpClient) { }

  getOriginalPokemons(): Observable<Pokemon[]> {
    return this.http.get<any>(`${this.apiUrl}?limit=151`).pipe(
      switchMap((response: any) => {
        const detailRequests = response.results.map((p: any) => this.http.get(p.url));
        return forkJoin(detailRequests) as Observable<any[]>;
      }),
      map((details: any[]) => {
        return details.map(data => {
          const type = data.types[0].type.name;
          // Multiplicamos la vida x3 para que la batalla dure más
          const calculatedHp = data.stats[0].base_stat * 3; 
          
          return {
            id: data.id,
            name: data.name,
            image: data.sprites.front_default,
            imageBack: data.sprites.back_default,
            hp: data.stats[0].base_stat,
            maxHp: calculatedHp,
            currentHp: calculatedHp,
            attack: data.stats[1].base_stat,
            defense: data.stats[2].base_stat,
            type: type,
            selected: false,
            moves: this.generateMoves(type)
          };
        });
      })
    );
  }

  private generateMoves(type: string): Move[] {
    const moves: Move[] = [];
    const typeMoves = this.movePool[type] || this.movePool['normal'];
    const normalMoves = this.movePool['normal'];

    // 2 ataques de su tipo + 2 normales
    moves.push(this.getRandomMove(typeMoves));
    moves.push(this.getRandomMove(typeMoves));
    moves.push(this.getRandomMove(normalMoves));
    moves.push(this.getRandomMove(normalMoves));
    return moves;
  }

  private getRandomMove(pool: any[]): Move {
    return pool[Math.floor(Math.random() * pool.length)];
  }
}