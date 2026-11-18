const { PERSONAS_POR_CAMARERO, MINIMO_CAMAREROS, COSTE_CAMARERO } = require('../config');
const { calcularSiguienteId } = require('./comun');

function calcularCamareros(evento) {
    if (evento.cancelacion && evento.cancelacion.cancelado) return 0;
    const base = Math.ceil(evento.gentePrevista / PERSONAS_POR_CAMARERO);
    const camareros = Math.max(MINIMO_CAMAREROS, base);
    return evento.tipo === 'fiesta' ? camareros + 1 : camareros;
}

function calcularDatosEvento(evento) {
    if (evento.cancelacion && evento.cancelacion.cancelado) {
        return { camarerosNecesarios: 0, costePersonal: 0, costeArtistas: 0, balancePrevisto: 0 };
    }
    const camarerosNecesarios = calcularCamareros(evento);
    const costePersonal = camarerosNecesarios * COSTE_CAMARERO;
    const costeArtistas = evento.artistas.reduce((acc, art) => acc + art.cobra, 0);
    const ingresosEntradas = evento.entrada.gratis ? 0 : evento.entrada.precio * evento.gentePrevista;
    const ingresosAlquiler = evento.alquiler.cobra ? evento.alquiler.importe : 0;
    const balancePrevisto = ingresosEntradas + ingresosAlquiler - costePersonal - costeArtistas;
    return { camarerosNecesarios, costePersonal, costeArtistas, balancePrevisto };
}

function enriquecerEvento(evento) {
    return { ...evento, ...calcularDatosEvento(evento) };
}

function enriquecerLista(eventos) {
    return eventos.map(enriquecerEvento);
}

function filtrarEventos(eventos, filtros) {
    return eventos.filter(ev => {
        if (filtros.tipo && ev.tipo !== filtros.tipo) return false;
        if (filtros.precioMin !== undefined && ev.entrada.precio < Number(filtros.precioMin)) return false;
        if (filtros.precioMax !== undefined && ev.entrada.precio > Number(filtros.precioMax)) return false;
        if (filtros.gratis !== undefined && ev.entrada.gratis !== (filtros.gratis === 'true')) return false;
        if (filtros.texto) {
        const q = filtros.texto.toLowerCase();
        const enTitulo = ev.titulo.toLowerCase().includes(q);
        const enDesc = ev.descripcion.toLowerCase().includes(q);
        if (!enTitulo && !enDesc) return false;
        }
        if (filtros.etiqueta && !ev.etiquetas.includes(filtros.etiqueta)) return false;
        if (filtros.desde && ev.fecha < filtros.desde) return false;
        if (filtros.hasta && ev.fecha > filtros.hasta) return false;
        if (filtros.organizador && !ev.organizador.nombre.toLowerCase().includes(filtros.organizador.toLowerCase())) return false;
        if (filtros.artista && !ev.artistas.some(a => a.nombre.toLowerCase().includes(filtros.artista.toLowerCase()))) return false;
        if (filtros.cancelado !== undefined) {
        const estaCancelado = Boolean(ev.cancelacion && ev.cancelacion.cancelado);
        if (estaCancelado !== (filtros.cancelado === 'true')) return false;
        }
        if (filtros.alquilerPendiente === 'true' && (!ev.alquiler.cobra || ev.alquiler.pagado)) return false;
        if (filtros.minCamareros !== undefined && ev.camarerosNecesarios < Number(filtros.minCamareros)) return false;
        return true;
    });
}

function ordenarEventos(eventos, orden = 'fecha', dir = 'asc') {
    const factor = dir === 'desc' ? -1 : 1;
    return [...eventos].sort((a, b) => {
        if (orden === 'fecha' && a.fecha === b.fecha) return a.hora.localeCompare(b.hora) * factor;
        if (typeof a[orden] === 'string') return a[orden].localeCompare(b[orden]) * factor;
        return ((a[orden] || 0) - (b[orden] || 0)) * factor;
    });
}

function paginarEventos(eventos, pagina = 1, limite = 10) {
    const pag = Math.max(1, Number(pagina));
    const lim = Math.max(1, Number(limite));
    const inicio = (pag - 1) * lim;
    return eventos.slice(inicio, inicio + lim);
}

function proyectarEventos(eventos, campos) {
    if (!campos) return eventos;
    const listaCampos = campos.split(',').map(c => c.trim());
    return eventos.map(ev =>
        listaCampos.reduce((acc, campo) => {
        if (ev[campo] !== undefined) acc[campo] = ev[campo];
        return acc;
        }, { id: ev.id })
    );
}

function crearEvento(eventos, datos) {
    const nuevo = {
        ...datos,
        id: calcularSiguienteId(eventos),
        entrada: { ...datos.entrada },
        organizador: { ...datos.organizador },
        alquiler: { ...datos.alquiler },
        cancelacion: datos.cancelacion ? { ...datos.cancelacion } : null,
        artistas: datos.artistas.map(a => ({ ...a })),
        etiquetas: [...(datos.etiquetas || [])],
        celebrado: Boolean(datos.celebrado)
    };
    return { lista: [...eventos, nuevo], evento: enriquecerEvento(nuevo) };
}

function reemplazarEvento(eventos, id, datos) {
    const idNum = Number(id);
    const actualizado = {
        ...datos,
        id: idNum,
        entrada: { ...datos.entrada },
        organizador: { ...datos.organizador },
        alquiler: { ...datos.alquiler },
        cancelacion: datos.cancelacion ? { ...datos.cancelacion } : null,
        artistas: datos.artistas.map(a => ({ ...a })),
        etiquetas: [...(datos.etiquetas || [])],
        celebrado: Boolean(datos.celebrado)
    };
    const lista = eventos.map(ev => (ev.id === idNum ? actualizado : ev));
    return { lista, evento: enriquecerEvento(actualizado) };
}

function fusionarEvento(actual, cambios) {
    const { id, camarerosNecesarios, costePersonal, costeArtistas, balancePrevisto, ...resto } = cambios;
    return {
        ...actual,
        ...resto,
        entrada: resto.entrada ? { ...actual.entrada, ...resto.entrada } : { ...actual.entrada },
        organizador: resto.organizador ? { ...actual.organizador, ...resto.organizador } : { ...actual.organizador },
        alquiler: resto.alquiler ? { ...actual.alquiler, ...resto.alquiler } : { ...actual.alquiler },
        cancelacion: resto.cancelacion !== undefined
        ? (resto.cancelacion ? { ...resto.cancelacion } : null)
        : (actual.cancelacion ? { ...actual.cancelacion } : null),
        artistas: Array.isArray(resto.artistas) ? resto.artistas.map(a => ({ ...a })) : actual.artistas.map(a => ({ ...a })),
        etiquetas: Array.isArray(resto.etiquetas) ? [...resto.etiquetas] : [...actual.etiquetas]
    };
}

function eliminarEvento(eventos, id) {
    return eventos.filter(ev => ev.id !== Number(id));
}

function obtenerResumen(eventos) {
    const enriquecidos = enriquecerLista(eventos);
    const total = enriquecidos.length;
    const cancelados = enriquecidos.filter(e => e.cancelacion && e.cancelacion.cancelado).length;
    const celebrados = enriquecidos.filter(e => e.celebrado).length;
    const activos = enriquecidos.filter(e => !(e.cancelacion && e.cancelacion.cancelado));
    const sumaGente = activos.reduce((acc, e) => acc + e.gentePrevista, 0);
    const mediaGentePrevista = activos.length > 0 ? Number((sumaGente / activos.length).toFixed(2)) : 0;
    const balancePrevistoTotal = activos.reduce((acc, e) => acc + e.balancePrevisto, 0);
    return { total, cancelados, celebrados, mediaGentePrevista, balancePrevistoTotal };
}

function obtenerDeudas(eventos) {
    const conDeuda = eventos.filter(e => e.alquiler.cobra && !e.alquiler.pagado && !(e.cancelacion && e.cancelacion.cancelado));
    const agrupado = conDeuda.reduce((acc, e) => {
        const nombre = e.organizador.nombre;
        acc[nombre] = (acc[nombre] || 0) + e.alquiler.importe;
        return acc;
    }, {});
    return Object.entries(agrupado).map(([organizador, deuda]) => ({ organizador, deuda }));
}

function obtenerActuaciones(eventos) {
    const actuaciones = eventos.flatMap(ev =>
        ev.artistas.map(art => ({
        eventoId: ev.id,
        tituloEvento: ev.titulo,
        fecha: ev.fecha,
        artista: art.nombre,
        cobra: art.cobra,
        minutos: art.minutos
        }))
    );
    return [...actuaciones].sort((a, b) => b.cobra - a.cobra);
}

function obtenerCalendarioMes(eventos, mes) {
    return eventos
        .filter(e => e.fecha.startsWith(mes) && !(e.cancelacion && e.cancelacion.cancelado))
        .sort((a, b) => (a.fecha === b.fecha ? a.hora.localeCompare(b.hora) : a.fecha.localeCompare(b.fecha)))
        .map(({ fecha, hora, titulo, tipo }) => ({ fecha, hora, titulo, tipo }));
}

function responderPreguntas(eventos, productos) {
    const hayAlquilerSinCobrar = eventos.some(e => e.alquiler.cobra && !e.alquiler.pagado && !(e.cancelacion && e.cancelacion.cancelado));
    const almacenSobreMinimo = productos.every(p => p.stockActual >= p.minimo);
    const conArtistas = eventos.filter(e => e.artistas.length > 0);
    const todosConMasDeUnaActuacion = conArtistas.length > 0 && conArtistas.every(e => e.artistas.length > 1);
    return { hayAlquilerSinCobrar, almacenSobreMinimo, todosConMasDeUnaActuacion };
}

module.exports = {
    calcularCamareros,
    calcularDatosEvento,
    enriquecerEvento,
    enriquecerLista,
    filtrarEventos,
    ordenarEventos,
    paginarEventos,
    proyectarEventos,
    crearEvento,
    reemplazarEvento,
    fusionarEvento,
    eliminarEvento,
    obtenerResumen,
    obtenerDeudas,
    obtenerActuaciones,
    obtenerCalendarioMes,
    responderPreguntas
};