function abrirBaseDeDatos() {
  return new Promise((resolve, reject) => {
    const peticion = indexedDB.open('atlas3d-progreso-db', 1);

    peticion.onupgradeneeded = event => {
      const db = event.target.result;
      const store = db.createObjectStore('progreso', { keyPath: 'modeloId' });
      store.createIndex('porFavorito', 'favorito', { unique: false });
      store.createIndex('porUltimaVisita', 'ultimaVisita', { unique: false });
    };

    peticion.onsuccess = event => resolve(event.target.result);
    peticion.onerror = event => reject(event.target.error);
  });
}

function marcarModeloVisto(db, modeloId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('progreso', 'readwrite');
    const store = tx.objectStore('progreso');
    const peticion = store.get(modeloId);

    peticion.onsuccess = () => {
      const registro = peticion.result || { modeloId, favorito: false, notaCifrada: null, notaIv: null };
      registro.ultimaVisita = Date.now();
      const escritura = store.put(registro);  // put(): crea o actualiza, nunca falla por clave repetida
      escritura.onsuccess = () => resolve(registro);
      escritura.onerror = () => reject(escritura.error);
    };
    peticion.onerror = () => reject(peticion.error);
  });
}

function alternarFavorito(db, modeloId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('progreso', 'readwrite');
    const store = tx.objectStore('progreso');
    const peticion = store.get(modeloId);

    peticion.onsuccess = () => {
      const registro = peticion.result || { modeloId, favorito: false, ultimaVisita: null, notaCifrada: null, notaIv: null };
      registro.favorito = !registro.favorito;
      const escritura = store.put(registro);
      escritura.onsuccess = () => resolve(registro.favorito);
      escritura.onerror = () => reject(escritura.error);
    };
  });
}

function obtenerFavoritos(db) {
  return new Promise((resolve) => {
    const resultado = [];
    const indice = db.transaction('progreso', 'readonly').objectStore('progreso').index('porFavorito');
    const cursor = indice.openCursor(IDBKeyRange.only(true));

    cursor.onsuccess = event => {
      const c = event.target.result;
      if (c) { resultado.push(c.value); c.continue(); }
      else resolve(resultado);
    };
  });
}

async function guardarNotaDeEstudio(db, clave, modeloId, texto) {
  const { cifrado, iv } = await cifrarTexto(clave, texto);  // función de la Sesión 22, sin cambios
  const tx = db.transaction('progreso', 'readwrite');
  const store = tx.objectStore('progreso');
  const registro = (await new Promise(r => { store.get(modeloId).onsuccess = e => r(e.target.result); }))
    || { modeloId, favorito: false, ultimaVisita: null };
  registro.notaCifrada = cifrado;
  registro.notaIv = iv;
  return new Promise((resolve, reject) => {
    const escritura = store.put(registro);
    escritura.onsuccess = () => resolve();
    escritura.onerror = () => reject(escritura.error);
  });
}