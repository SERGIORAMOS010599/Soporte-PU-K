class SoporteTecnico {
    constructor() {
        this.container = document.getElementById('grid-salidas');
        this.sheetId = '1JpRyU-cFuGpmZpfuTil7FicbyFUrX3GS_nMUZLSUKKM'; // Tu Google Sheet
        this.equipos = [];
        this.equipoSeleccionado = null; // Guardará el equipo activo para el modal
        
        // Memoria Persistente: Recupera lo último que buscaste
        this.busquedaActual = localStorage.getItem('busquedaGlobal') || ''; 
        
        this.iniciar();
    }

    async iniciar() {
        if (!this.container) return;
        this.container.innerHTML = '<p style="text-align:center; color: #ffb74d; padding: 20px;">Conectando con Google Sheets...</p>';

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
                        unidad: val(11) || 'SIN UNIDAD',
                        tipoServicio: val(15) || 'PENDIENTE DE ASIGNAR'
                    };

                    // Solo agregamos a la lista si realmente existe un ID válido
                    if (equipo.id !== 'N/A' && equipo.id.toString().trim() !== '') {
                        this.equipos.push(equipo);
                    }
                }
            });

            // Poner el texto en la caja visual si quedó algo en memoria
            const inputBuscador = document.getElementById('buscador-global');
            if (inputBuscador) inputBuscador.value = this.busquedaActual;

            this.renderizar();
        } catch (error) {
            console.error("Error al conectar con Sheets:", error);
            this.container.innerHTML = '<p style="text-align:center; color:#ff4c4c;">No se pudo cargar la información. Revisa tu conexión.</p>';
        }
    }

    buscarGlobal(texto) {
        this.busquedaActual = texto;
        // Guardamos en la memoria del navegador
        localStorage.setItem('busquedaGlobal', texto); 
        this.renderizar(); // Volvemos a pintar las tarjetas filtradas
    }

    renderizar() {
        this.container.innerHTML = '';
        
        // FILTRADO INTELIGENTE
        const query = this.busquedaActual.toLowerCase().trim();
        const equiposFiltrados = this.equipos.filter(eq => {
            // Aseguramos convertirlos a texto para que no haya errores si escribes números
            return eq.id.toString().toLowerCase().includes(query) || 
                   eq.imei.toString().toLowerCase().includes(query) || 
                   eq.iccid.toString().toLowerCase().includes(query) || 
                   eq.cliente.toString().toLowerCase().includes(query) ||
                   eq.unidad.toString().toLowerCase().includes(query);
        });

        if (equiposFiltrados.length === 0) {
            this.container.innerHTML = '<p style="text-align:center; color:#a0a0a0; padding: 20px;">No hay resultados para tu búsqueda.</p>';
            return;
        }

        equiposFiltrados.forEach(eq => {
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

        this.equipoSeleccionado = eq;

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
        
        // El nuevo campo: Tipo de Servicio
        setText('det-tipo-servicio', eq.tipoServicio); 

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

    // --- NUEVAS FUNCIONES PARA EL FORMULARIO DE COMANDOS ---
    abrirModalComandos() {
        if (!this.equipoSeleccionado) return;
        
        const modal = document.getElementById('modal-comandos');
        if (!modal) {
            console.error("No se encontró el modal en el HTML");
            return;
        }

        // Auto-llenar los campos con el equipo seleccionado
        document.getElementById('cmd-marca').value = this.equipoSeleccionado.marca;
        document.getElementById('cmd-modelo').value = this.equipoSeleccionado.modelo;
        document.getElementById('cmd-id').value = this.equipoSeleccionado.id;
        
        // Reiniciar el área dinámica
        document.getElementById('cmd-tipo').value = "";
        document.getElementById('cmd-seccion-dinamica').style.display = "none";
        
        modal.style.display = 'flex';
    }

    cerrarModalComandos() {
        document.getElementById('modal-comandos').style.display = 'none';
    }

    cambiarTipoComando() {
        const seleccion = document.getElementById('cmd-tipo').value;
        const seccionDinamica = document.getElementById('cmd-seccion-dinamica');
        
        if (seleccion !== "") {
            seccionDinamica.style.display = "block";
            document.getElementById('cmd-trama').value = ""; 
        } else {
            seccionDinamica.style.display = "none";
        }
    }
}

// Instanciamos la clase globalmente cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.appSoporte = new SoporteTecnico();
});
