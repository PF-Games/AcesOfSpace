class Celda {
  constructor(juego, cellSize, x, y) {
    this.juego = juego;
    this.entidadesAca = {};
    this.x = x;
    this.y = y;
    this.cellSize = cellSize;
    this.centroX = this.x * this.cellSize + this.cellSize / 2;
    this.centroY = this.y * this.cellSize + this.cellSize / 2;

    // Crear el texto para mostrar la posición Y
    this.textoDebug = new PIXI.Text(
      `X: ${Math.floor(this.centroX)} Y: ${Math.floor(this.centroY)}`,
      {
        fontSize: 12,
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }
    );

    // Posicionar el texto en el centro de la celda
    this.textoDebug.x = this.centroX;
    this.textoDebug.y = this.centroY;
    this.textoDebug.anchor.set(0.5); // centrar el texto

    this.juego.containerPrincipal.addChild(this.textoDebug);
    this.drawMe();//agregado 14-10, borrar cuando no esté en debug
  }

  drawMe() {
    this.juego.dibujador
      .rect(
        this.x * this.cellSize,
        this.y * this.cellSize,
        this.cellSize,
        this.cellSize
      )
      .stroke({ width: 1, color: 0x00ff00, alpha: 0.5 });
  }

  agregar(entidad) {
    this.entidadesAca[entidad.id] = entidad;
  }

  borrar(entidad) {
    delete this.entidadesAca[entidad.id];
  }

  update() {
    this.drawMe();
  }

  obtenerCeldasVecinas() {
    let arr = [];
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i == 0 && j == 0) continue;

        let indiceX = this.x + i;
        if (indiceX < 0) indiceX = 0;
        else if (indiceX > this.juego.grid.celdas.length - 1)
          indiceX = this.juego.grid.celdas.length;

        let indiceY = this.y + j;
        if (indiceY < 0) indiceY = 0;
        else if (indiceY > this.juego.grid.celdas[indiceX].length - 1)
          indiceY = this.juego.grid.celdas[indiceX].length;

        let celda = this.juego.grid.celdas[indiceX][indiceY];
        arr.push(celda);
      }
    }

    return arrayUnique(arr);
  }



  obtenerCeldasVecinas2Niveles() {
    let arr = [];
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        if (i == 0 && j == 0) continue;

        let indiceX = this.x + i;
        if (indiceX < 0) indiceX = 0;
        else if (indiceX > this.juego.grid.celdas.length - 1)
          indiceX = this.juego.grid.celdas.length;

        let indiceY = this.y + j;
        if (indiceY < 0) indiceY = 0;
        else if (indiceY > this.juego.grid.celdas[indiceX].length - 1)
          indiceY = this.juego.grid.celdas[indiceX].length;

        let celda = this.juego.grid.celdas[indiceX][indiceY];
        arr.push(celda);
      }
    }

    return arrayUnique(arr);
  }


  obtenerEntidadesAcaYEnLasCeldasVecinas2Niveles() {
    let celdas = [this, ...this.obtenerCeldasVecinas2Niveles()];

    let arrParaRetornar = [];

    for (let celda of celdas) {
      if (celda && celda.entidadesAca) {
        arrParaRetornar = [
          ...arrParaRetornar,
          ...Object.values(celda.entidadesAca),
        ];
      }
    }

    return arrParaRetornar;
  }


  obtenerEntidadesAcaYEnLasCeldasVecinas() {
    let celdas = [this, ...this.obtenerCeldasVecinas()];

    let arrParaRetornar = [];

    for (let celda of celdas) {
      if (celda && celda.entidadesAca) {
        arrParaRetornar = [
          ...arrParaRetornar,
          ...Object.values(celda.entidadesAca),
        ];
      }
    }

    return arrParaRetornar;
  }
}