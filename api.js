// js/api.js

const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbyzSFuh0aTXopHeBTSPOcjdUnGKmNNQGoxNRcg8tsfSgSAouDk3RPzsokj2fXjv--N6/exec";

// Instancias globales de nuestros monitores
let monitorMapon;
let monitorZeek;

async function cargarDatosGlobales() {
    console.log("Cargando inventarios desde Google Sheets...");
    
    try {
        const respuesta = await fetch(URL_APPS_SCRIPT);
        const json = await respuesta.json();
        
        if (json.success) {
            console.log("Datos recibidos correctamente.");
            
            // Instanciar la clase MonitorMapon pasándole sus datos y el ID del div contenedor
            monitorMapon = new MonitorMapon('contenedor-mapon', json.mapon);
            
            // Instanciar la clase MonitorZeek (cuando la creemos)
            // monitorZeek = new MonitorZeek('contenedor-zeek', json.zeek);
            
        } else {
            console.error("Error desde Apps Script:", json.error);
        }
    } catch (error) {
        console.error("Error de conexión:", error);
    }
}

// Iniciar la carga al abrir la página
document.addEventListener('DOMContentLoaded', cargarDatosGlobales);
