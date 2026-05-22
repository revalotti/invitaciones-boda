/**
 * RSVP — Google Apps Script (Web App)
 *
 * INSTALACIÓN (vinculado a tu hoja de cálculo):
 * 1. Abre la hoja "Asistencia - Boda Javi & Ani" (o la que uses).
 * 2. Extensiones → Apps Script.
 * 3. Sustituye TODO el contenido de Code.gs por este archivo.
 * 4. Guarda. Ejecuta una vez doPost o doGet y autoriza permisos (Hojas + Gmail).
 * 5. Implementar → Nueva implementación → Tipo: Aplicación web.
 *    - Ejecutar como: yo
 *    - Acceso: Cualquier persona
 * 6. Copia la URL /exec en script.js → RSVP_SCRIPT_URL
 *
 * CABECERAS DE LA HOJA (fila 1, 14 columnas; se crean solas si A1 está vacía):
 * fecha_envio | nombre | email | asistencia | asistencia_label | tipo_grupo |
 * acompanantes | ninos | total_invitados | nombres_acompanantes |
 * sin_alergias | alergias_seleccionadas | cancion | mensaje
 */

var RSVP_CONFIG = {
  sheetName: '', // vacío = hoja activa del libro
  emailFromName: 'Boda Javi & Ani',
  emailSubject: 'Copia de tu confirmación — Boda Javi & Ani',
  weddingDateLabel: '15 de agosto de 2026',
  replyTo: '' // opcional: correo de contacto de los novios
};

var RSVP_HEADERS = [
  'fecha_envio',
  'nombre',
  'email',
  'asistencia',
  'asistencia_label',
  'tipo_grupo',
  'acompanantes',
  'ninos',
  'total_invitados',
  'nombres_acompanantes',
  'sin_alergias',
  'alergias_seleccionadas',
  'cancion',
  'mensaje'
];

function doGet() {
  return jsonResponse({
    ok: true,
    message: 'Web App RSVP activa. El formulario envía confirmaciones por POST (doPost).'
  });
}

function doPost(e) {
  try {
    var data = parseRsvpPayload(e);
    var sheet = getRsvpSheet();
    ensureHeaders(sheet);
    appendRsvpRow(sheet, data);

    if (data.email) {
      try {
        sendConfirmationEmail(data);
      } catch (mailErr) {
        Logger.log('Email no enviado: ' + mailErr);
      }
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    Logger.log(err);
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function parseRsvpPayload(e) {
  if (e && e.parameter && e.parameter.payload) {
    return JSON.parse(String(e.parameter.payload));
  }

  if (e && e.postData && e.postData.contents) {
    var contents = String(e.postData.contents);
    var type = String(e.postData.type || '').toLowerCase();

    if (type.indexOf('application/x-www-form-urlencoded') !== -1) {
      if (e.parameter && e.parameter.payload) {
        return JSON.parse(String(e.parameter.payload));
      }
      var match = contents.match(/(?:^|&)payload=([^&]*)/);
      if (match && match[1]) {
        return JSON.parse(decodeURIComponent(match[1].replace(/\+/g, ' ')));
      }
    }

    return JSON.parse(contents);
  }

  throw new Error('Petición vacía o formato no reconocido');
}

function getRsvpSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (RSVP_CONFIG.sheetName) {
    var named = ss.getSheetByName(RSVP_CONFIG.sheetName);
    if (!named) {
      throw new Error('No se encontró la hoja: ' + RSVP_CONFIG.sheetName);
    }
    return named;
  }
  return ss.getActiveSheet();
}

function ensureHeaders(sheet) {
  var width = RSVP_HEADERS.length;
  var firstRow = sheet.getRange(1, 1, 1, width).getValues()[0];
  var needsHeaders = !firstRow[0] || String(firstRow[0]).trim() === '';

  if (needsHeaders) {
    sheet.getRange(1, 1, 1, width).setValues([RSVP_HEADERS]);
    sheet.getRange(1, 1, 1, width).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

function appendRsvpRow(sheet, data) {
  var row = RSVP_HEADERS.map(function (key) {
    return data[key] != null ? String(data[key]) : '';
  });
  sheet.appendRow(row);
}

function sendConfirmationEmail(data) {
  var firstName = String(data.nombre || '').split(/\s+/)[0] || 'invitado/a';
  var lines = [
    'Hola ' + firstName + ',',
    '',
    'Gracias por confirmar. Esta es la copia de tu respuesta:,
    '',
    '— Asistencia: ' + (data.asistencia_label || data.asistencia || '—')
  ];

  if (data.tipo_grupo) {
    lines.push('— Grupo: ' + data.tipo_grupo);
  }
  if (data.total_invitados && data.asistencia === 'si') {
    lines.push('— Total personas: ' + data.total_invitados);
  }
  if (data.nombres_acompanantes) {
    lines.push('— Acompañantes: ' + data.nombres_acompanantes);
  }
  if (data.alergias_seleccionadas) {
    lines.push('— Alergias / intolerancias: ' + data.alergias_seleccionadas);
  }
  if (data.cancion) {
    lines.push('— Canción sugerida: ' + data.cancion);
  }
  if (data.mensaje) {
    lines.push('— Mensaje: ' + data.mensaje);
  }

  lines.push('');
  lines.push('Si necesitas cambiar algo, responde a este correo.');
  lines.push('');
  lines.push('Con cariño,');
  lines.push('Javi & Ani');

  var options = {
    to: data.email,
    subject: RSVP_CONFIG.emailSubject,
    body: lines.join('\n'),
    name: RSVP_CONFIG.emailFromName
  };

  if (RSVP_CONFIG.replyTo) {
    options.replyTo = RSVP_CONFIG.replyTo;
  }

  MailApp.sendEmail(options);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

// ——— Menú en la hoja (borrar datos) ———

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Boda')
    .addItem('Borrar datos insertados', 'borrarDatosInsertados')
    .addToUi();
}

function borrarDatosInsertados() {
  var ui = SpreadsheetApp.getUi();
  var result = ui.alert(
    'Borrar datos',
    '¿Eliminar todas las filas con confirmaciones? (Se mantiene la fila de cabecera)',
    ui.ButtonSet.YES_NO
  );

  if (result === ui.Button.YES) {
    var sheet = getRsvpSheet();
    var lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      ui.alert('No hay datos que borrar.');
      return;
    }

    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    ui.alert('Datos borrados correctamente.');
  }
}
