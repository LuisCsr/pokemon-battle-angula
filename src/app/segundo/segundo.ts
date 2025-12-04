// src/app/segundo/segundo.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // 👈 Se añade para soportar @if

@Component({
  selector: 'app-segundo',
  standalone: true,
  // 🔽 Importamos CommonModule para las directivas como @if
  imports: [CommonModule], 
  templateUrl: './segundo.html',
  styleUrl: './segundo.css'
})
export class Segundo {
  // Variable para controlar la visibilidad del mensaje.
  mostrarMensaje = false; 

  // Función para alternar el estado
  toggleMensaje() {
    this.mostrarMensaje = !this.mostrarMensaje;
  }
}