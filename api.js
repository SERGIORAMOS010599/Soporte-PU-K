// js/api.js

// ⚠️ PEGA AQUÍ TU URL DE APPS SCRIPT (Asegúrate de que no falte ni un carácter)
const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbyzSFuh0aTXopHeBTSPOcjdUnGKmNNQGoxNRcg8tsfSgSAouDk3RPzsokj2fXjv--N6/exec"; 

let monitorMapon;

async function cargarDatosGlobales() {
    const divMapon = document.getElementById('contenedor-mapon');
    if (!divMapon) return;
    
    // Mensaje visual de que el script está trabajando
    divMapon.innerHTML = '<h3 style="color: #ffb74d; text-align: center; padding: 50px;">⏳ Conectando con Google Sheets para descargar inventario Mapon...</h3>';
    
    try {
        const respuesta = await fetch(URL_APPS_SCRIPT);
        const json = await respuesta.json();
        
        if (json.success) {
            // Si hay éxito, limpiamos el mensaje y arrancamos la clase
            divMapon.innerHTML = ''; 
            monitorMapon = new MonitorMapon('contenedor-mapon', json.mapon);
        } else {
            // Si Apps Script devuelve un error lógico
            divMapon.innerHTML = `<h3 style="color: #f44336; text-align: center; padding: 50px;">❌ Error desde Google Sheets: ${json.error}</h3>`;
        }
    } catch (error) {
        // Si hay error de conexión (CORS, URL mala, etc.)
        divMapon.innerHTML = `<h3 style="color: #f44336; text-align: center; padding: 50px;">
            ❌ Error de Conexión. <br><br>
            1. Revisa que pegaste bien la URL en api.js.<br>
            2. Revisa que implementaste Apps Script con acceso para "Cualquier persona".<br><br>
            Detalle técnico: ${error.message}
        </h3>`;
    }
}

document.addEventListener('DOMContentLoaded', cargarDatosGlobales);
