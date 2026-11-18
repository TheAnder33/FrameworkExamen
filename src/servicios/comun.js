function buscarPorId(coleccion, id) {
  const idNumerico = Number(id);
  return coleccion.find(item => item.id === idNumerico);
}

function calcularSiguienteId(coleccion) {
  if (!Array.isArray(coleccion) || coleccion.length === 0) {
    return 1;
  }
  const ids = coleccion.map(item => item.id);
  const maxId = Math.max(...ids);
  return maxId + 1;
}

module.exports = {
  buscarPorId,
  calcularSiguienteId
};