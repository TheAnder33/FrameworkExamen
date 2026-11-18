const { calcularSiguienteId } = require('./comun');
const { calcularPrevision } = require('./almacen');

function listarPedidos(pedidos, soloPendientes) {
    const filtrados = soloPendientes === 'true'
        ? pedidos.filter(p => !p.recibido)
        : [...pedidos];
    return filtrados.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);
}

function detallarPedido(pedido, productos) {
    const lineasConNombre = pedido.lineas.map(linea => {
        const prod = productos.find(p => p.id === linea.productoId);
        return {
        ...linea,
        nombreProducto: prod ? prod.nombre : 'Producto eliminado'
        };
    });
    return { ...pedido, lineas: lineasConNombre };
}

function calcularImportePedido(lineas, productos) {
    const total = lineas.reduce((acc, linea) => {
        const prod = productos.find(p => p.id === linea.productoId);
        const precioCaja = prod ? prod.caja.precioCaja : 0;
        return acc + linea.cajas * precioCaja;
    }, 0);
    return Number(total.toFixed(2));
}

function crearPedido(pedidos, lineas, productos) {
    const hoy = new Date().toISOString().split('T')[0];
    const nuevo = {
        id: calcularSiguienteId(pedidos),
        fecha: hoy,
        lineas: lineas.map(l => ({ productoId: l.productoId, cajas: l.cajas })),
        importeTotal: calcularImportePedido(lineas, productos),
        recibido: false
    };
    return { lista: [...pedidos, nuevo], pedido: nuevo };
}

function crearPedidoAutomatico(pedidos, eventos, productos) {
    const prevision = calcularPrevision(eventos, productos);
    if (prevision.productos.length === 0) {
        return { error: 'No hace falta pedir ningún producto según la previsión.' };
    }
    const lineas = prevision.productos.map(item => ({
        productoId: item.productoId,
        cajas: item.cajasAPedir
    }));
    return crearPedido(pedidos, lineas, productos);
}

function recibirPedido(pedidos, pedidoId, productos) {
    const idNum = Number(pedidoId);
    const pedido = pedidos.find(p => p.id === idNum);
    if (!pedido) return { estado: 404, error: 'Pedido no encontrado' };
    if (pedido.recibido) return { estado: 409, error: 'El pedido ya estaba recibido' };

    const pedidosActualizados = pedidos.map(p =>
        p.id === idNum ? { ...p, recibido: true } : p
    );

    const productosActualizados = productos.map(prod => {
        const linea = pedido.lineas.find(l => l.productoId === prod.id);
        if (!linea) return prod;
        const unidadesASumar = linea.cajas * prod.caja.unidadesPorCaja;
        return { ...prod, stockActual: prod.stockActual + unidadesASumar };
    });

    return {
        pedidos: pedidosActualizados,
        productos: productosActualizados,
        pedido: { ...pedido, recibido: true }
    };
}

module.exports = {
    listarPedidos,
    detallarPedido,
    crearPedido,
    crearPedidoAutomatico,
    recibirPedido
};