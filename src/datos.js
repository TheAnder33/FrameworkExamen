const eventos = [
  {
    id: 1,
    titulo: "Noche de Monólogos en Euskera",
    descripcion: "Los mejores monologuistas del panorama actual para reír sin parar.",
    tipo: "monologo",
    fecha: "2026-11-05",
    hora: "21:00",
    entrada: { gratis: false, precio: 10 },
    gentePrevista: 100,
    organizador: { nombre: "Algara Elkartea", contacto: "600111222" },
    alquiler: { cobra: true, importe: 150, pagado: false },
    cancelacion: null,
    artistas: [
      { nombre: "Kike Biguri", cobra: 250, minutos: 45 },
      { nombre: "Txiki", cobra: 200, minutos: 40 }
    ],
    etiquetas: ["humor", "euskera", "terraza"],
    celebrado: true
  },
  {
    id: 2,
    titulo: "Concierto Rock Local",
    descripcion: "Grupo en directo presentando su nuevo disco de rock underground.",
    tipo: "concierto",
    fecha: "2026-11-12",
    hora: "22:30",
    entrada: { gratis: false, precio: 12 },
    gentePrevista: 140,
    organizador: { nombre: "Musika Kluba", contacto: "611222333" },
    alquiler: { cobra: true, importe: 200, pagado: true },
    cancelacion: null,
    artistas: [
      { nombre: "The Wilsons", cobra: 500, minutos: 90 }
    ],
    etiquetas: ["musica", "rock", "concierto"],
    celebrado: false
  },
  {
    id: 3,
    titulo: "Fiesta ochentera",
    descripcion: "Baila al ritmo de los mejores exitos de los años 80 y 90.",
    tipo: "fiesta",
    fecha: "2026-11-15",
    hora: "23:00",
    entrada: { gratis: true, precio: 0 },
    gentePrevista: 150,
    organizador: { nombre: "Sala Txalupa", contacto: "622333444" },
    alquiler: { cobra: false, importe: 0, pagado: false },
    cancelacion: null,
    artistas: [],
    etiquetas: ["fiesta", "80s", "baile"],
    celebrado: false
  },
  {
    id: 4,
    titulo: "Karaoke Popular",
    descripcion: "Sube al escenario y demuestra tu valía cantando tus canciones favoritas.",
    tipo: "karaoke",
    fecha: "2026-11-20",
    hora: "20:00",
    entrada: { gratis: true, precio: 0 },
    gentePrevista: 80,
    organizador: { nombre: "Asociación Vecinal", contacto: "633444555" },
    alquiler: { cobra: false, importe: 0, pagado: false },
    cancelacion: { cancelado: true, motivo: "Aviso de alerta meteorológica naranja." },
    artistas: [],
    etiquetas: ["karaoke", "gratis"],
    celebrado: false
  },
  {
    id: 5,
    titulo: "Gran Quiz de Conocimientos",
    descripcion: "Demuestra lo que sabes en nuestro trivial nocturno por equipos.",
    tipo: "quiz",
    fecha: "2026-11-22",
    hora: "19:30",
    entrada: { gratis: false, precio: 5 },
    gentePrevista: 60,
    organizador: { nombre: "Algara Elkartea", contacto: "600111222" },
    alquiler: { cobra: true, importe: 100, pagado: false },
    cancelacion: null,
    artistas: [],
    etiquetas: ["quiz", "cultura"],
    celebrado: false
  },
  {
    id: 6,
    titulo: "Evento Privado Empresa Z",
    descripcion: "Cena y fiesta privada para los trabajadores de la empresa colaboradora.",
    tipo: "privado",
    fecha: "2026-11-25",
    hora: "21:00",
    entrada: { gratis: false, precio: 25 },
    gentePrevista: 120,
    organizador: { nombre: "Empresa Z S.L.", contacto: "644555666" },
    alquiler: { cobra: true, importe: 400, pagado: false },
    cancelacion: null,
    artistas: [
      { nombre: "DJ Mendi", cobra: 300, minutos: 180 },
      { nombre: "Mago Asier", cobra: 150, minutos: 30 }
    ],
    etiquetas: ["privado", "empresa"],
    celebrado: false
  },
  {
    id: 7,
    titulo: "Monólogo de Sobremesa",
    descripcion: "Humor ácido para acabar la tarde de domingo.",
    tipo: "monologo",
    fecha: "2026-10-10",
    hora: "18:00",
    entrada: { gratis: true, precio: 0 },
    gentePrevista: 90,
    organizador: { nombre: "Kultura Elkartea", contacto: "655666777" },
    alquiler: { cobra: false, importe: 0, pagado: false },
    cancelacion: null,
    artistas: [
      { nombre: "Nerea Garmendia", cobra: 220, minutos: 50 }
    ],
    etiquetas: ["humor", "domingo"],
    celebrado: true
  },
  {
    id: 8,
    titulo: "Concierto Acústico Íntimo",
    descripcion: "Guitarras y voces en formato reducido.",
    tipo: "concierto",
    fecha: "2026-10-15",
    hora: "20:30",
    entrada: { gratis: false, precio: 8 },
    gentePrevista: 70,
    organizador: { nombre: "Musika Kluba", contacto: "611222333" },
    alquiler: { cobra: true, importe: 120, pagado: false },
    cancelacion: { cancelado: true, motivo: "Enfermedad repentina del artista principal." },
    artistas: [
      { nombre: "Jon Ander Duo", cobra: 250, minutos: 60 }
    ],
    etiquetas: ["acustico", "musica"],
    celebrado: false
  },
  {
    id: 9,
    titulo: "Fiesta de Halloween Cancelada",
    descripcion: "La gran fiesta de disfraces anual de la sala.",
    tipo: "fiesta",
    fecha: "2026-10-31",
    hora: "23:59",
    entrada: { gratis: true, precio: 0 },
    gentePrevista: 150,
    organizador: { nombre: "Sala Txalupa", contacto: "622333444" },
    alquiler: { cobra: false, importe: 0, pagado: false },
    cancelacion: { cancelado: true, motivo: "Problemas con la licencia de apertura extraordinaria." },
    artistas: [],
    etiquetas: ["fiesta", "disfraces"],
    celebrado: false
  },
  {
    id: 10,
    titulo: "Fiesta Universitaria",
    descripcion: "Bienvenida al nuevo cuatrimestre universitario con DJs invitados.",
    tipo: "fiesta",
    fecha: "2026-11-02",
    hora: "23:00",
    entrada: { gratis: true, precio: 0 },
    gentePrevista: 150,
    organizador: { nombre: "Delegación Estudiantes", contacto: "666777888" },
    alquiler: { cobra: false, importe: 0, pagado: false },
    cancelacion: null,
    artistas: [],
    etiquetas: ["universidad", "fiesta"],
    celebrado: true
  }
];

const productos = [
  {
    id: 1,
    nombre: "Cerveza en lata",
    categoria: "bebida",
    unidad: "latas",
    stockActual: 10, //PRUEBAS
    minimo: 50,
    caja: { unidadesPorCaja: 24, precioCaja: 18.50 },
    proveedor: { nombre: "Bebidas del Norte S.A.", telefono: "943123456" },
    consumoPorTipo: {
      monologo: 1,
      concierto: 2,
      fiesta: 3,
      karaoke: 2,
      quiz: 1.5,
      privado: 2
    }
  },
  {
    id: 2,
    nombre: "Refresco de Cola",
    categoria: "bebida",
    unidad: "latas",
    stockActual: 120,
    minimo: 40,
    caja: { unidadesPorCaja: 24, precioCaja: 20.00 },
    proveedor: { nombre: "Bebidas del Norte S.A.", telefono: "943123456" },
    consumoPorTipo: {
      monologo: 1,
      concierto: 1,
      fiesta: 2,
      karaoke: 1.5,
      quiz: 1,
      privado: 1.5
    }
  },
  {
    id: 3,
    nombre: "Bolsa de Patatas Fritas",
    categoria: "comida",
    unidad: "bolsas",
    stockActual: 15,
    minimo: 30,
    caja: { unidadesPorCaja: 12, precioCaja: 15.00 },
    proveedor: { nombre: "Aperitivos Vascos", telefono: "943987654" },
    consumoPorTipo: {
      monologo: 0.5,
      concierto: 0.5,
      fiesta: 1,
      karaoke: 0.5,
      quiz: 0.5,
      privado: 1
    }
  },
  {
    id: 4,
    nombre: "Vasos de plástico 50cl",
    categoria: "otros",
    unidad: "paquetes",
    stockActual: 8,
    minimo: 20,
    caja: { unidadesPorCaja: 50, precioCaja: 5.00 },
    proveedor: { nombre: "Hostelería Total", telefono: "943555444" },
    consumoPorTipo: {
      monologo: 1,
      concierto: 2,
      fiesta: 3,
      karaoke: 2,
      quiz: 1,
      privado: 2
    }
  },
  {
    id: 5,
    nombre: "Servilletas de papel",
    categoria: "otros",
    unidad: "paquetes",
    stockActual: 40,
    minimo: 25,
    caja: { unidadesPorCaja: 100, precioCaja: 8.00 },
    proveedor: { nombre: "Hostelería Total", telefono: "943555444" },
    consumoPorTipo: {
      monologo: 1,
      concierto: 1,
      fiesta: 2,
      karaoke: 1,
      quiz: 1,
      privado: 1.5
    }
  }
];

const pedidos = [
  {
    id: 1,
    fecha: "2026-10-01",
    lineas: [
      { productoId: 1, cajas: 5 },
      { productoId: 4, cajas: 2 }
    ],
    importeTotal: 112.50,
    recibido: true
  },
  {
    id: 2,
    fecha: "2026-11-01",
    lineas: [
      { productoId: 1, cajas: 4 },
      { productoId: 3, cajas: 2 }
    ],
    importeTotal: 104.00,
    recibido: false //PENDIENTE PRUEBA
  }
];

module.exports = {
  eventos,
  productos,
  pedidos
};