const { AFORO, TIPOS } = require('./config');

function validarEvento(evento) {
  const errores = [];

  if (!evento.titulo || typeof evento.titulo !== 'string' || evento.titulo.trim() === '') {
    errores.push('El campo titulo es obligatorio y debe ser un texto.');
  }

  if (!evento.descripcion || typeof evento.descripcion !== 'string') {
    errores.push('El campo descripcion es obligatorio y debe ser un texto.');
  }

  if (!TIPOS.includes(evento.tipo)) {
    errores.push(`El tipo debe ser uno de los siguientes: ${TIPOS.join(', ')}.`);
  }

  if (!evento.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(evento.fecha)) {
    errores.push('La fecha es obligatoria y debe tener el formato AAAA-MM-DD.');
  }

  if (!evento.hora || typeof evento.hora !== 'string') {
    errores.push('La hora es obligatoria.');
  }

  if (!evento.entrada || typeof evento.entrada.gratis !== 'boolean') {
    errores.push('La entrada debe especificar si es gratis (booleano).');
  } else {
    if (evento.entrada.gratis && evento.entrada.precio !== 0) {
      errores.push('Si la entrada es gratuita, el precio debe ser 0.');
    }
    if (!evento.entrada.gratis && (typeof evento.entrada.precio !== 'number' || evento.entrada.precio <= 0)) {
      errores.push('Si la entrada es de pago, el precio debe ser mayor que 0.');
    }
  }

  if (typeof evento.gentePrevista !== 'number' || evento.gentePrevista < 1 || evento.gentePrevista > AFORO) {
    errores.push(`La gente prevista debe ser un número entre 1 y el aforo (${AFORO}).`);
  }

  if (!evento.organizador || typeof evento.organizador.nombre !== 'string' || !evento.organizador.contacto) {
    errores.push('El organizador debe tener nombre y contacto.');
  }

  if (!evento.alquiler || typeof evento.alquiler.cobra !== 'boolean') {
    errores.push('El alquiler debe especificar si se cobra.');
  } else {
    if (!evento.alquiler.cobra && (evento.alquiler.importe !== 0 || evento.alquiler.pagado === true)) {
      errores.push('Si no se cobra alquiler, el importe debe ser 0 y no puede estar pagado.');
    }
  }

  if (evento.cancelacion !== null && evento.cancelacion !== undefined) {
    if (typeof evento.cancelacion.cancelado !== 'boolean' || !evento.cancelacion.motivo) {
      errores.push('Si hay cancelación, debe incluir un booleano y un motivo.');
    }
  }

  if (Array.isArray(evento.artistas)) {
    const erroresArtistas = evento.artistas.flatMap((artista, index) => {
      const errs = [];
      if (!artista.nombre) errs.push(`artistas[${index}].nombre es obligatorio.`);
      if (typeof artista.cobra !== 'number' || artista.cobra < 0) errs.push(`artistas[${index}].cobra debe ser un número válido.`);
      if (typeof artista.minutos !== 'number' || artista.minutos <= 0) errs.push(`artistas[${index}].minutos debe ser mayor que 0.`);
      return errs;
    });
    errores.push(...erroresArtistas);
  } else {
    errores.push('El campo artistas debe ser un array.');
  }

  return errores;
}

function validarProducto(producto) {
  const errores = [];

  if (!producto.nombre || typeof producto.nombre !== 'string') errores.push('El nombre del producto es obligatorio.');
  if (!['bebida', 'comida', 'otros'].includes(producto.categoria)) errores.push('Categoría de producto no válida.');
  if (!producto.unidad || typeof producto.unidad !== 'string') errores.push('La unidad es obligatoria.');
  if (typeof producto.stockActual !== 'number' || producto.stockActual < 0) errores.push('El stock actual debe ser mayor o igual a 0.');
  if (typeof producto.minimo !== 'number' || producto.minimo < 0) errores.push('El mínimo debe ser mayor o igual a 0.');

  if (!producto.caja || typeof producto.caja.unidadesPorCaja !== 'number' || producto.caja.unidadesPorCaja <= 0 ||
      typeof producto.caja.precioCaja !== 'number' || producto.caja.precioCaja < 0) {
    errores.push('Los datos de la caja del producto son incorrectos.');
  }

  if (producto.consumoPorTipo) {
    TIPOS.forEach(tipo => {
      if (typeof producto.consumoPorTipo[tipo] !== 'number' || producto.consumoPorTipo[tipo] < 0) {
        errores.push(`El consumo para el tipo ${tipo} debe ser un número mayor o igual a 0.`);
      }
    });
  } else {
    errores.push('El consumo por tipo es obligatorio en los productos.');
  }

  return errores;
}

function validarPedido(pedido, productosExistentes) {
  const errores = [];

  if (!Array.isArray(pedido.lineas) || pedido.lineas.length === 0) {
    errores.push('El pedido debe contener al menos una línea de productos.');
  } else {
    const erroresLineas = pedido.lineas.flatMap((linea, index) => {
      const errs = [];
      const productoExiste = productosExistentes.some(p => p.id === linea.productoId);
      if (!productoExiste) errs.push(`lineas[${index}].productoId no existe.`);
      if (!Number.isInteger(linea.cajas) || linea.cajas <= 0) {
        errs.push(`lineas[${index}].cajas debe ser un número entero mayor que 0.`);
      }
      return errs;
    });
    errores.push(...erroresLineas);
  }

  return errores;
}

module.exports = {
  validarEvento,
  validarProducto,
  validarPedido
};