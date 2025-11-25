class GameObject {
  // Propiedades visuales
  sprite; // Sprite de PIXI.js para renderizado
  id; // Identificador único del objeto

  // Sistema de objetivos para IA
  target; // Objeto que este GameObject está persiguiendo
  perseguidor; // Objeto que está persiguiendo a este GameObject

  constructor(x, y, juego) {

    this.muerto = false;

    // Rango de visión aleatorio entre 400-700 píxeles
    this.vision = 8000 //Math.random() * 300 + 400; pongo vision absoluta

    // Sistema de física vectorial 2D
    this.posicion = { x: x, y: y }; // Posición actual en píxeles
    this.velocidad = { x: 0, y: 0 }; // Velocidad en píxeles/frame
    this.aceleracion = { x: 0, y: 0 }; // Aceleración en píxeles/frame²

    // Límites físicos para estabilidad del sistema
    this.aceleracionMaxima = 100; // Máxima aceleración aplicable
    this.velocidadMaxima = 100; // Velocidad terminal del objeto

    // Propiedades de colisión y combate
    this.radio = 24; // Radio de colisión en píxeles
    this.rangoDeAtaque = 25

    // Referencias del sistema
    this.juego = juego; // Referencia al motor del juego
    this.id = Math.floor(Math.random() * 9999); // ID único aleatorio

    //establezco el punto de pivot en el medio:
    //this.sprite.anchor.set(0.5);  ESTO ES DE ENTITY 20/10



    // Configuración del sistema de renderizado PIXI.js
    this.container = new PIXI.Container(); // Container para agrupar elementos visuales
    this.container.x = x; // Posición inicial X en pantalla
    this.container.y = y; // Posición inicial Y en pantalla

    // Jerarquía de renderizado: Juego -> ContainerPrincipal -> Container -> Sprite
    // El containerPrincipal maneja la cámara y el scrolling del mundo
    this.juego.containerPrincipal.addChild(this.container);
  }

  tick() {
    this.aplicarFisica();
  }

  aplicarFisica() {
    /**
     * SISTEMA DE FÍSICA ESTABLE CON DELTATIME
     *
     * Limitamos deltaTime para evitar inestabilidad cuando los FPS bajan:
     * - FPS normales (60): deltaTime ≈ 1
     * - FPS bajos (15): deltaTime ≈ 4 → limitado a 3
     * - Esto previene saltos extremos en la simulación física
     */
    const deltaTime = Math.min(this.juego.pixiApp.ticker.deltaTime, 3);

    // PASO 1: Aplicar fuerzas acumuladas
    this.limitarAceleracion();

    // Integración de Euler: v = v₀ + a×Δt
    this.velocidad.x += this.aceleracion.x * deltaTime;
    this.velocidad.y += this.aceleracion.y * deltaTime;

    // Resetear aceleración para el próximo frame (fuerzas instantáneas)
    this.aceleracion.x = 0;
    this.aceleracion.y = 0;

    // PASO 2: Aplicar modificadores de velocidad
    this.aplicarFriccion(); // Resistencia al movimiento
    this.limitarVelocidad(); // Velocidad terminal

    // PASO 3: Integrar posición: x = x₀ + v×Δt
    this.posicion.x += this.velocidad.x * deltaTime;
    this.posicion.y += this.velocidad.y * deltaTime;

    // PASO 4: Calcular ángulo de movimiento usando arctangente
    // atan2(y,x) nos da el ángulo en radianes del vector velocidad
    this.angulo = radianesAGrados(
      Math.atan2(this.velocidad.y, this.velocidad.x)
    );
  }

  limitarAceleracion() {
    /**
     * LIMITACIÓN DE ACELERACIÓN
     *
     * Aplica el límite usando la magnitud del vector:
     * Si |a| > aₘₐₓ, entonces a = (a/|a|) × aₘₐₓ
     *
     * Esto mantiene la dirección pero limita la intensidad
     */
    this.aceleracion = limitarVector(this.aceleracion, this.aceleracionMaxima);
  }

  limitarVelocidad() {
    /**
     * VELOCIDAD TERMINAL
     *
     * Implementa velocidad máxima usando la misma fórmula:
     * Si |v| > vₘₐₓ, entonces v = (v/|v|) × vₘₐₓ
     *
     * Simula resistencia del aire o límites físicos del objeto
     */
    this.velocidad = limitarVector(this.velocidad, this.velocidadMaxima);
  }

  aplicarFriccion() {
    /**
     * FRICCIÓN INDEPENDIENTE DEL FRAMERATE
     *
     * Problema: La fricción simple (v *= 0.93) depende del FPS
     * - A 60 FPS: se aplica 60 veces por segundo
     * - A 30 FPS: se aplica 30 veces por segundo → fricción diferente
     *
     * Solución: Convertir fricción por frame a fricción por tiempo
     *
     * Fórmula: fricción_aplicada = fricción_base^(deltaTime/60)
     *
     * Donde:
     * - fricción_base = 0.93^60 ≈ 0.122 (fricción por segundo a 60 FPS)
     * - deltaTime/60 = fracción de segundo transcurrido
     *
     * Esto garantiza que la fricción sea consistente sin importar el FPS
     */
    const friccionPorFrame = 0.93;
    const friccionPorSegundo = Math.pow(friccionPorFrame, 60);
    const deltaTime = Math.min(this.juego.pixiApp.ticker.deltaTime, 3);
    const friccionAplicada = Math.pow(friccionPorSegundo, deltaTime / 60);

    this.velocidad.x *= friccionAplicada;
    this.velocidad.y *= friccionAplicada;
  }

  asignarTarget(quien) {
    if (quien instanceof Ship && quien.muerto) return;
    this.target = quien;
  }

  perseguir() {

    if (!this.target) return;
    const dist = calcularDistancia(this.posicion, this.target.posicion);
    if (dist > this.vision) return;

    // Vector de dirección hacia el objetivo
    const difX = this.target.posicion.x - this.posicion.x;
    const difY = this.target.posicion.y - this.posicion.y;

    // Normalizar el vector para obtener solo la dirección (magnitud = 1)
    const vectorNuevo = limitarVector({ x: difX, y: difY }, 1);

    if (dist < this.rangoDeAtaque) {
      // Curva cúbica de desaceleración: f(x) = (x/r)³
      // Esto crea una aproximación suave al objetivo
      const factor = (dist / this.rangoDeAtaque) ** 3;
      vectorNuevo.x *= factor;
      vectorNuevo.y *= factor;
    }

    // Aplicar fuerza de persecución escalada por el factor específico del objeto
    this.aceleracion.x += vectorNuevo.x * this.factorPerseguir;
    this.aceleracion.y += vectorNuevo.y * this.factorPerseguir;
  }

  /** COMENTADO 20-10. NO LO NECESITO. CAPAZ ME SIRVE PARA EVADIR METEOROS

  escapar() {
  
     * ALGORITMO DE HUIDA
     *
     * Implementa el comportamiento opuesto a perseguir:
     * 1. Calcula vector hacia el perseguidor
     * 2. Invierte la dirección (multiplica por -1)
     * 3. Aplica fuerza en dirección opuesta
     *
     * Fórmula: fuerza_huida = -(posición_perseguidor - posición_actual)
     *
     * Esto crea un comportamiento de evasión realista
    
    if (!this.perseguidor) return;
    const dist = calcularDistancia(this.posicion, this.perseguidor.posicion);
    if (dist > this.vision) return;

    // Vector hacia el perseguidor
    const difX = this.perseguidor.posicion.x - this.posicion.x;
    const difY = this.perseguidor.posicion.y - this.posicion.y;
    const vectorNuevo = limitarVector({ x: difX, y: difY }, 1);

    // Aplicar fuerza en dirección opuesta (huir)
    this.aceleracion.x += -vectorNuevo.x;
    this.aceleracion.y += -vectorNuevo.y;
  }

   */

  asignarVelocidad(x, y) {
    this.velocidad.x = x;
    this.velocidad.y = y;
  }

  render() {

    if (!this.container || this.muerto) return;
    this.container.x = this.posicion.x;
    this.container.y = this.posicion.y;
  }
}
