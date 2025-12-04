import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private musicPlayer: HTMLAudioElement | null = null;
  private isBrowser: boolean;

  constructor() {
    // Detectamos si estamos en el navegador para evitar errores de SSR
    this.isBrowser = typeof window !== 'undefined' && typeof Audio !== 'undefined';
  }

  playMusic(url: string, volume: number = 0.3) {
    if (!this.isBrowser) return;

    // Si ya está sonando esa misma canción, no la reiniciamos
    if (this.musicPlayer && this.musicPlayer.src.includes(url) && !this.musicPlayer.paused) {
      return;
    }

    this.stopMusic();
    
    this.musicPlayer = new Audio(url);
    this.musicPlayer.loop = true;
    this.musicPlayer.volume = volume;
    this.musicPlayer.play().catch(e => console.warn('Autoplay bloqueado:', e));
  }

  stopMusic() {
    if (this.musicPlayer) {
      this.musicPlayer.pause();
      this.musicPlayer = null;
    }
  }

  playSfx(url: string, volume: number = 0.6) {
    if (!this.isBrowser) return;

    const sfx = new Audio(url);
    sfx.volume = volume;
    sfx.play().catch(() => {}); 
  }
}