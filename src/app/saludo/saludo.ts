import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // 👈 ¡IMPORTACIÓN AÑADIDA!

@Component({
  selector: 'app-saludo',
  standalone: true, 
  imports: [CommonModule], // 👈 ¡AÑADIDO A IMPORTS!
  templateUrl: './saludo.html',
  styleUrl: './saludo.css',
})
export class Saludo {

}