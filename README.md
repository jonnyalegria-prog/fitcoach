# FitCoach 💪

App de entrenamiento personalizada para **2 usuarios**, pensada para iPhone (PWA: se instala desde Safari).
Complementa una app de calorías (Fitia): registras peso y calorías del día y la rutina se ajusta.

## Qué hace
- **Evaluación inicial** (meta, experiencia, mini test de fuerza, equipo, días, tiempo, molestias) → rutina a medida.
- **Cada ejercicio explicado**: pasos, consejos, músculos, historial y video de referencia.
- **Entrenamiento guiado**: series con kg/reps, sugerencia de carga, temporizador de descanso, cronómetros, cardio por intervalos.
- **Entrenador adaptativo**: progresión de cargas, detección de estancamiento, semanas de descarga, ajuste según adherencia, esfuerzo, peso y calorías.
- Funciona **sin conexión** y sincroniza al volver la red.

## Estructura
```
index.html · manifest.webmanifest · sw.js
js/exercises.js   biblioteca de ejercicios (español)
js/planner.js     generador de rutinas personalizadas
js/coach.js       progresión y revisión/ajuste del plan
js/api.js         Supabase + caché local + cola offline
js/views/*        pantallas
supabase/schema.sql   esquema, seguridad (RLS) y límite de 2 usuarios
tools/            pruebas (node) y arnés de desarrollo con Supabase simulado
```

## Desarrollo
```bash
python -m http.server 5173
# http://localhost:5173/tools/dev.html  → app con base de datos simulada (sin cuentas)
node tools/test-planner.mjs && node tools/test-coach.mjs && node tools/test-edge.mjs
```

## Despliegue
GitHub Pages (rama `main`, carpeta raíz). Al cambiar archivos, sube `CACHE` en `sw.js`.

## IA
El "entrenador" actual es un motor de reglas local (sin costo). `js/coach.js` está aislado para poder
conectar un modelo (p. ej. Claude vía una Edge Function de Supabase) más adelante.
