class SoporteTecnico {
    constructor() {
        this.container = document.getElementById('grid-salidas');
        this.sheetId = '1JpRyU-cFuGpmZpfuTil7FicbyFUrX3GS_nMUZLSUKKM'; 
        this.equipos = [];
        this.equipoSeleccionado = null; 
        
        this.busquedaActual = localStorage.getItem('busquedaGlobal') || ''; 
        this.iniciar();
    }

    async iniciar() {
        if (!this.container) return;
        this.container.innerHTML = '<p style="text-align:center; color: #ffb74d; padding: 20px;">Conectando con Google Sheets...</p>';

        const url = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('Salidas')}`;

        try {
            const response = await fetch(url);
            const text = await response.text();
            const json = JSON.parse(text.substring(47).slice(0, -2));
            
            this.equipos = [];
            json.table.rows.forEach((row, index) => {
                if (row && row.c && index > 0) {
                    const val = (colIndex) => row.c[colIndex] ? row.c[colIndex].v : '';
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

                    if (equipo.id !== 'N/A' && equipo.id.toString().trim() !== '') {
                        this.equipos.push(equipo);
                    }
                }
            });

            const inputBuscador = document.getElementById('buscador-global');
            if (inputBuscador) {
                inputBuscador.value = this.busquedaActual;
                document.getElementById('btn-limpiar-busqueda').style.display = this.busquedaActual ? 'block' : 'none';
            }

            this.renderizar();
        } catch (error) {
            console.error("Error al conectar con Sheets:", error);
            this.container.innerHTML = '<p style="text-align:center; color:#ff4c4c;">No se pudo cargar la información.</p>';
        }
    }

    buscarGlobal(texto) {
        this.busquedaActual = texto;
        localStorage.setItem('busquedaGlobal', texto); 
        const btnLimpiar = document.getElementById('btn-limpiar-busqueda');
        if (btnLimpiar) btnLimpiar.style.display = texto.length > 0 ? 'block' : 'none';
        this.renderizar(); 
    }

    limpiarBusqueda() {
        const input = document.getElementById('buscador-global');
        if (input) input.value = '';
        this.buscarGlobal('');
    }

    renderizar() {
        this.container.innerHTML = '';
        
        const query = this.busquedaActual.toLowerCase().trim();
        const equiposFiltrados = this.equipos.filter(eq => {
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

        // Función para inyectar el texto y el lápiz de edición
        const setTextEditable = (elementId, text, campoDB) => {
            const el = document.getElementById(elementId);
            if (el) el.innerHTML = `${text} <span class="icono-editar" onclick="appSoporte.activarEdicion('${campoDB}', '${elementId}')">✏️</span>`;
        };

        // El ID no lleva lápiz
        document.getElementById('det-id').innerText = eq.id; 

        // Título principal (Cliente)
        const tituloContenedor = document.getElementById('det-titulo-contenedor');
        if (tituloContenedor) {
            tituloContenedor.innerHTML = `
                <h1 class="titulo-detalles" id="det-titulo">${eq.unidad}</h1>
                <span class="icono-editar" onclick="appSoporte.activarEdicion('unidad', 'det-titulo-contenedor')">✏️</span>
            `;
        }

        // Llenado de todos los campos con su lápiz
        setTextEditable('det-linea', eq.linea, 'linea');
        setTextEditable('det-iccid', eq.iccid, 'iccid');
        setTextEditable('det-imei', eq.imei, 'imei');
        setTextEditable('det-marca', eq.marca, 'marca');
        setTextEditable('det-modelo', eq.modelo, 'modelo');
        setTextEditable('det-cliente', eq.cliente, 'cliente');
        setTextEditable('det-tipo-servicio', eq.tipoServicio, 'tipoServicio');
        setTextEditable('det-servicio', eq.estadoServicio, 'estadoServicio');

        const marcaTag = document.getElementById('det-marca');
        if (marcaTag) marcaTag.setAttribute('data-linea', eq.linea);
        
        panel.classList.add('abierto');
    }

    // --- NUEVO SISTEMA DE EDICIÓN UNIVERSAL ---
    activarEdicion(campoDB, elementId) {
        const contenedor = document.getElementById(elementId);
        const valorActual = this.equipoSeleccionado[campoDB];

        // Inyectamos el input y los botones de Guardar/Cancelar
        contenedor.innerHTML = `
            <div style="display: flex; gap: 8px; align-items: center; width: 100%;">
                <input type="text" id="input-edit-${campoDB}" value="${valorActual}" style="flex-grow: 1; font-size: 0.9rem; padding: 6px; color: #fff; background: #222; border: 1px solid #ffb74d; border-radius: 4px; outline: none;">
                <button style="background: #388e3c; border: none; color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;" onclick="appSoporte.guardarEdicion('${campoDB}', '${elementId}')">✔</button>
                <button style="background: #d32f2f; border: none; color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;" onclick="appSoporte.abrirDetalles(appSoporte.equipoSeleccionado)">✖</button>
            </div>
        `;
    }

    async guardarEdicion(campoDB, elementId) {
        const nuevoValor = document.getElementById(`input-edit-${campoDB}`).value;
        const idEquipo = this.equipoSeleccionado.id;
        
        const contenedor = document.getElementById(elementId);
        contenedor.innerHTML = `<span style="color: #388e3c; font-weight: bold;">Guardando... ⏳</span>`;

        // 🚨 AQUÍ PON TU URL DE APPS SCRIPT 🚨
        const scriptUrl = 'https://script.google.com/macros/s/AKfycbwUjAXLqi8OnoVJFPD3jd9j0dYzhDSrQaX1kjpUzRQpfehuWnUbLHzWCr09SlPeFGo5/exec'; 

        try {
            const respuesta = await fetch(scriptUrl, {
                method: 'POST',
                body: JSON.stringify({ id: idEquipo, campo: campoDB, nuevoValor: nuevoValor })
            });
            const resultado = await response.json();
            
            if (resultado.success) {
                // Actualizamos el dato en la memoria y "refrescamos" la vista
                this.equipoSeleccionado[campoDB] = nuevoValor; 
                this.abrirDetalles(this.equipoSeleccionado); 
                this.renderizar(); 
            } else {
                throw new Error("No se encontró el ID");
            }
        } catch (error) {
            console.error(error);
            alert("Error al guardar. Intenta de nuevo.");
            this.abrirDetalles(this.equipoSeleccionado); // Restaura si falla
        }
    }

    // --- CERRAR Y COMANDOS SMS ---
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

    // --- MODAL FORMULARIO DE COMANDOS ---
    abrirModalComandos() {
        if (!this.equipoSeleccionado) return;
        document.getElementById('cmd-marca').value = this.equipoSeleccionado.marca;
        document.getElementById('cmd-modelo').value = this.equipoSeleccionado.modelo;
        document.getElementById('cmd-id').value = this.equipoSeleccionado.id;
        document.getElementById('cmd-tipo').value = "";
        document.getElementById('cmd-seccion-dinamica').style.display = "none";
        document.getElementById('modal-comandos').style.display = 'flex';
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

document.addEventListener('DOMContentLoaded', () => {
    window.appSoporte = new SoporteTecnico();
});
