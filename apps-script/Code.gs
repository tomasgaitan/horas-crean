/**
 * Backend de fichaje (horas-crean) sobre Google Sheets.
 * Web app: TODO por GET para evitar problemas de CORS/preflight con POST.
 *
 * Deploy:
 *   En la hoja -> Extensiones -> Apps Script -> pegar este código ->
 *   Implementar -> Nueva implementación -> Aplicación web
 *     - Ejecutar como: Yo (tu cuenta)
 *     - Quién tiene acceso: Cualquier persona
 *   Copiar la URL del web app (termina en /exec) y pasarla al frontend.
 *
 * Hojas (las crea solas si no existen):
 *   profesionales: dni | nombre | apellido | activo
 *   fichajes:      profesional | dni | fecha | hora_ingreso | hora_egreso
 */

/**
 * ID de la hoja. Dejalo VACÍO si el script está LIGADO a la hoja
 * (Extensiones -> Apps Script). Si es un script STANDALONE creado en
 * script.google.com, pegá acá el ID (lo que está en la URL de la hoja entre
 * "/d/" y "/edit"). Ej: '1AbC...xyz'.
 */
var SHEET_ID = '';

var HOJA_PROFESIONALES = 'profesionales';
var HOJA_FICHAJES = 'fichajes';

var HEADERS_PROFESIONALES = ['dni', 'nombre', 'apellido', 'activo'];
var HEADERS_FICHAJES = ['profesional', 'dni', 'fecha', 'hora_ingreso', 'hora_egreso'];

// Índices de columna (0-based)
var COL_PROF = { dni: 0, nombre: 1, apellido: 2, activo: 3 };
var COL_FICHAJE = { profesional: 0, dni: 1, fecha: 2, horaIngreso: 3, horaEgreso: 4 };

var LOCK_TIMEOUT_MS = 10000;

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    var action = p.action || '';
    var data;
    switch (action) {
      case '':
        data = { ok: true, status: 'horas-crean backend activo' };
        break;
      case 'estado':
        data = estado(p.dni);
        break;
      case 'ingreso':
        data = withLock(function () { return registrarIngreso(p); });
        break;
      case 'egreso':
        data = withLock(function () { return registrarEgreso(p); });
        break;
      case 'alta':
        data = withLock(function () { return altaProfesional(p); });
        break;
      case 'profesionales':
        data = listarProfesionales();
        break;
      default:
        data = { ok: false, error: 'Acción desconocida: ' + action };
    }
    return json(data);
  } catch (err) {
    return json({ ok: false, error: String((err && err.message) || err) });
  }
}

/** Serializa un objeto como respuesta JSON. */
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

// --- Acciones ----------------------------------------------------------------

/** Estado de un DNI: profesional (o null) y sesión abierta (egreso vacío), si la hay. */
function estado(dni) {
  var prof = buscarProfesional(dni);
  if (!prof) return { ok: true, profesional: null, abierta: null };
  var abierta = sesionAbierta(prof.dni);
  return {
    ok: true,
    profesional: { nombre: prof.nombre, apellido: prof.apellido, activo: prof.activo },
    abierta: abierta ? { fecha: abierta.fecha, horaIngreso: abierta.horaIngreso } : null,
  };
}

/** Crea una fila nueva con hora_ingreso y egreso vacío. */
function registrarIngreso(p) {
  var prof = buscarProfesional(p.dni);
  if (!prof) return { ok: false, error: 'DNI no registrado' };
  if (!prof.activo) return { ok: false, error: 'Profesional inactivo' };
  if (sesionAbierta(prof.dni)) return { ok: false, error: 'Ya hay una sesión abierta' };

  var fecha = trim(p.fecha);
  var hora = trim(p.hora);
  if (!fecha || !hora) return { ok: false, error: 'Faltan fecha u hora' };

  var profesional = trim(p.profesional) || trim(prof.nombre + ' ' + prof.apellido);
  var hoja = hojaFichajes();
  var fila = hoja.getLastRow() + 1;
  // Formato texto en dni/fecha/horas para que Sheets no los convierta.
  hoja.getRange(fila, COL_FICHAJE.dni + 1, 1, 4).setNumberFormat('@');
  hoja.getRange(fila, 1, 1, 5).setValues([[profesional, normDni(prof.dni), fecha, hora, '']]);
  return { ok: true };
}

/** Completa el hora_egreso de la fila abierta del DNI. */
function registrarEgreso(p) {
  var dni = normDni(p.dni);
  var hora = trim(p.hora);
  if (!hora) return { ok: false, error: 'Falta la hora' };

  var abierta = sesionAbierta(dni);
  if (!abierta) return { ok: false, error: 'No hay una sesión abierta para cerrar' };

  var cell = hojaFichajes().getRange(abierta.fila, COL_FICHAJE.horaEgreso + 1);
  cell.setNumberFormat('@');
  cell.setValue(hora);
  return { ok: true };
}

/** Agrega un profesional (rechaza DNI duplicado). */
function altaProfesional(p) {
  var dni = normDni(p.dni);
  var nombre = trim(p.nombre);
  var apellido = trim(p.apellido);
  if (!dni || !nombre || !apellido) return { ok: false, error: 'Faltan datos del profesional' };
  if (buscarProfesional(dni)) return { ok: false, error: 'Ya hay un profesional con ese DNI' };

  var hoja = hojaProfesionales();
  var fila = hoja.getLastRow() + 1;
  hoja.getRange(fila, COL_PROF.dni + 1).setNumberFormat('@'); // dni como texto
  hoja.getRange(fila, 1, 1, 4).setValues([[dni, nombre, apellido, true]]);
  return { ok: true };
}

/** Lista de profesionales activos. */
function listarProfesionales() {
  var rows = filas(hojaProfesionales());
  var lista = [];
  for (var i = 0; i < rows.length; i++) {
    if (parseActivo(rows[i][COL_PROF.activo])) {
      lista.push({
        dni: normDni(rows[i][COL_PROF.dni]),
        nombre: String(rows[i][COL_PROF.nombre] || ''),
        apellido: String(rows[i][COL_PROF.apellido] || ''),
      });
    }
  }
  return { ok: true, profesionales: lista };
}

// --- Helpers de datos --------------------------------------------------------

function buscarProfesional(dni) {
  var objetivo = normDni(dni);
  if (!objetivo) return null;
  var rows = filas(hojaProfesionales());
  for (var i = 0; i < rows.length; i++) {
    if (normDni(rows[i][COL_PROF.dni]) === objetivo) {
      return {
        dni: objetivo,
        nombre: String(rows[i][COL_PROF.nombre] || ''),
        apellido: String(rows[i][COL_PROF.apellido] || ''),
        activo: parseActivo(rows[i][COL_PROF.activo]),
      };
    }
  }
  return null;
}

/**
 * Fila abierta (egreso vacío) más reciente de un DNI. Devuelve
 * { fila, fecha, horaIngreso } o null. Como el flujo nunca permite un ingreso
 * nuevo con una sesión abierta, la fila más reciente del DNI define el estado.
 */
function sesionAbierta(dni) {
  var objetivo = normDni(dni);
  var rows = filas(hojaFichajes());
  for (var i = rows.length - 1; i >= 0; i--) {
    if (normDni(rows[i][COL_FICHAJE.dni]) === objetivo) {
      var egreso = trim(rows[i][COL_FICHAJE.horaEgreso]);
      if (egreso === '') {
        return {
          fila: i + 2, // +1 header, +1 base 0
          fecha: String(rows[i][COL_FICHAJE.fecha] || ''),
          horaIngreso: String(rows[i][COL_FICHAJE.horaIngreso] || ''),
        };
      }
      return null; // la última del DNI ya está cerrada
    }
  }
  return null;
}

/** Filas de datos (sin header). */
function filas(hoja) {
  var last = hoja.getLastRow();
  if (last < 2) return [];
  return hoja.getRange(2, 1, last - 1, hoja.getLastColumn()).getValues();
}

function hojaProfesionales() {
  return getHoja(HOJA_PROFESIONALES, HEADERS_PROFESIONALES);
}

function hojaFichajes() {
  return getHoja(HOJA_FICHAJES, HEADERS_FICHAJES);
}

/** Libro de cálculo: por ID si es standalone, o el activo si está ligado a la hoja. */
function libro() {
  return SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

/** Devuelve la hoja, creándola con headers si no existe (o si está vacía). */
function getHoja(nombre, headers) {
  var libroCalc = libro();
  var hoja = libroCalc.getSheetByName(nombre);
  if (!hoja) {
    hoja = libroCalc.insertSheet(nombre);
  }
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(headers);
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function withLock(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_TIMEOUT_MS);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function normDni(v) {
  return String(v == null ? '' : v).trim();
}

function trim(v) {
  return String(v == null ? '' : v).trim();
}

function parseActivo(v) {
  if (typeof v === 'boolean') return v;
  var s = String(v == null ? '' : v).trim().toLowerCase();
  return s === 'true' || s === 'si' || s === 'sí' || s === '1' || s === 'x' || s === 'verdadero';
}
