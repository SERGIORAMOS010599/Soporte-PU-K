class SoporteTecnico {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.sheetId = '1JpRyU-cFuGpmZpfuTil7FicbyFUrX3GS_nMUZLSUKKM';
        this.equipos = [];
        this.loadData();
    }

    async loadData() {
        if (!this.container) return;
        this.container.innerHTML = '<p style="text-align:center; width:100%; color: #ffb74d;">Cargando equipos reales...</p>';

        const url = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:json`;

        try {
            const response = await fetch(url);
            const text = await response.text();
            const json = JSON.parse(text.substring(47).slice(0, -2));
            const rows = json.table.rows;

            this.equipos = [];

            rows.forEach((row) => {
                // Verificamos que la fila tenga datos y que no sea el encabezado
                if (row && row.c && row.c[3] && row.c[3].v !== 'ID') {
                    const equipo = {
                        fechaSalida: row.c[0] ? row.c[0].v : '',
                        marca: row.c[1] ? row.c[1].v : 'SIN MARCA',
                        modelo: row.c[2] ? row.c[2].v : 'SIN MODELO',
                        id: row.c[3] ? row.c[3].v : 'N/A',
                        imei: row.c[4] ? row.c[4].v : 'N/A',
                        linea: row.c[5] ? row.c[5].v : 'SIN NÚMERO',
                        iccid: row.c[6] ? row.c[6].v : 'N/A',
                        compania: row.c[7] ? row.c[7].v : 'N/A',
                        estado: row.c[8] ? row.c[8].v : 'N/A',
                        cliente: row.c[9] ? row.c[9].v : 'SIN CLIENTE',
                        estadoServicio: row.c[10] ? row.c[10].v : 'PENDIENTE',
                        unidad: row.c[11] ? row.c[11].v : 'SIN UNIDAD',
                        marcaModeloUnidad: row.c[12] ? row.c[12].v : 'N/A',
                        anio: row.c[13] ? row.c[13].v : 'N/A',
                        numSerie: row.c[14] ? row.c[14].v : 'N/A',
                        tipoServicio: row.c[15] ? row.c[15].v : 'ESTANDAR'
                    };
                    this.equipos.push(equipo);
                }
            });

            this.render();
        } catch (error) {
            console.error("Error cargando la base de datos:", error);
            this.container.innerHTML = '<p style="text-align:center; width:100%; color:red;">No se pudo conectar con la base de datos de Sheets.</p>';
        }
    }

    render() {
        this.container.innerHTML = '';
        
        if (this.equipos.length === 0) {
            this.container.innerHTML = '<p style="text-align:center; width:100%; color:#a0a0a0;">No hay equipos registrados en el Excel.</p>';
            return;
        }

        this.equipos.forEach(eq => {
            const div = document.createElement('div');
            div.className = 'tarjeta-gps';
            div.innerHTML = `
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
            div.onclick = () => this.abrirDetalles(eq);
            this.container.appendChild(div);
        });
    }

    abrirDetalles(eq) {
        const panel = document.getElementById('panel-detalles');
        if (!panel) return;

        // Llenamos los datos en el panel lateral
        document.getElementById('det-titulo').innerText = `${eq.cliente} (${eq.id})`;
        document.getElementById('det-id').innerText = eq.id;
        document.getElementById('det-linea').innerText = eq.linea;
        document.getElementById('det-iccid').innerText = eq.iccid;
        document.getElementById('det-imei').innerText = eq.imei;
        document.getElementById('det-marca').innerText = eq.marca;
        document.getElementById('det-modelo').innerText = eq.modelo;
        document.getElementById('det-cliente').innerText = eq.cliente;
        document.getElementById('det-servicio').innerText = eq.estadoServicio;

        // Guardamos la línea para los comandos SMS
        document.getElementById('det-marca').setAttribute('data-linea', eq.linea);
        
        panel.classList.add('abierto');
    }

    cerrarDetalles() {
        const panel = document.getElementById('panel-detalles');
        if (panel) panel.classList.remove('abierto');
    }

    enviarSMS(accion, lineaDirecta) {
        const numero = lineaDirecta || document.getElementById('det-marca').getAttribute('data-linea');
        if (!numero || numero === 'SIN NÚMERO') {
            alert("No hay un número de línea vinculado para enviar comandos.");
            return;
        }

        // Definimos el comando según la marca si es necesario, o genérico
        const comando = (accion === 'apagar') ? "SA200CMD;123456;02;Enable1" : "SA200CMD;123456;02;Disable1";
        window.open(`sms:${numero}?body=${encodeURIComponent(comando)}`, '_self');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.appSoporte = new SoporteTecnico('grid-salidas');
});
