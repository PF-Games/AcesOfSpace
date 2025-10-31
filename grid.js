class Grid {
  constructor(juego, cellSize) {
    this.cellSize = cellSize;
    this.juego = juego;

    this.cantidadDeCeldasDeMasParaAgregarHaciaDerYAbajo = 50;

    this.cantidadDeCeldasALoAncho =
      Math.floor(this.juego.mapWidth / this.cellSize) + 1;

    this.cantidadDeCeldasALoAlto =
      Math.floor(this.juego.mapHeight / this.cellSize) + 1;

    this.celdas = [];
    for (
      let i = 0;
      i <
      this.cantidadDeCeldasALoAncho +
        this.cantidadDeCeldasDeMasParaAgregarHaciaDerYAbajo;
      i++
    ) {
      this.celdas.push([]);

      for (
        let j = 0;
        j <
        this.cantidadDeCeldasALoAlto +
          this.cantidadDeCeldasDeMasParaAgregarHaciaDerYAbajo;
        j++
      ) {
        this.celdas[i][j] = new Celda(this.juego, this.cellSize, i, j);
      }
    }
  }

  actualizarPosicionDeEntidad(entidad) {
    if (entidad.estoyEnLaMismaCeldaQueEnElFrameAnterior()) return;
    try {
      let gridX = Math.floor(entidad.x / this.cellSize);
      let gridY = Math.floor(entidad.y / this.cellSize);

      if (gridX < 0) gridX = 0;
      if (gridY < 0) gridY = 0;

      //si la entidad ya estaba en una celda, la sacamos de esa celda
      if (entidad.celda) entidad.celda.borrar(entidad);

      //buscamos la celda en la q esta ahora esta entidad
      let celda = this.celdas[gridX][gridY];
      //y le asignamos a la entidad esta celda en su propiedad homonima
      entidad.celda = celda;

      celda.agregar(entidad);
    } catch (e) {
      debugger;
    }
  }

  update() {
    for (
      let i = 0;
      i <
      this.cantidadDeCeldasALoAncho +
        this.cantidadDeCeldasDeMasParaAgregarHaciaDerYAbajo;
      i++
    ) {
      //   this.celdas.push([]);

      for (
        let j = 0;
        j <
        this.cantidadDeCeldasALoAlto +
          this.cantidadDeCeldasDeMasParaAgregarHaciaDerYAbajo;
        j++
      ) {
        if (this.celdas[i][j]) {
          this.celdas[i][j].update();
        }
      }
    }
  }
}
