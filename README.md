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

## IA (Claude)
- **Análisis con IA** (Rutina → Mejorar mi rutina): Claude revisa entrenos, peso, calorías y molestias y propone cambios
  que la persona aplica con un toque. Las propuestas se validan contra el plan real (solo ids de ejercicios existentes).
- **Chat con el entrenador**: preguntas libres con el contexto de la persona.
- Si no hay clave, la app sigue funcionando con el motor de reglas local (`js/coach.js`).

Arquitectura: la app llama a la Edge Function `coach` (`supabase/functions/coach/index.ts`), que exige sesión,
aplica un tope diario por persona (tabla `ai_usage`) y llama a Claude con el SDK oficial. La clave nunca llega al teléfono.

### Activar la IA (una sola vez)
1. Crea una API key en https://console.anthropic.com (y fija un límite de gasto mensual allí).
2. Supabase → proyecto `fitcoach` → Edge Functions → Secrets → añade `ANTHROPIC_API_KEY`.
3. Opcionales: `ANTHROPIC_MODEL` (por defecto `claude-opus-5-5`; `claude-sonnet-5-5` es más barato) y `AI_DAILY_LIMIT` (por defecto 15 consultas/persona/día).

Se envía a Claude un resumen del entrenamiento (sin nombre ni correo).
