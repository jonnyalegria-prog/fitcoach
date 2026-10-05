// Biblioteca de ejercicios. Todo en español.
// equip: equipo requerido (vacío = solo peso corporal). Tokens: dumbbell, band, pullup, bench, kettlebell, barbell, machine
// avoid: lesiones/molestias para las que NO se recomienda (rodilla, espalda_baja, hombro, muñeca, cuello, cadera, tobillo, codo)
// cat: strength | core | cardio | warmup | stretch
// mode: reps | time ; uni: se hace por lado ; up: variante más difícil (progresión)

export const EQUIPMENT = [
  { id: 'dumbbell', label: 'Mancuernas', icon: '🏋️' },
  { id: 'band', label: 'Bandas elásticas', icon: '🎗️' },
  { id: 'bench', label: 'Banco o silla firme', icon: '🪑' },
  { id: 'pullup', label: 'Barra de dominadas', icon: '🧗' },
  { id: 'kettlebell', label: 'Kettlebell (pesa rusa)', icon: '🔔' },
  { id: 'barbell', label: 'Barra con discos', icon: '🏗️' },
  { id: 'machine', label: 'Máquinas / poleas', icon: '⚙️' },
];

export const INJURIES = [
  { id: 'rodilla', label: 'Rodillas' },
  { id: 'espalda_baja', label: 'Espalda baja' },
  { id: 'hombro', label: 'Hombros' },
  { id: 'muñeca', label: 'Muñecas' },
  { id: 'codo', label: 'Codos' },
  { id: 'cadera', label: 'Caderas' },
  { id: 'tobillo', label: 'Tobillos' },
  { id: 'cuello', label: 'Cuello' },
];

export const PATTERN_LABEL = {
  squat: 'Sentadilla', lunge: 'Zancada', hinge: 'Bisagra de cadera', glute: 'Glúteos', hamstring: 'Isquiotibiales',
  calf: 'Pantorrillas', push_h: 'Empuje horizontal', push_v: 'Empuje vertical', fly: 'Pecho (aislamiento)',
  pull_h: 'Remo', pull_v: 'Jalón / dominada', rear_delt: 'Hombro posterior', lat_raise: 'Hombro lateral',
  biceps: 'Bíceps', triceps: 'Tríceps', core: 'Core', cardio: 'Cardio', warmup: 'Calentamiento', stretch: 'Estiramiento',
};

const L = [];
function ex(id, name, pattern, muscles, equip, level, avoid, steps, tips, extra = {}) {
  const cat = pattern === 'core' ? 'core' : pattern === 'cardio' ? 'cardio' : pattern === 'warmup' ? 'warmup' : pattern === 'stretch' ? 'stretch' : 'strength';
  L.push({ id, name, pattern, cat, muscles, equip, level, avoid, steps, tips, mode: 'reps', ...extra });
}

// ───────────────────────── SENTADILLA ─────────────────────────
ex('sentadilla', 'Sentadilla con peso corporal', 'squat', ['Cuádriceps', 'Glúteos'], [], 1, ['rodilla'],
  ['Pies al ancho de los hombros, puntas ligeramente hacia afuera.', 'Brazos al frente para equilibrio. Pecho arriba y espalda recta.', 'Lleva la cadera hacia atrás y abajo como si te sentaras en una silla.', 'Baja hasta donde puedas sin que se redondee la espalda y empuja el suelo para subir.'],
  ['Las rodillas siguen la dirección de los pies (no se juntan hacia adentro).', 'Los talones no se despegan del suelo.'],
  { up: 'sentadilla_salto', reps: [10, 20] });
ex('sentarse_pararse', 'Sentarse y pararse de una silla', 'squat', ['Cuádriceps', 'Glúteos'], [], 1, [],
  ['Siéntate al borde de una silla firme con los pies al ancho de las caderas.', 'Inclina un poco el torso y párate empujando con los talones, sin usar las manos.', 'Baja despacio hasta sentarte (3 segundos), sin dejarte caer.'],
  ['Es una opción amable con las rodillas. Sube la dificultad con una silla más baja.'], { up: 'sentadilla', reps: [8, 15] });
ex('sentadilla_goblet', 'Sentadilla goblet (con mancuerna)', 'squat', ['Cuádriceps', 'Glúteos', 'Core'], ['dumbbell'], 1, ['rodilla'],
  ['Sostén una mancuerna vertical pegada al pecho con ambas manos.', 'Pies al ancho de los hombros, codos apuntando al suelo.', 'Baja controlado, con el pecho alto, hasta que los codos queden entre las rodillas.', 'Sube empujando con todo el pie, sin dejar que el peso te incline hacia adelante.'],
  ['No dejes que el peso te tire hacia adelante: mantén el torso erguido.'],
  { up: 'sentadilla_barra' });
ex('sentadilla_kb', 'Sentadilla goblet con kettlebell', 'squat', ['Cuádriceps', 'Glúteos', 'Core'], ['kettlebell'], 1, ['rodilla'],
  ['Sostén la kettlebell por los "cuernos" (asas) frente al pecho.', 'Pies al ancho de los hombros, mirada al frente.', 'Baja con la espalda recta hasta que los muslos queden paralelos al suelo o más abajo.', 'Sube empujando el suelo y aprieta glúteos arriba.'],
  ['Mantén los codos adentro y el pecho alto.']);
ex('sentadilla_barra', 'Sentadilla con barra', 'squat', ['Cuádriceps', 'Glúteos', 'Core'], ['barbell'], 3, ['rodilla', 'espalda_baja'],
  ['Barra apoyada en la parte alta de la espalda (no sobre el cuello). Aprieta los omóplatos.', 'Pies al ancho de los hombros. Respira hondo y activa el abdomen.', 'Baja con control hasta que los muslos queden paralelos o más abajo.', 'Sube empujando el suelo manteniendo el torso firme.'],
  ['Usa un rack con seguros o un compañero. Empieza con poco peso para dominar la técnica.', 'No redondees la zona lumbar al bajar.']);
ex('prensa_pierna', 'Prensa de piernas', 'squat', ['Cuádriceps', 'Glúteos'], ['machine'], 1, ['rodilla'],
  ['Siéntate con la espalda y la cadera bien apoyadas en el respaldo.', 'Pies en la plataforma al ancho de los hombros.', 'Baja la plataforma controlado hasta unos 90° de rodilla.', 'Empuja sin bloquear las rodillas al estirar.'],
  ['No despegues la cadera del asiento al bajar.', 'No estires las rodillas por completo arriba.']);
ex('sentadilla_pared', 'Sentadilla isométrica en pared', 'squat', ['Cuádriceps', 'Glúteos'], [], 1, [],
  ['Apoya la espalda en la pared y baja hasta que muslos y suelo queden paralelos (o menos si te cuesta).', 'Rodillas sobre los tobillos, pies al ancho de las caderas.', 'Mantén la posición respirando con calma.'],
  ['Si te arde mucho, sube un poco. Es normal sentir quemazón en los muslos.'],
  { mode: 'time', time: [20, 45] });
ex('sentadilla_bulgara', 'Sentadilla búlgara', 'lunge', ['Cuádriceps', 'Glúteos'], ['bench'], 2, ['rodilla', 'cadera'],
  ['Apoya el empeine de un pie atrás sobre un banco o silla firme.', 'Da un paso largo al frente con la otra pierna.', 'Baja con el torso erguido hasta que el muslo delantero quede paralelo.', 'Sube empujando con el talón de la pierna de adelante. Termina todas las repeticiones y cambia de lado.'],
  ['Si te desequilibras, acerca o aleja el pie delantero hasta encontrar tu punto.', 'Para más dificultad, sostén mancuernas a los lados.'],
  { uni: true });
ex('sentadilla_salto', 'Sentadilla con salto', 'squat', ['Cuádriceps', 'Glúteos', 'Cardio'], [], 2, ['rodilla', 'tobillo', 'cadera'],
  ['Colócate como en una sentadilla normal.', 'Baja y salta hacia arriba explosivamente, estirando el cuerpo.', 'Aterriza suave, con las rodillas flexionadas, y encadena la siguiente.'],
  ['Aterriza en silencio: eso protege las articulaciones.'], { reps: [8, 15] });

// ───────────────────────── ZANCADAS ─────────────────────────
ex('zancada_atras', 'Zancada hacia atrás', 'lunge', ['Cuádriceps', 'Glúteos'], [], 1, ['rodilla'],
  ['De pie, pies juntos y manos en la cadera.', 'Da un paso largo hacia atrás y baja hasta que ambas rodillas formen ~90°.', 'Empuja con el pie delantero para volver al inicio.', 'Alterna las piernas.'],
  ['Torso erguido y mirada al frente.', 'La rodilla de adelante no se desplaza hacia adentro.'],
  { uni: true, up: 'zancada_caminando' });
ex('zancada_caminando', 'Zancadas caminando con mancuernas', 'lunge', ['Cuádriceps', 'Glúteos'], ['dumbbell'], 2, ['rodilla', 'tobillo'],
  ['Sostén una mancuerna en cada mano a los costados.', 'Da un paso largo al frente y baja hasta que ambas rodillas formen ~90°.', 'Empuja con la pierna de adelante y da el siguiente paso con la otra.'],
  ['Pasos largos y controlados; no te apresures.'], { uni: true });
ex('step_up', 'Subida al banco (step-up)', 'lunge', ['Cuádriceps', 'Glúteos'], ['bench'], 1, ['rodilla'],
  ['Pon un pie completo sobre un banco o silla firme (altura de rodilla o menos).', 'Empuja con la pierna de arriba hasta quedar de pie sobre el banco.', 'Baja controlado. Completa todas las repeticiones y cambia de pierna.'],
  ['Empuja con la pierna de arriba, no te impulses con la de abajo.', 'Puedes sostener mancuernas para más carga.'], { uni: true });

// ───────────────────────── BISAGRA / GLÚTEO / ISQUIOS ─────────────────────────
ex('puente_gluteo', 'Puente de glúteos', 'glute', ['Glúteos', 'Isquiotibiales'], [], 1, [],
  ['Acuéstate boca arriba con las rodillas dobladas y los pies apoyados cerca de los glúteos.', 'Aprieta el abdomen y empuja con los talones.', 'Sube la cadera hasta formar una línea recta de hombros a rodillas y aprieta glúteos 1 segundo.', 'Baja despacio.'],
  ['No arquees la espalda baja arriba: la fuerza debe venir de los glúteos.'],
  { up: 'puente_una_pierna', reps: [12, 20] });
ex('puente_una_pierna', 'Puente de glúteos a una pierna', 'glute', ['Glúteos', 'Isquiotibiales'], [], 2, [],
  ['Acostado, estira una pierna al aire y apoya la otra con la rodilla doblada.', 'Empuja con el talón y sube la cadera a nivel.', 'Mantén la pelvis nivelada y baja controlado. Cambia de lado.'],
  ['Si sientes el isquio acalambrarse, acerca el pie a los glúteos.'], { uni: true });
ex('hip_thrust', 'Hip thrust (empuje de cadera)', 'glute', ['Glúteos', 'Isquiotibiales'], ['bench', 'dumbbell'], 2, [],
  ['Apoya la parte alta de la espalda en el borde de un banco. Coloca una mancuerna sobre tu cadera.', 'Pies al ancho de la cadera y rodillas dobladas ~90° arriba.', 'Sube la cadera apretando glúteos hasta que el torso quede paralelo al suelo.', 'Baja controlado sin apoyar del todo.'],
  ['Mentón hacia el pecho y costillas hacia abajo: evita arquear la espalda.']);
ex('patada_gluteo', 'Patada de glúteo en cuadrupedia', 'glute', ['Glúteos'], [], 1, ['muñeca'],
  ['Apóyate en manos y rodillas con la espalda neutra.', 'Con la rodilla doblada a 90°, empuja el talón hacia el techo.', 'Aprieta el glúteo arriba y baja sin tocar el suelo.'],
  ['No gires la cadera ni arquees la espalda baja.'], { uni: true, reps: [12, 20] });
ex('peso_muerto_rumano', 'Peso muerto rumano con mancuernas', 'hinge', ['Isquiotibiales', 'Glúteos', 'Espalda baja'], ['dumbbell'], 2, ['espalda_baja'],
  ['De pie con una mancuerna en cada mano, rodillas ligeramente flexionadas.', 'Empuja la cadera hacia atrás y baja las mancuernas pegadas a las piernas.', 'Baja hasta sentir el estiramiento en la parte trasera de los muslos (espalda siempre recta).', 'Aprieta glúteos para volver arriba.'],
  ['El movimiento es de cadera, no de espalda: no te "dobles" desde la cintura.', 'Mira unos metros al frente en el suelo, cuello neutro.']);
ex('peso_muerto_kb', 'Peso muerto con kettlebell', 'hinge', ['Glúteos', 'Isquiotibiales', 'Espalda baja'], ['kettlebell'], 1, ['espalda_baja'],
  ['Kettlebell en el suelo entre tus pies. Pies al ancho de las caderas.', 'Lleva la cadera atrás, espalda recta, y agarra las asas.', 'Empuja el suelo con los pies y estira la cadera para ponerte de pie.', 'Baja con control llevando la cadera atrás.'],
  ['Espalda recta de principio a fin. Si se redondea, usa menos peso.']);
ex('peso_muerto_barra', 'Peso muerto con barra', 'hinge', ['Glúteos', 'Isquiotibiales', 'Espalda'], ['barbell'], 3, ['espalda_baja'],
  ['Barra sobre la mitad de tus pies. Agárrala justo fuera de las piernas.', 'Pecho alto, espalda neutra, abdomen firme.', 'Empuja el suelo con los pies y mantén la barra pegada al cuerpo.', 'Termina de pie, apretando glúteos. Baja la barra con el mismo recorrido.'],
  ['Empieza con peso muy ligero para aprender la técnica.', 'Nunca redondees la espalda.']);
ex('peso_muerto_una_pierna', 'Peso muerto a una pierna', 'hinge', ['Glúteos', 'Isquiotibiales', 'Core'], ['dumbbell'], 2, ['espalda_baja', 'tobillo'],
  ['Una mancuerna en la mano contraria a la pierna de apoyo.', 'Inclina el torso hacia adelante llevando la otra pierna atrás, con la espalda recta.', 'Baja hasta sentir estirar el isquio y vuelve apretando el glúteo.'],
  ['Apóyate de una pared o silla con la mano libre si necesitas equilibrio.'], { uni: true });
ex('kb_swing', 'Swing con kettlebell', 'hinge', ['Glúteos', 'Isquiotibiales', 'Cardio'], ['kettlebell'], 2, ['espalda_baja'],
  ['Pies algo más anchos que los hombros, kettlebell frente a ti.', 'Inclina la cadera atrás y balancea la pesa entre las piernas.', 'Estira la cadera con fuerza: la pesa sube sola hasta el pecho (los brazos solo guían).', 'Deja caer la pesa y repite el golpe de cadera.'],
  ['Es una bisagra de cadera, no una sentadilla ni una elevación con los brazos.'], { reps: [10, 20] });
ex('curl_femoral', 'Curl femoral en máquina', 'hamstring', ['Isquiotibiales'], ['machine'], 1, [],
  ['Ajusta la máquina para que el rodillo quede sobre los tobillos.', 'Flexiona las rodillas llevando los talones hacia los glúteos.', 'Mantén 1 segundo y vuelve despacio.'],
  ['Evita levantar la cadera del asiento.']);
ex('curl_femoral_suelo', 'Curl de isquios con toalla', 'hamstring', ['Isquiotibiales', 'Glúteos'], [], 2, [],
  ['Acostado boca arriba, talones sobre una toalla en un suelo liso, cadera elevada.', 'Desliza los talones alejándolos del cuerpo y luego tráelos de vuelta.', 'Mantén la cadera arriba todo el tiempo.'],
  ['Hazlo lento: el control es lo que trabaja el músculo.'], { reps: [6, 12] });

// ───────────────────────── PANTORRILLAS ─────────────────────────
ex('elevacion_talones', 'Elevación de talones', 'calf', ['Pantorrillas'], [], 1, ['tobillo'],
  ['De pie, apoyándote de una pared si lo necesitas.', 'Sube lo más alto posible sobre las puntas de los pies.', 'Mantén 1 segundo arriba y baja despacio.'],
  ['Para más dificultad, hazlo a una pierna o con mancuernas.'], { reps: [12, 25] });

// ───────────────────────── EMPUJE HORIZONTAL ─────────────────────────
ex('flexiones_inclinadas', 'Flexiones inclinadas (manos elevadas)', 'push_h', ['Pecho', 'Tríceps', 'Hombros'], ['bench'], 1, ['muñeca'],
  ['Apoya las manos en un banco o mesa estable, algo más anchas que los hombros.', 'Cuerpo en línea recta de cabeza a talones.', 'Baja el pecho hasta casi tocar el borde.', 'Empuja hasta estirar los brazos.'],
  ['Cuanto más alto el apoyo, más fácil. Baja la altura con el tiempo.'], { up: 'flexiones' });
ex('flexiones_rodillas', 'Flexiones con rodillas apoyadas', 'push_h', ['Pecho', 'Tríceps', 'Hombros'], [], 1, ['muñeca'],
  ['Manos en el suelo algo más anchas que los hombros, rodillas apoyadas.', 'Cuerpo recto de rodillas a cabeza, abdomen firme.', 'Baja el pecho hasta casi tocar el suelo con los codos a ~45° del cuerpo.', 'Empuja hasta estirar los brazos.'],
  ['No dejes caer la cadera ni la saques hacia arriba.'], { up: 'flexiones' });
ex('flexiones', 'Flexiones de brazos', 'push_h', ['Pecho', 'Tríceps', 'Hombros', 'Core'], [], 2, ['muñeca', 'hombro'],
  ['Manos en el suelo algo más anchas que los hombros, cuerpo en plancha.', 'Baja el pecho hasta casi tocar el suelo con los codos a ~45°.', 'Empuja el suelo hasta estirar los brazos.'],
  ['Abdomen y glúteos apretados: el cuerpo es una tabla.', 'Si no puedes hacer 5 buenas, vuelve a las inclinadas o de rodillas.'],
  { up: 'flexiones_diamante' });
ex('flexiones_diamante', 'Flexiones diamante', 'push_h', ['Tríceps', 'Pecho'], [], 3, ['muñeca', 'codo', 'hombro'],
  ['Forma un diamante con las manos juntas bajo el pecho.', 'Baja el pecho hacia las manos con los codos pegados al cuerpo.', 'Empuja hasta estirar los brazos.'],
  ['Si molesta el codo, vuelve a flexiones normales.']);
ex('press_suelo', 'Press de pecho en el suelo con mancuernas', 'push_h', ['Pecho', 'Tríceps', 'Hombros'], ['dumbbell'], 1, ['hombro'],
  ['Acuéstate boca arriba con las rodillas dobladas y una mancuerna en cada mano.', 'Codos a ~45° del cuerpo; baja hasta que los codos toquen el suelo.', 'Empuja las mancuernas hacia arriba hasta estirar los brazos.'],
  ['Es ideal si no tienes banco: el suelo protege tus hombros.']);
ex('press_banca_mancuernas', 'Press de banca con mancuernas', 'push_h', ['Pecho', 'Tríceps', 'Hombros'], ['dumbbell', 'bench'], 1, ['hombro'],
  ['Acuéstate en el banco con una mancuerna en cada mano a la altura del pecho.', 'Empuja hacia arriba hasta estirar los brazos sin chocar las mancuernas.', 'Baja controlado hasta sentir un estiramiento suave en el pecho.'],
  ['Pies firmes en el suelo, omóplatos juntos y abajo.', 'Codos a ~45°, no abiertos a 90°.'], { up: 'press_banca_barra' });
ex('press_banca_barra', 'Press de banca con barra', 'push_h', ['Pecho', 'Tríceps', 'Hombros'], ['barbell', 'bench'], 3, ['hombro', 'muñeca'],
  ['Acostado, ojos bajo la barra, omóplatos juntos y pies firmes.', 'Agarre un poco más ancho que los hombros. Baja la barra hasta rozar el pecho.', 'Empuja hacia arriba en línea ligeramente curva hasta estirar los brazos.'],
  ['Usa seguros o un compañero que te asista.']);
ex('press_pecho_maquina', 'Press de pecho en máquina', 'push_h', ['Pecho', 'Tríceps'], ['machine'], 1, ['hombro'],
  ['Ajusta el asiento para que las asas queden a la altura del pecho.', 'Empuja hasta estirar los brazos sin bloquear los codos.', 'Vuelve despacio.'],
  ['Mantén la espalda pegada al respaldo.']);
ex('press_pecho_banda', 'Press de pecho con banda', 'push_h', ['Pecho', 'Tríceps'], ['band'], 1, ['hombro'],
  ['Pasa la banda por la espalda, sujeta cada extremo con una mano a la altura del pecho.', 'Empuja hacia adelante hasta estirar los brazos.', 'Regresa controlado.'],
  ['Da un paso al frente para que la banda tenga tensión desde el inicio.']);
ex('aperturas_mancuernas', 'Aperturas con mancuernas', 'fly', ['Pecho'], ['dumbbell', 'bench'], 2, ['hombro'],
  ['Acostado, mancuernas sobre el pecho con codos ligeramente flexionados.', 'Abre los brazos en arco hasta sentir estiramiento en el pecho.', 'Cierra el arco como si abrazaras un árbol.'],
  ['Usa poco peso y no bajes los brazos más allá del nivel del pecho.']);

// ───────────────────────── EMPUJE VERTICAL / HOMBROS ─────────────────────────
ex('press_hombro_mancuernas', 'Press de hombros con mancuernas', 'push_v', ['Hombros', 'Tríceps'], ['dumbbell'], 1, ['hombro', 'cuello'],
  ['Sentado o de pie, mancuernas a la altura de los hombros con las palmas al frente.', 'Empuja hacia arriba hasta estirar los brazos sin arquear la espalda.', 'Baja controlado hasta las orejas.'],
  ['Abdomen firme: no arquees la zona lumbar.'], { up: 'press_militar' });
ex('press_militar', 'Press militar con barra', 'push_v', ['Hombros', 'Tríceps', 'Core'], ['barbell'], 3, ['hombro', 'espalda_baja'],
  ['De pie con la barra a la altura de la clavícula, agarre ancho como los hombros.', 'Empuja la barra sobre la cabeza moviendo ligeramente la cara hacia atrás.', 'Baja con control hasta la clavícula.'],
  ['Aprieta glúteos y abdomen para no arquear la espalda.']);
ex('press_hombro_maquina', 'Press de hombros en máquina', 'push_v', ['Hombros', 'Tríceps'], ['machine'], 1, ['hombro'],
  ['Ajusta el asiento para que las asas queden a la altura de los hombros.', 'Empuja hacia arriba hasta estirar los brazos.', 'Baja despacio.'],
  ['No encojas los hombros hacia las orejas.']);
ex('press_hombro_banda', 'Press de hombros con banda', 'push_v', ['Hombros', 'Tríceps'], ['band'], 1, ['hombro'],
  ['Pisa la banda con ambos pies y sujeta los extremos a la altura de los hombros.', 'Empuja hacia arriba hasta estirar los brazos.', 'Baja controlado.'],
  ['Mantén el abdomen firme para no arquear la espalda.']);
ex('pike_pushup', 'Flexiones en pica', 'push_v', ['Hombros', 'Tríceps'], [], 2, ['hombro', 'muñeca', 'cuello'],
  ['Forma una "V" invertida: manos en el suelo, cadera alta y piernas casi rectas.', 'Flexiona los codos y baja la cabeza hacia el suelo, entre las manos.', 'Empuja hasta volver arriba.'],
  ['Cuanto más cerca de la pared acerques los pies, más difícil.'], { reps: [6, 12] });
ex('elevaciones_laterales', 'Elevaciones laterales', 'lat_raise', ['Hombros'], ['dumbbell'], 1, ['hombro'],
  ['De pie con una mancuerna ligera en cada mano a los costados, codos levemente doblados.', 'Eleva los brazos hacia los lados hasta la altura de los hombros.', 'Baja lento, sin balanceos.'],
  ['Usa poco peso: aquí manda la técnica. No subas los hombros hacia las orejas.'], { reps: [12, 20] });
ex('elevaciones_laterales_banda', 'Elevaciones laterales con banda', 'lat_raise', ['Hombros'], ['band'], 1, ['hombro'],
  ['Pisa la banda y sujeta los extremos a los costados.', 'Eleva los brazos hacia los lados hasta la altura de los hombros.', 'Baja controlado.'],
  ['Mueve solo los brazos, sin impulso del tronco.'], { reps: [12, 20] });

// ───────────────────────── REMOS (TIRÓN HORIZONTAL) ─────────────────────────
ex('remo_mancuerna', 'Remo con mancuerna a un brazo', 'pull_h', ['Espalda', 'Bíceps'], ['dumbbell'], 1, ['espalda_baja'],
  ['Apoya una mano y una rodilla en un banco o silla; la otra mano sostiene la mancuerna.', 'Espalda paralela al suelo y neutra.', 'Lleva el codo hacia la cadera, apretando el omóplato.', 'Baja controlado hasta estirar el brazo.'],
  ['No gires el torso: solo se mueve el brazo.'], { uni: true });
ex('remo_inclinado_mancuernas', 'Remo inclinado con mancuernas', 'pull_h', ['Espalda', 'Bíceps'], ['dumbbell'], 2, ['espalda_baja'],
  ['Inclina el torso ~45° con la espalda recta y una mancuerna en cada mano.', 'Lleva los codos hacia atrás apretando los omóplatos.', 'Baja controlado.'],
  ['Si sientes la espalda baja, usa el remo apoyado en banco.']);
ex('remo_apoyado_pecho', 'Remo con pecho apoyado', 'pull_h', ['Espalda', 'Bíceps'], ['dumbbell', 'bench'], 1, [],
  ['Acuéstate boca abajo en un banco inclinado con una mancuerna en cada mano.', 'Lleva los codos hacia atrás apretando los omóplatos.', 'Baja controlado.'],
  ['Es la opción más amable con la espalda baja.']);
ex('remo_barra', 'Remo con barra', 'pull_h', ['Espalda', 'Bíceps'], ['barbell'], 3, ['espalda_baja'],
  ['Inclina el torso ~45° con la espalda recta y la barra colgando.', 'Lleva la barra hacia el abdomen apretando los omóplatos.', 'Baja controlado.'],
  ['Evita impulsarte con el cuerpo.']);
ex('elevaciones_yt', 'Elevaciones en Y y T boca abajo', 'pull_h', ['Espalda', 'Hombros'], [], 1, ['espalda_baja', 'cuello'],
  ['Acuéstate boca abajo con la frente apoyada y los brazos estirados al frente formando una "Y".', 'Eleva los brazos del suelo apretando los omóplatos y mantén 2 segundos.', 'Baja y repite abriendo los brazos en "T" a los lados.'],
  ['Pulgares hacia el techo y cuello relajado. Los movimientos son pequeños y controlados.'], { reps: [8, 14] });
ex('remo_invertido', 'Remo invertido bajo una mesa', 'pull_h', ['Espalda', 'Bíceps'], [], 2, ['hombro'],
  ['Acuéstate bajo una mesa MUY resistente y estable y agarra el borde con las manos.', 'Cuerpo recto, talones en el suelo. Tira del pecho hacia el borde de la mesa.', 'Baja controlado hasta estirar los brazos.'],
  ['Asegúrate de que la mesa no se mueva ni se vuelque. Si dudas, elige otro ejercicio.'], { reps: [6, 12] });
ex('remo_banda','Remo con banda elástica', 'pull_h', ['Espalda', 'Bíceps'], ['band'], 1, [],
  ['Sentado con las piernas estiradas y la banda pasando por los pies.', 'Con la espalda recta, tira de los extremos hacia el abdomen.', 'Aprieta omóplatos 1 segundo y vuelve controlado.'],
  ['Pecho alto, sin encorvar la espalda.']);
ex('remo_polea', 'Remo en polea baja', 'pull_h', ['Espalda', 'Bíceps'], ['machine'], 1, [],
  ['Siéntate con los pies en la plataforma y rodillas ligeramente flexionadas.', 'Tira del agarre hacia el abdomen con la espalda recta.', 'Aprieta omóplatos y vuelve controlado.'],
  ['No te balancees hacia atrás para dar impulso.']);
ex('pajaro', 'Pájaro (vuelos posteriores)', 'rear_delt', ['Hombros', 'Espalda'], ['dumbbell'], 1, [],
  ['Inclina el torso con la espalda recta y las mancuernas colgando bajo el pecho.', 'Abre los brazos hacia los lados con los codos ligeramente doblados.', 'Baja controlado.'],
  ['Usa muy poco peso. Imagina juntar los omóplatos.'], { reps: [12, 20] });
ex('face_pull_banda', 'Face pull con banda', 'rear_delt', ['Hombros', 'Espalda'], ['band'], 1, [],
  ['Ancla la banda a la altura de la cara y sujeta los extremos.', 'Tira hacia tu cara abriendo los codos hacia los lados.', 'Aprieta omóplatos y vuelve controlado.'],
  ['Excelente para la postura de hombros.'], { reps: [12, 20] });
ex('superman', 'Superman', 'rear_delt', ['Espalda baja', 'Glúteos', 'Espalda'], [], 1, ['espalda_baja', 'cuello'],
  ['Boca abajo con los brazos estirados al frente.', 'Eleva a la vez brazos, pecho y piernas del suelo.', 'Mantén 2 segundos y baja despacio.'],
  ['Mirada al suelo, no levantes el cuello.'], { reps: [10, 15] });

// ───────────────────────── JALONES / DOMINADAS ─────────────────────────
ex('colgado_barra', 'Colgarse de la barra', 'pull_v', ['Espalda', 'Antebrazos', 'Hombros'], ['pullup'], 1, ['hombro'],
  ['Agarra la barra con las palmas al frente, algo más ancho que los hombros.', 'Cuélgate con los brazos estirados y los hombros activos (lejos de las orejas).', 'Mantén la posición.'],
  ['Es la base para lograr tu primera dominada.'], { mode: 'time', time: [15, 40], up: 'dominadas_asistidas' });
ex('dominadas_asistidas', 'Dominadas asistidas con banda', 'pull_v', ['Espalda', 'Bíceps'], ['pullup', 'band'], 2, ['hombro', 'codo'],
  ['Pasa una banda por la barra y apoya un pie o rodilla en ella.', 'Tira de tu cuerpo hacia arriba llevando el pecho a la barra.', 'Baja con control hasta estirar los brazos.'],
  ['Cuanto más gruesa la banda, más ayuda. Ve usando bandas más finas.'], { up: 'dominadas' });
ex('dominadas', 'Dominadas', 'pull_v', ['Espalda', 'Bíceps'], ['pullup'], 3, ['hombro', 'codo'],
  ['Cuélgate con las palmas al frente, algo más anchas que los hombros.', 'Tira llevando el pecho a la barra y los codos hacia las costillas.', 'Baja controlado hasta estirar los brazos.'],
  ['Evita balancearte. Calidad antes que cantidad.'], { reps: [3, 10] });
ex('jalon_pecho', 'Jalón al pecho en polea', 'pull_v', ['Espalda', 'Bíceps'], ['machine'], 1, [],
  ['Siéntate bien fijo bajo el soporte de las piernas y agarra la barra ancha.', 'Tira de la barra hacia la parte alta del pecho, inclinándote un poco hacia atrás.', 'Sube controlado hasta estirar los brazos.'],
  ['Imagina llevar los codos hacia los bolsillos, no jalar con las manos.']);
ex('jalon_banda', 'Jalón con banda elástica', 'pull_v', ['Espalda', 'Bíceps'], ['band', 'pullup'], 1, [],
  ['Ata la banda a la barra o a un punto alto firme y arrodíllate.', 'Tira de los extremos hacia el pecho llevando los codos hacia abajo.', 'Sube controlado.'],
  ['Asegura bien el anclaje antes de tirar.']);

// ───────────────────────── BÍCEPS ─────────────────────────
ex('curl_biceps', 'Curl de bíceps con mancuernas', 'biceps', ['Bíceps'], ['dumbbell'], 1, ['codo'],
  ['De pie con una mancuerna en cada mano, palmas al frente.', 'Flexiona los codos llevando las mancuernas hacia los hombros.', 'Baja lento hasta estirar los brazos.'],
  ['Codos pegados al cuerpo y sin balancear el torso.'], { reps: [8, 15] });
ex('curl_martillo', 'Curl martillo', 'biceps', ['Bíceps', 'Antebrazos'], ['dumbbell'], 1, ['codo'],
  ['De pie con las mancuernas con las palmas mirándose entre sí.', 'Flexiona los codos subiendo las mancuernas.', 'Baja lento.'],
  ['Mantén las muñecas rectas.'], { reps: [8, 15] });
ex('curl_banda', 'Curl de bíceps con banda', 'biceps', ['Bíceps'], ['band'], 1, ['codo'],
  ['Pisa la banda y sujeta los extremos con las palmas al frente.', 'Flexiona los codos llevando las manos a los hombros.', 'Baja controlado.'],
  ['Codos fijos junto al cuerpo.'], { reps: [10, 15] });
ex('curl_polea', 'Curl de bíceps en polea', 'biceps', ['Bíceps'], ['machine'], 1, ['codo'],
  ['De pie frente a la polea baja con el agarre recto o con barra Z.', 'Flexiona los codos subiendo el agarre hacia los hombros.', 'Baja lento.'],
  ['No balancees el cuerpo.'], { reps: [8, 15] });

// ───────────────────────── TRÍCEPS ─────────────────────────
ex('flexiones_triceps', 'Flexiones con manos juntas (rodillas)', 'triceps', ['Tríceps', 'Pecho'], [], 1, ['muñeca', 'codo'],
  ['Apoya las rodillas y coloca las manos bajo el pecho, casi juntas.', 'Baja el pecho con los codos pegados al cuerpo.', 'Empuja hasta estirar los brazos.'],
  ['Si te molestan las muñecas, usa puños o elige otro ejercicio.'], { reps: [6, 12] });
ex('fondos_banco', 'Fondos de tríceps en banco', 'triceps', ['Tríceps', 'Hombros'], ['bench'], 1, ['hombro', 'muñeca', 'codo'],
  ['Apoya las manos en el borde de un banco o silla firme, piernas estiradas o dobladas.', 'Baja flexionando los codos hacia atrás hasta ~90°.', 'Empuja hasta estirar los brazos.'],
  ['Espalda cerca del banco. Si te molesta el hombro, cambia de ejercicio.'], { reps: [8, 15] });
ex('extension_triceps', 'Extensión de tríceps sobre la cabeza', 'triceps', ['Tríceps'], ['dumbbell'], 1, ['codo', 'hombro'],
  ['Sostén una mancuerna con ambas manos sobre la cabeza.', 'Dobla los codos llevando la mancuerna detrás de la nuca.', 'Estira los brazos hasta arriba.'],
  ['Codos apuntando al techo, sin abrirlos.'], { reps: [10, 15] });
ex('patada_triceps', 'Patada de tríceps', 'triceps', ['Tríceps'], ['dumbbell'], 1, ['codo'],
  ['Inclina el torso con la espalda recta y el codo pegado al costado, mancuerna en la mano.', 'Estira el brazo hacia atrás hasta que quede recto.', 'Vuelve controlado.'],
  ['Solo se mueve el antebrazo.'], { uni: true, reps: [10, 15] });
ex('triceps_polea', 'Extensión de tríceps en polea', 'triceps', ['Tríceps'], ['machine'], 1, ['codo'],
  ['De pie frente a la polea alta con el agarre en las manos y codos pegados.', 'Empuja hacia abajo hasta estirar los brazos.', 'Sube controlado hasta ~90°.'],
  ['Los codos no se mueven del costado.'], { reps: [10, 15] });
ex('triceps_banda', 'Extensión de tríceps con banda', 'triceps', ['Tríceps'], ['band', 'pullup'], 1, ['codo'],
  ['Ata la banda en lo alto y sujeta los extremos con los codos pegados al cuerpo.', 'Estira los brazos hacia abajo.', 'Vuelve controlado.'],
  ['Asegura bien el anclaje.'], { reps: [10, 15] });

// ───────────────────────── CORE ─────────────────────────
ex('plancha', 'Plancha', 'core', ['Core'], [], 1, ['muñeca', 'hombro'],
  ['Apoya antebrazos y puntas de los pies; codos bajo los hombros.', 'Cuerpo en línea recta de cabeza a talones.', 'Aprieta abdomen y glúteos y respira con calma.'],
  ['No dejes caer la cadera ni la subas. Si duele la espalda baja, reduce el tiempo.'],
  { mode: 'time', time: [20, 60], up: 'plancha_lateral' });
ex('plancha_lateral', 'Plancha lateral', 'core', ['Core', 'Oblicuos'], [], 2, ['hombro', 'muñeca'],
  ['De lado, apoya el antebrazo bajo el hombro y los pies uno sobre otro.', 'Eleva la cadera hasta formar una línea recta.', 'Mantén. Repite del otro lado.'],
  ['Si es muy difícil, apoya la rodilla de abajo.'], { mode: 'time', time: [15, 40], uni: true });
ex('bicho_muerto', 'Bicho muerto (dead bug)', 'core', ['Core'], [], 1, [],
  ['Acostado boca arriba, brazos al techo y rodillas a 90° sobre la cadera.', 'Baja un brazo y la pierna contraria hacia el suelo sin que se arquee la espalda baja.', 'Vuelve y alterna.'],
  ['Espalda baja pegada al suelo todo el tiempo. Muévete despacio.'], { reps: [8, 16] });
ex('bird_dog', 'Bird dog (perro de caza)', 'core', ['Core', 'Espalda baja', 'Glúteos'], [], 1, ['muñeca'],
  ['En cuadrupedia con la espalda neutra.', 'Estira un brazo al frente y la pierna contraria hacia atrás.', 'Mantén 2 segundos sin rotar la cadera y alterna.'],
  ['Imagina llevar un vaso de agua sobre la espalda baja.'], { reps: [8, 16] });
ex('crunch', 'Crunch abdominal', 'core', ['Abdomen'], [], 1, ['cuello'],
  ['Acostado con las rodillas dobladas y las manos junto a las sienes.', 'Despega los hombros del suelo contrayendo el abdomen.', 'Baja controlado.'],
  ['No jales del cuello. La mirada va hacia el techo.'], { reps: [12, 25] });
ex('crunch_inverso', 'Crunch inverso', 'core', ['Abdomen'], [], 2, ['cuello'],
  ['Acostado con las piernas dobladas a 90° y las manos a los lados.', 'Lleva las rodillas al pecho elevando la cadera unos centímetros.', 'Baja lento sin soltar el abdomen.'],
  ['Evita balancear las piernas con impulso.'], { reps: [10, 20] });
ex('elevacion_piernas', 'Elevación de piernas tumbado', 'core', ['Abdomen'], [], 2, ['espalda_baja'],
  ['Acostado con las piernas estiradas y las manos bajo los glúteos.', 'Sube las piernas juntas hasta 90°.', 'Baja despacio sin tocar el suelo.'],
  ['Si se arquea la espalda baja, dobla un poco las rodillas.'], { reps: [8, 15] });
ex('mountain_climbers', 'Escaladores (mountain climbers)', 'core', ['Core', 'Cardio'], [], 2, ['muñeca', 'hombro'],
  ['En posición de flexión con los brazos estirados.', 'Lleva una rodilla al pecho y cambia rápido de pierna.', 'Mantén la cadera baja y el abdomen firme.'],
  ['Ritmo constante, sin rebotar la cadera.'], { mode: 'time', time: [20, 40] });
ex('giro_ruso', 'Giro ruso (russian twist)', 'core', ['Oblicuos', 'Abdomen'], [], 2, ['espalda_baja'],
  ['Sentado con las rodillas dobladas y el torso inclinado hacia atrás.', 'Junta las manos (o sostén una mancuerna) y gira el torso a un lado y luego al otro.', 'Mantén el pecho alto.'],
  ['Los pies pueden apoyarse en el suelo si es muy difícil.'], { reps: [12, 24] });
ex('pallof_press', 'Pallof press con banda', 'core', ['Core', 'Oblicuos'], ['band'], 2, [],
  ['Ancla la banda a un punto firme a la altura del pecho y colócate de lado.', 'Sostén la banda al pecho y empuja los brazos al frente sin que el tronco rote.', 'Vuelve controlado. Repite del otro lado.'],
  ['Es antirrotación: lo difícil es no girar.'], { uni: true, reps: [8, 12] });
ex('rodillas_barra', 'Elevación de rodillas colgado', 'core', ['Abdomen', 'Antebrazos'], ['pullup'], 2, ['hombro'],
  ['Cuélgate de la barra con los hombros activos.', 'Sube las rodillas hacia el pecho enrollando la pelvis.', 'Baja controlado sin balancearte.'],
  ['Evita el vaivén: usa el abdomen, no el impulso.'], { reps: [6, 15] });

// ───────────────────────── CARDIO ─────────────────────────
ex('caminata_rapida', 'Caminata rápida', 'cardio', ['Cardio'], [], 1, [],
  ['Camina a paso ligero: debes poder hablar pero no cantar.', 'Brazos relajados y balanceando, mirada al frente.', 'Mantén el ritmo constante.'],
  ['Si tienes una cuesta cerca, úsala para subir la intensidad.'], { mode: 'time', time: [300, 1800], met: 4.3 });
ex('trote', 'Trote suave', 'cardio', ['Cardio'], [], 2, ['rodilla', 'tobillo', 'cadera'],
  ['Trota a ritmo en el que puedas conversar.', 'Pasos cortos y livianos, aterrizando bajo tu cuerpo.', 'Mantén el ritmo constante.'],
  ['Calzado adecuado y progresión gradual en tiempo.'], { mode: 'time', time: [300, 1800], met: 7 });
ex('jumping_jacks', 'Jumping jacks', 'cardio', ['Cardio'], [], 1, ['rodilla', 'tobillo'],
  ['Pies juntos y brazos a los lados.', 'Salta abriendo piernas y subiendo los brazos sobre la cabeza.', 'Vuelve saltando a la posición inicial.'],
  ['Aterriza suave. Si prefieres bajo impacto, da pasos laterales en vez de saltar.'], { mode: 'time', time: [30, 60], met: 8 });
ex('rodillas_altas', 'Rodillas altas en el lugar', 'cardio', ['Cardio', 'Cuádriceps'], [], 1, ['rodilla'],
  ['De pie, trota en el lugar llevando las rodillas hacia el pecho.', 'Brazos coordinados con las piernas.', 'Mantén un ritmo rápido y constante.'],
  ['Reduce la altura de las rodillas para bajar la intensidad.'], { mode: 'time', time: [30, 60], met: 8 });
ex('burpees', 'Burpees', 'cardio', ['Cardio', 'Cuerpo completo'], [], 3, ['muñeca', 'rodilla', 'espalda_baja', 'hombro'],
  ['Desde de pie, baja a cuclillas y apoya las manos en el suelo.', 'Lleva los pies atrás hasta quedar en plancha (opcional: una flexión).', 'Regresa los pies, y salta hacia arriba con los brazos al aire.'],
  ['Ve a tu ritmo. Quita el salto o la flexión para hacerlo más fácil.'], { reps: [6, 12], met: 9 });
ex('boxeo_sombra', 'Boxeo de sombra', 'cardio', ['Cardio', 'Hombros'], [], 1, ['hombro'],
  ['Pies al ancho de los hombros y rodillas flexionadas.', 'Lanza golpes rectos y ganchos al aire alternando brazos.', 'Muévete con pasos ligeros.'],
  ['Mantén las manos arriba protegiendo el rostro.'], { mode: 'time', time: [60, 180], met: 7 });
ex('bici', 'Bicicleta estática', 'cardio', ['Cardio', 'Cuádriceps'], ['machine'], 1, [],
  ['Ajusta el asiento a la altura de la cadera.', 'Pedalea a un ritmo en el que puedas hablar con esfuerzo.', 'Alterna tramos más rápidos si quieres más intensidad.'],
  ['Una buena opción de bajo impacto para las articulaciones.'], { mode: 'time', time: [300, 1800], met: 6.8 });

// ───────────────────────── CALENTAMIENTO ─────────────────────────
ex('marcha_lugar', 'Marcha en el lugar', 'warmup', ['Cardio'], [], 1, [],
  ['Marcha elevando las rodillas a ritmo ligero.', 'Mueve los brazos de forma natural.', 'Sube gradualmente la velocidad.'], [], { mode: 'time', time: [60, 60] });
ex('circulos_brazos', 'Círculos de brazos', 'warmup', ['Hombros'], [], 1, [],
  ['Brazos extendidos a los lados.', 'Haz círculos pequeños que van creciendo.', 'Cambia de dirección a la mitad.'], [], { mode: 'time', time: [30, 30] });
ex('gato_vaca', 'Gato-vaca', 'warmup', ['Espalda', 'Core'], [], 1, ['muñeca'],
  ['En cuadrupedia, manos bajo hombros y rodillas bajo caderas.', 'Arquea la espalda hacia arriba metiendo el mentón (gato).', 'Luego baja el abdomen y mira hacia adelante (vaca).'], [], { reps: [8, 10] });
ex('balanceo_piernas', 'Balanceo de piernas', 'warmup', ['Caderas'], [], 1, ['cadera'],
  ['De pie, apóyate de una pared.', 'Balancea una pierna adelante y atrás de forma controlada.', 'Cambia de pierna.'], [], { reps: [10, 10], uni: true });
ex('circulos_cadera', 'Círculos de cadera', 'warmup', ['Caderas'], [], 1, [],
  ['Pies al ancho de los hombros y manos en la cintura.', 'Dibuja círculos amplios con la cadera.', 'Cambia de sentido a la mitad.'], [], { mode: 'time', time: [30, 30] });
ex('estiramiento_mundo', 'Zancada con rotación (estiramiento del mundo)', 'warmup', ['Caderas', 'Espalda', 'Isquiotibiales'], [], 1, ['rodilla'],
  ['Da una zancada larga al frente y apoya las manos en el suelo.', 'Lleva el codo de adentro hacia el tobillo y luego rota abriendo el brazo al techo.', 'Alterna los lados.'], [], { reps: [5, 5], uni: true });
ex('apertura_banda', 'Apertura de banda (pull-apart)', 'warmup', ['Hombros', 'Espalda'], ['band'], 1, [],
  ['Sostén la banda frente al pecho con los brazos estirados.', 'Sepárala hacia los lados apretando los omóplatos.', 'Vuelve controlado.'], [], { reps: [12, 15] });
ex('rotacion_toracica', 'Rotación torácica en cuadrupedia', 'warmup', ['Espalda', 'Hombros'], [], 1, ['muñeca', 'cuello'],
  ['En cuadrupedia, pon una mano detrás de la cabeza.', 'Lleva el codo hacia abajo y luego rota abriéndolo hacia el techo.', 'Alterna los lados.'], [], { reps: [8, 8], uni: true });

// ───────────────────────── ESTIRAMIENTOS ─────────────────────────
const st = (id, name, muscles, steps, tips = [], extra = {}) =>
  ex(id, name, 'stretch', muscles, [], 1, [], steps, tips, { mode: 'time', time: [30, 30], ...extra });
st('est_cuadriceps', 'Estiramiento de cuádriceps', ['Cuádriceps'],
  ['De pie, lleva el talón de una pierna hacia el glúteo y sujeta el pie.', 'Mantén las rodillas juntas y la cadera al frente.', 'Cambia de pierna.'], ['Apóyate en una pared si pierdes el equilibrio.'], { uni: true });
st('est_isquios', 'Estiramiento de isquiotibiales', ['Isquiotibiales'],
  ['Sentado con una pierna estirada y la otra doblada.', 'Inclínate hacia adelante con la espalda recta.', 'Mantén sin rebotar y cambia de pierna.'], [], { uni: true });
st('est_pecho', 'Estiramiento de pecho en pared', ['Pecho', 'Hombros'],
  ['Apoya el antebrazo en una pared con el codo a 90°.', 'Gira el cuerpo suavemente hacia el lado contrario.', 'Mantén y cambia de brazo.'], [], { uni: true });
st('postura_nino', 'Postura del niño', ['Espalda', 'Caderas'],
  ['De rodillas, siéntate sobre los talones.', 'Estira los brazos al frente apoyando la frente en el suelo.', 'Respira profundo y relájate.']);
st('est_gluteo', 'Estiramiento de glúteo (figura 4)', ['Glúteos', 'Caderas'],
  ['Acostado boca arriba, cruza un tobillo sobre la rodilla contraria.', 'Jala el muslo de abajo hacia el pecho.', 'Mantén y cambia de lado.'], [], { uni: true });
st('est_hombro', 'Estiramiento de hombro cruzado', ['Hombros'],
  ['Cruza un brazo por delante del pecho.', 'Presiónalo suavemente con el otro brazo.', 'Mantén y cambia.'], [], { uni: true });
st('est_triceps', 'Estiramiento de tríceps', ['Tríceps'],
  ['Lleva un codo hacia el techo y la mano detrás de la nuca.', 'Con la otra mano empuja suavemente el codo.', 'Mantén y cambia.'], [], { uni: true });
st('est_flexores', 'Estiramiento de flexores de cadera', ['Caderas', 'Cuádriceps'],
  ['En zancada baja con una rodilla apoyada en el suelo.', 'Empuja la cadera suavemente hacia adelante.', 'Mantén y cambia de lado.'], ['Aprieta el glúteo de la pierna de atrás para sentir más el estiramiento.'], { uni: true });
st('est_pantorrilla', 'Estiramiento de pantorrillas', ['Pantorrillas'],
  ['Apoya las manos en una pared y lleva una pierna atrás con el talón en el suelo.', 'Empuja suavemente la pared hasta sentir el estiramiento.', 'Mantén y cambia.'], [], { uni: true });

export const EXERCISES = L;
export const EX = Object.fromEntries(L.map((e) => [e.id, e]));
export const byPattern = (p) => L.filter((e) => e.pattern === p);

export function ytLink(e) {
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(e.name + ' técnica correcta');
}

// ¿El usuario puede hacer este ejercicio con su equipo y sin lesiones?
export function usable(e, equipSet, injuries) {
  if (!e.equip.every((t) => equipSet.has(t))) return false;
  if (injuries && injuries.some((i) => e.avoid.includes(i))) return false;
  return true;
}
