class SoporteTecnico {
    constructor() {
        this.container = document.getElementById('grid-salidas');
        this.sheetId = '1JpRyU-cFuGpmZpfuTil7FicbyFUrX3GS_nMUZLSUKKM'; // Tu Google Sheet
        this.equipos = [];
        this.iniciar();
    }

    async iniciar() {
        if (!this.container) return;
        this.container.innerHTML = '<p style="text-align:center; color: #ffb74d; padding: 20px;">Conectando con Google Sheets...</p>';

        // AQUÍ ESTÁ LA CORRECCIÓN: Le decimos que lea la pestaña "Salidas"
        const nombrePestana = 'Salidas';
        const url = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(nombrePestana)}`;

        try {
            const response = await fetch(url);
            const text = await response.text();
            
            // Limpieza del formato nativo de Google
            const json = JSON.parse(text.substring(47).slice(0, -2));
            const rows = json.table.rows;

            this.equipos = [];

            // Recorremos las filas, saltando la fila 0 (Tus encabezados)
            rows.forEach((row, index) => {
                if (row && row.c && index > 0) {
                    
                    // Función auxiliar para leer celdas sin que el código truene si están vacías
                    const val = (colIndex) => row.c[colIndex] ? row.c[colIndex].v : '';

                    // Mapeo exacto basado en el orden de tus columnas
                    const equipo = {
                        marca: val(1) || 'SIN MARCA',
                        modelo: val(2) || 'SIN MODELO',
                        id: val(3) || 'N/A',
                        imei: val(4) || 'N/A',
                        linea: val(5) || 'SIN NÚMERO',
                        iccid: val(6) || 'N/A',
                        cliente: val(9) || 'SIN CLIENTE',
                        estadoServicio: val(10) || 'PENDIENTE',
                        unidad: val(11) || 'SIN UNIDAD'
                    };

                    // Solo agregamos a la lista si realmente existe un ID válido
                    if (equipo.id !== 'N/A' && equipo.id.toString().trim() !== '') {
                        this.equipos.push(equipo);
                    }
                }
            });

            this.renderizar();
        } catch (error) {
            console.error("Error al conectar con Sheets:", error);
            this.container.innerHTML = '<p style="text-align:center; color:#ff4c4c;">No se pudo cargar la información. Revisa tu conexión.</p>';
        }
    }

    renderizar() {
        this.container.innerHTML = '';
        
        if (this.equipos.length === 0) {
            this.container.innerHTML = '<p style="text-align:center; color:#a0a0a0;">No hay equipos registrados en la base de datos.</p>';
            return;
        }

        this.equipos.forEach(eq => {
            const tarjeta = document.createElement('div');
            tarjeta.className = 'tarjeta-gps';
            
            // Estructura limpia de la tarjeta
            tarjeta.innerHTML = `
                <div class="tarjeta-unidad">${eq.unidad}</div>
                <div class="tarjeta-cliente">${eq.cliente} (${eq.id})</div>
                <h2 class="tarjeta-marca">${eq.marca}</h2>
                <div class="tarjeta-modelo">${eq.modelo}</div>
                <div class="tarjeta-servicio">${eq.estadoServicio}</div>
                <div class="tarjeta-acciones">
                    <div class="accion-btn rojo" onclick="event.stopPropagation(); appSoporte.enviarSMS('apagar', '${eq.linea}')">APAGAR <span class="circulo"></span></div>
                    <div class="accion-btn verde" onclick="event.stopPropagation(); appSoporte.enviarSMS('encender', '${eq.linea}')">ENCENDER <span class="circulo"></span></div>
                </div>
            `;
            
            tarjeta.onclick = () => this.abrirDetalles(eq);
            this.container.appendChild(tarjeta);
        });
    }

    abrirDetalles(eq) {
        const panel = document.getElementById('panel-detalles');
        if (!panel) return;

        // Función segura para inyectar textos en el panel lateral sin errores
        const setText = (elementId, text) => {
            const el = document.getElementById(elementId);
            if (el) el.innerText = text;
        };

        setText('det-titulo', `${eq.cliente} (${eq.id})`);
        setText('det-id', eq.id);
        setText('det-linea', eq.linea);
        setText('det-iccid', eq.iccid);
        setText('det-imei', eq.imei);
        setText('det-marca', eq.marca);
        setText('det-modelo', eq.modelo);
        setText('det-cliente', eq.cliente);
        setText('det-servicio', eq.estadoServicio);

        // Guardamos el número en el atributo para los SMS
        const marcaTag = document.getElementById('det-marca');
        if (marcaTag) marcaTag.setAttribute('data-linea', eq.linea);
        
        panel.classList.add('abierto');
    }

    cerrarDetalles() {
        const panel = document.getElementById('panel-detalles');
        if (panel) panel.classList.remove('abierto');
    }

    enviarSMS(accion, lineaDirecta) {
        const marcaTag = document.getElementById('det-marca');
        const numero = lineaDirecta || (marcaTag ? marcaTag.getAttribute('data-linea') : '');
        
        if (!numero || numero === 'SIN NÚMERO') {
            alert("No hay un número de línea vinculado para enviar comandos a este equipo.");
            return;
        }

        const comando = (accion === 'apagar') ? "SA200CMD;123456;02;Enable1" : "SA200CMD;123456;02;Disable1";
        window.open(`sms:${numero}?body=${encodeURIComponent(comando)}`, '_self');
    }
}

// Instanciamos la clase globalmente cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.appSoporte = new SoporteTecnico();
});s
