class SoporteTecnico {
    constructor() {
        this.container = document.getElementById('grid-salidas');
        this.sheetId = '1JpRyU-cFuGpmZpfuTil7FicbyFUrX3GS_nMUZLSUKKM'; 
        this.equipos = [];
        this.equipoSeleccionado = null; // Guardará el equipo activo para el modal
        
        // Memoria Persistente: Recupera lo último que buscaste
        this.busquedaActual = localStorage.getItem('busquedaGlobal') || ''; 
        
        this.iniciar();
    }
    buscarGlobal(texto) {
        this.busquedaActual = texto;
        // Guardamos en la memoria del navegador para que no se borre al cambiar de página
        localStorage.setItem('busquedaGlobal', texto); 
        this.renderizar(); // Volvemos a pintar las tarjetas filtradas
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

    renderizar() {
        this.container.innerHTML = '';
        
        // FILTRADO INTELIGENTE
        const query = this.busquedaActual.toLowerCase().trim();
        const equiposFiltrados = this.equipos.filter(eq => {
            return eq.id.toLowerCase().includes(query) || 
                   eq.imei.toLowerCase().includes(query) || 
                   eq.iccid.toLowerCase().includes(query) || 
                   eq.cliente.toLowerCase().includes(query) ||
                   eq.unidad.toLowerCase().includes(query);
        });

        if (equiposFiltrados.length === 0) {
            this.container.innerHTML = '<p style="text-align:center; color:#a0a0a0;">No hay resultados para tu búsqueda.</p>';
            return;
        }

        equiposFiltrados.forEach(eq => {
            // ... (AQUÍ VA TU CÓDIGO NORMAL PARA DIBUJAR LA TARJETA div.innerHTML = ...)
            // Y al final:
            tarjeta.onclick = () => this.abrirDetalles(eq);
            this.container.appendChild(tarjeta);
        });
    }

    abrirDetalles(eq) {
        const panel = document.getElementById('panel-detalles');
        if (!panel) return;

        this.equipoSeleccionado = eq; // Memorizamos qué equipo abriste

        const setText = (elementId, text) => {
            const el = document.getElementById(elementId);
            if (el) el.innerText = text;
        };

        // ... (Tu código actual de setText) ...
        setText('det-tipo-servicio', eq.tipoServicio); // <--- Inyectamos el nuevo dato

        panel.classList.add('abierto');
    }

    // --- NUEVAS FUNCIONES PARA EL FORMULARIO DE COMANDOS ---
    abrirModalComandos() {
        if (!this.equipoSeleccionado) return;
        
        // Auto-llenar los campos con el equipo seleccionado
        document.getElementById('cmd-marca').value = this.equipoSeleccionado.marca;
        document.getElementById('cmd-modelo').value = this.equipoSeleccionado.modelo;
        document.getElementById('cmd-id').value = this.equipoSeleccionado.id;
        
        // Reiniciar el área dinámica
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
        
        // Si elige una opción válida, mostramos el cuadro para programar
        if (seleccion !== "") {
            seccionDinamica.style.display = "block";
            // Aquí en un futuro pondremos la lógica que me pases para generar los códigos
            document.getElementById('cmd-trama').value = ""; 
        } else {
            seccionDinamica.style.display = "none";
        }
    }

// Instanciamos la clase globalmente cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.appSoporte = new SoporteTecnico();
});s
