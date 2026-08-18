function doGet(e) {
  // Por defecto, leeremos la hoja de STOCK de tu INVENTARIO IDT
  var nombreHoja = "STOCK"; 
  
  // Si desde Python le pedimos otra hoja, la cambiará dinámicamente
  if (e && e.parameter && e.parameter.hoja) {
    nombreHoja = e.parameter.hoja;
  }
  
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = libro.getSheetByName(nombreHoja);
  
  if (!hoja) {
    return ContentService.createTextOutput(JSON.stringify({
      "error": "No se encontró la hoja: " + nombreHoja
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var datos = hoja.getDataRange().getValues();
  var encabezados = datos[0];
  var resultado = [];
  
  // Convertimos las filas a formato JSON
  for (var i = 1; i < datos.length; i++) {
    var fila = datos[i];
    var objeto = {};
    for (var j = 0; j < encabezados.length; j++) {
      if (encabezados[j] !== "") {
        objeto[encabezados[j]] = fila[j];
      }
    }
    resultado.push(objeto);
  }
  
  return ContentService.createTextOutput(JSON.stringify(resultado))
    .setMimeType(ContentService.MimeType.JSON);
}