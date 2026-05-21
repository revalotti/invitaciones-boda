/**
 * Script para añadir opción de borrar datos en la hoja de Google Sheets
 *
 * CÓMO USARLO:
 * 1. Abre tu hoja "Asistencia - Boda Javi & Ani"
 * 2. Extensiones → Apps Script
 * 3. Añade esta función al archivo Code.gs (junto a tu doPost)
 * 4. Guarda y recarga la hoja
 * 5. Aparecerá un menú "Boda" con la opción "Borrar datos insertados"
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Boda')
    .addItem('Borrar datos insertados', 'borrarDatosInsertados')
    .addToUi();
}

function borrarDatosInsertados() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    'Borrar datos',
    '¿Eliminar todas las filas con confirmaciones? (Se mantiene la fila de cabecera)',
    ui.ButtonSet.YES_NO
  );

  if (result === ui.Button.YES) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      ui.alert('No hay datos que borrar.');
      return;
    }

    sheet.getRange(2, 1, lastRow, sheet.getLastColumn()).clearContent();
    ui.alert('Datos borrados correctamente.');
  }
}
