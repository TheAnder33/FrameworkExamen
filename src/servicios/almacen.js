const { calcularSiguienteId } = require('./comun');

function filtrarProductos(productos, filtros) {
    return productos.filter(p => {
        if (filtros.categoria && p.categoria !== filtros.categoria) return false;
        if (filtros.bajoMinimo === 'true' && p.stockActual >= p.minimo) return false;
        return true;
    });
}

function crearProducto(productos, datos) {
    const nuevo = {
        ...datos,
        id: calcularSiguienteId(productos),
        caja: { ...datos.caja },
        proveedor: { ...datos.proveedor },
        consumoPorTipo: { ...datos.consumoPorTipo }
    };
    return { lista: [...productos, nuevo], producto: nuevo };
}

function fusionarProducto(actual, cambios) {
    const { id, ...resto } = cambios;
    return {
        ...actual,
        ...resto,
        caja: resto.caja ? { ...actual.caja, ...resto.caja } : { ...actual.caja },
        proveedor: resto.proveedor ? { ...actual.proveedor, ...resto.proveedor } : { ...actual.proveedor },
        consumoPorTipo: resto.consumoPorTipo
        ? { ...actual.consumoPorTipo, ...resto.consumoPorTipo }
        : { ...actual.consumoPorTipo }
    };
}

function eliminarProducto(productos, pedidos, id) {
    const idNum = Number(id);
    const enPedidoPendiente = pedidos.some(
        ped => !ped.recibido && ped.lineas.some(l => l.productoId === idNum)
    );
    if (enPedidoPendiente) return { error: 'El producto está en un pedido pendiente' };
    return { lista: productos.filter(p => p.id !== idNum) };
}

function calcularValorAlmacen(productos) {
    const porCategoria = productos.reduce((acc, p) => {
        const precioUnidad = p.caja.precioCaja / p.caja.unidadesPorCaja;
        const valorProducto = Number((p.stockActual * precioUnidad).toFixed(2));
        acc[p.categoria] = Number(((acc[p.categoria] || 0) + valorProducto).toFixed(2));
        return acc;
    }, {});
    const total = Number(Object.values(porCategoria).reduce((a, b) => a + b, 0).toFixed(2));
    return { total, porCategoria };
}

function calcularNecesidadesEvento(evento, productos) {
    const detalle = productos
        .map(p => {
        const consumoPersona = p.consumoPorTipo[evento.tipo] || 0;
        const necesario = Math.ceil(evento.gentePrevista * consumoPersona);
        const disponible = p.stockActual;
        const falta = Math.max(0, necesario - disponible);
        return {
            productoId: p.id,
            nombre: p.nombre,
            necesario,
            disponible,
            falta
        };
        })
        .filter(item => item.necesario > 0);
    const haySuficiente = detalle.every(item => item.falta === 0);
    return { eventoId: evento.id, haySuficiente, productos: detalle };
}

function calcularPrevision(eventos, productos) {
    const pendientes = eventos.filter(
        e => !e.celebrado && !(e.cancelacion && e.cancelacion.cancelado)
    );
    const consumoTotalPorProducto = pendientes
        .flatMap(ev =>
        productos.map(p => ({
            productoId: p.id,
            cantidad: Math.ceil(ev.gentePrevista * (p.consumoPorTipo[ev.tipo] || 0))
        }))
        )
        .reduce((acc, item) => {
        acc[item.productoId] = (acc[item.productoId] || 0) + item.cantidad;
        return acc;
        }, {});

    const aPedir = productos
        .map(p => {
        const necesario = consumoTotalPorProducto[p.id] || 0;
        const stockTrasEventos = p.stockActual - necesario;
        if (stockTrasEventos >= p.minimo) return null;
        const unidadesFaltantes = p.minimo - stockTrasEventos;
        const cajasAPedir = Math.ceil(unidadesFaltantes / p.caja.unidadesPorCaja);
        const costeEstimado = Number((cajasAPedir * p.caja.precioCaja).toFixed(2));
        return {
            productoId: p.id,
            nombre: p.nombre,
            necesario,
            disponible: p.stockActual,
            minimo: p.minimo,
            cajasAPedir,
            costeEstimado
        };
        })
        .filter(Boolean);

    const importeTotal = Number(aPedir.reduce((acc, item) => acc + item.costeEstimado, 0).toFixed(2));
    return { productos: aPedir, importeTotal };
}

function descontarConsumoEvento(evento, productos) {
    return productos.map(p => {
        const consumoPersona = p.consumoPorTipo[evento.tipo] || 0;
        const consumido = Math.ceil(evento.gentePrevista * consumoPersona);
        return { ...p, stockActual: p.stockActual - consumido };
    });
}

module.exports = {
    filtrarProductos,
    crearProducto,
    fusionarProducto,
    eliminarProducto,
    calcularValorAlmacen,
    calcularNecesidadesEvento,
    calcularPrevision,
    descontarConsumoEvento
};