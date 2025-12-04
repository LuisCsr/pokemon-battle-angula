// En src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app'; // 👈 Importa la clase App

bootstrapApplication(App, appConfig) // 👈 Llama a App y la configuración
  .catch((err) => console.error(err));