const express = require('express');
const datosIniciales = require('./datos');
const { validarEvento, validarProducto, validarPedido } = require('./validar');
const { buscarPorId } = require('./servicios/comun');
const srvEventos = require('./servicios/eventos');
const srvAlmacen = require('./servicios/almacen');
const srvPedidos = require('./servicios/pedidos');

const app = express();
app.use(express.json());

let eventos = datosIniciales.eventos.map(e => ({
    ...e,
    entrada: { ...e.entrada },
    organizador: { ...e.organizador },
    alquiler: { ...e.alquiler },
    cancelacion: e.cancelacion ? { ...e.cancelacion } : null,
    artistas: e.artistas.map(a => ({ ...a })),
    etiquetas: [...e.etiquetas]
}));

let productos = datosIniciales.productos.map(p => ({
    ...p,
    caja: { ...p.caja },
    proveedor: { ...p.proveedor },
    consumoPorTipo: { ...p.consumoPorTipo }
}));

let pedidos = datosIniciales.pedidos.map(ped => ({
    ...ped,
    lineas: ped.lineas.map(l => ({ ...l }))
}));

function validarId(idParam) {
    const num = Number(idParam);
    return Number.isInteger(num) && num > 0 ? num : null;
}

app.get('/api/eventos/resumen', (req, res) => {
    res.json(srvEventos.obtenerResumen(eventos));
});

app.get('/api/eventos/deudas', (req, res) => {
    res.json(srvEventos.obtenerDeudas(eventos));
});

app.get('/api/eventos/actuaciones', (req, res) => {
    res.json(srvEventos.obtenerActuaciones(eventos));
});

app.get('/api/eventos/calendario', (req, res) => {
    const { mes } = req.query;
    if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
        return res.status(400).json({ errores: ['El parámetro mes es obligatorio (AAAA-MM).'] });
    }
    res.json(srvEventos.obtenerCalendarioMes(eventos, mes));
});

app.get('/api/eventos/preguntas', (req, res) => {
    res.json(srvEventos.responderPreguntas(eventos, productos));
});

app.get('/api/eventos', (req, res) => {
    const { orden, dir, pagina = 1, limite = 10, campos, ...filtros } = req.query;
    const enriquecidos = srvEventos.enriquecerLista(eventos);
    const filtrados = srvEventos.filtrarEventos(enriquecidos, filtros);
    const ordenados = srvEventos.ordenarEventos(filtrados, orden, dir);
    const paginados = srvEventos.paginarEventos(ordenados, pagina, limite);
    const datos = srvEventos.proyectarEventos(paginados, campos);

    res.json({
        total: filtrados.length,
        pagina: Number(pagina),
        limite: Number(limite),
        datos
    });
});

app.get('/api/eventos/:id', (req, res) => {
    const id = validarId(req.params.id);
    if (!id) return res.status(400).json({ errores: ['El id debe ser un número entero.'] });
    const evento = buscarPorId(eventos, id);
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(srvEventos.enriquecerEvento(evento));
});

app.post('/api/eventos', (req, res) => {
    const errores = validarEvento(req.body);
    if (errores.length > 0) return res.status(400).json({ errores });
    const resultado = srvEventos.crearEvento(eventos, req.body);
    eventos = resultado.lista;
    res.status(201).json(resultado.evento);
});

app.put('/api/eventos/:id', (req, res) => {
    const id = validarId(req.params.id);
    if (!id) return res.status(400).json({ errores: ['El id debe ser un número entero.'] });
    if (!buscarPorId(eventos, id)) return res.status(404).json({ error: 'Evento no encontrado' });
    const errores = validarEvento(req.body);
    if (errores.length > 0) return res.status(400).json({ errores });
    const resultado = srvEventos.reemplazarEvento(eventos, id, req.body);
    eventos = resultado.lista;
    res.json(resultado.evento);
});

app.patch('/api/eventos/:id', (req, res) => {
    const id = validarId(req.params.id);
    if (!id) return res.status(400).json({ errores: ['El id debe ser un número entero.'] });
    const actual = buscarPorId(eventos, id);
    if (!actual) return res.status(404).json({ error: 'Evento no encontrado' });
    const fusionado = srvEventos.fusionarEvento(actual, req.body);
    const errores = validarEvento(fusionado);
    if (errores.length > 0) return res.status(400).json({ errores });
    const resultado = srvEventos.reemplazarEvento(eventos, id, fusionado);
    eventos = resultado.lista;
    res.json(resultado.evento);
});

app.delete('/api/eventos/:id', (req, res) => {
    const id = validarId(req.params.id);
    if (!id) return res.status(400).json({ errores: ['El id debe ser un número entero.'] });
    if (!buscarPorId(eventos, id)) return res.status(404).json({ error: 'Evento no encontrado' });
    eventos = srvEventos.eliminarEvento(eventos, id);
    res.status(204).send();
});

app.patch('/api/eventos/:id/cancelar', (req, res) => {
    const id = validarId(req.params.id);
    if (!id) return res.status(400).json({ errores: ['El id debe ser un número entero.'] });
    const evento = buscarPorId(eventos, id);
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });
    if (!req.body.motivo || typeof req.body.motivo !== 'string') {
        return res.status(400).json({ errores: ['El motivo de cancelación es obligatorio.'] });
    }
    if ((evento.cancelacion && evento.cancelacion.cancelado) || evento.celebrado) {
        return res.status(409).json({ error: 'No se puede cancelar un evento ya cancelado o celebrado.' });
    }
    const fusionado = srvEventos.fusionarEvento(evento, {
        cancelacion: { cancelado: true, motivo: req.body.motivo }
    });
    const resultado = srvEventos.reemplazarEvento(eventos, id, fusionado);
    eventos = resultado.lista;
    res.json(resultado.evento);
});

app.patch('/api/eventos/:id/pagar-alquiler', (req, res) => {
    const id = validarId(req.params.id);
    if (!id) return res.status(400).json({ errores: ['El id debe ser un número entero.'] });
    const evento = buscarPorId(eventos, id);
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });
    if (!evento.alquiler.cobra || evento.alquiler.pagado) {
        return res.status(409).json({ error: 'Este evento no cobra alquiler o ya estaba pagado.' });
    }
    const fusionado = srvEventos.fusionarEvento(evento, { alquiler: { pagado: true } });
    const resultado = srvEventos.reemplazarEvento(eventos, id, fusionado);
    eventos = resultado.lista;
    res.json(resultado.evento);
});

app.patch('/api/eventos/:id/celebrar', (req, res) => {
    const id = validarId(req.params.id);
    if (!id) return res.status(400).json({ errores: ['El id debe ser un número entero.'] });
    const evento = buscarPorId(eventos, id);
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });
    if (evento.celebrado || (evento.cancelacion && evento.cancelacion.cancelado)) {
        return res.status(409).json({ error: 'El evento ya está celebrado o cancelado.' });
    }
    const necesidades = srvAlmacen.calcularNecesidadesEvento(evento, productos);
    if (!necesidades.haySuficiente) {
        const faltantes = necesidades.productos.filter(p => p.falta > 0);
        return res.status(409).json({ error: 'Stock insuficiente para celebrar el evento.', faltantes });
    }
    productos = srvAlmacen.descontarConsumoEvento(evento, productos);
    const fusionado = srvEventos.fusionarEvento(evento, { celebrado: true });
    const resultado = srvEventos.reemplazarEvento(eventos, id, fusionado);
    eventos = resultado.lista;
    res.json(resultado.evento);
});

app.get('/api/eventos/:id/necesidades', (req, res) => {
    const id = validarId(req.params.id);
    if (!id) return res.status(400).json({ errores: ['El id debe ser un número entero.'] });
    const evento = buscarPorId(eventos, id);
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(srvAlmacen.calcularNecesidadesEvento(evento, productos));
});

app.get('/api/productos/valor', (req, res) => {
     res.json(srvAlmacen.calcularValorAlmacen(productos));
});

app.get('/api/productos/prevision', (req, res) => {
    res.json(srvAlmacen.calcularPrevision(eventos, productos));
});

app.get('/api/productos', (req, res) => {
    res.json(srvAlmacen.filtrarProductos(productos, req.query));
});

app.get('/api/productos/:id', (req, res) => {
    const id = validarId(req.params.id);
    if (!id) return res.status(400).json({ errores: ['El id debe ser un número entero.'] });
    const producto = buscarPorId(productos, id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
});

app.post('/api/productos', (req, res) => {
    const errores = validarProducto(req.body);
    if (errores.length > 0) return res.status(400).json({ errores });
    const resultado = srvAlmacen.crearProducto(productos, req.body);
    productos = resultado.lista;
    res.status(201).json(resultado.producto);
});

app.patch('/api/productos/:id', (req, res) => {
    const id = validarId(req.params.id);
    if (!id) return res.status(400).json({ errores: ['El id debe ser un número entero.'] });
    const actual = buscarPorId(productos, id);
    if (!actual) return res.status(404).json({ error: 'Producto no encontrado' });
    const fusionado = srvAlmacen.fusionarProducto(actual, req.body);
    const errores = validarProducto(fusionado);
    if (errores.length > 0) return res.status(400).json({ errores });
    productos = productos.map(p => (p.id === id ? fusionado : p));
    res.json(fusionado);
});

app.delete('/api/productos/:id', (req, res) => {
    const id = validarId(req.params.id);
    if (!id) return res.status(400).json({ errores: ['El id debe ser un número entero.'] });
    if (!buscarPorId(productos, id)) return res.status(404).json({ error: 'Producto no encontrado' });
    const resultado = srvAlmacen.eliminarProducto(productos, pedidos, id);
    if (resultado.error) return res.status(409).json({ error: resultado.error });
    productos = resultado.lista;
    res.status(204).send();
});

app.get('/api/pedidos', (req, res) => {
    res.json(srvPedidos.listarPedidos(pedidos, req.query.pendiente));
});

app.get('/api/pedidos/:id', (req, res) => {
    const id = validarId(req.params.id);
    if (!id) return res.status(400).json({ errores: ['El id debe ser un número entero.'] });
    const pedido = buscarPorId(pedidos, id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(srvPedidos.detallarPedido(pedido, productos));
});

app.post('/api/pedidos/automatico', (req, res) => {
    const resultado = srvPedidos.crearPedidoAutomatico(pedidos, eventos, productos);
    if (resultado.error) return res.status(409).json({ error: resultado.error });
    pedidos = resultado.lista;
    res.status(201).json(resultado.pedido);
});

app.post('/api/pedidos', (req, res) => {
    const errores = validarPedido(req.body, productos);
    if (errores.length > 0) return res.status(400).json({ errores });
    const resultado = srvPedidos.crearPedido(pedidos, req.body.lineas, productos);
    pedidos = resultado.lista;
    res.status(201).json(resultado.pedido);
});

app.patch('/api/pedidos/:id/recibir', (req, res) => {
    const id = validarId(req.params.id);
    if (!id) return res.status(400).json({ errores: ['El id debe ser un número entero.'] });
    const resultado = srvPedidos.recibirPedido(pedidos, id, productos);
    if (resultado.error) return res.status(resultado.estado).json({ error: resultado.error });
    pedidos = resultado.pedidos;
    productos = resultado.productos;
    res.json(resultado.pedido);
});

app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});