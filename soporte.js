class SoporteTecnico {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        // ID de tu Google Sheet de Soporte PU-K
        this.sheetId = '1JpRyU-cFuGpmZpfuTil7FicbyFUrX3GS_nMUZLSUKKM';
        this.equipos = [];
        this.lineasMapa = new Map();
        this.loadData();
    }

    async loadData() {
        if (!this.container) return;
        this.container.innerHTML = '<p style="text-align:center; width:100%; color: #ffb74d;">Cargando equipos y telemetría...</p>';

        const url = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:json`;

        try {
            const response = await fetch(url);
            const text = await response.text();
            // Limpieza estándar de la respuesta de Google Sheets
            const json = JSON.parse(text.substring(47).slice(0, -2));
            const rows = json.table.rows;

            this.equipos = [];

            rows.forEach((row, index) => {
                // Omitimos la fila de encabezados
                if (row && row.c && row.c[0] && row.c[0].v !== 'ID') {
                    const equipo = {
                        id: row.c[0] ? row.c[0].v : 'N/A',
                        unidad: row.c[1] ? row.c[1].v : 'SIN UNIDAD',
                        cliente: row.c[2] ? row.c[2].v : 'SIN CLIENTE',
                        marca: row.c[3] ? row.c[3].v : 'SIN MARCA',
                        modelo: row.c[4] ? row.c[4].v : 'N/A',
                        servicio: row.c[5] ? row.c[5].v : 'PENDIENTE',
                        iccid: row.c[6] ? row.c[6].v : '',
                        imei: row.c[7] ? row.c[7].v : '',
                        estado: row.c[8] ? row.c[8].v : 'N/A'
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
            this.container.innerHTML = '<p style="text-align:center; width:100%; color:#a0a0a0;">No hay equipos registrados.</p>';
            return;
        }

        this.equipos.forEach(eq => {
            const div = document.createElement('div');
            div.className = 'tarjeta-gps';
            div.innerHTML = `
                <div class="tarjeta-unidad">${eq.unidad}</div>
                <div class="tarjeta-cliente">${eq.cliente} ${eq.id}</div>
                <h2 class="tarjeta-marca">${eq.marca}</h2>
                <div class="tarjeta-modelo">${eq.modelo}</div>
                <div class="tarjeta-servicio">${eq.servicio}</div>
                <div class="tarjeta-acciones">
                    <div class="accion-btn rojo">APAGAR <span class="circulo"></span></div>
                    <div class="accion-btn verde">ENCENDER <span class="circulo"></span></div>
                </div>
            `;
            div.onclick = () => this.abrirDetalles(eq);
            this.container.appendChild(div);
        });
    }

    abrirDetalles(eq) {
        const panel = document.getElementById('panel-detalles');
        if (!panel) return;

        // Llenamos los datos en el panel lateral exactamente igual que en tu otro proyecto
        document.getElementById('det-titulo').innerText = `${eq.cliente} (${eq.id})`;
        document.getElementById('det-id').innerText = eq.id;
        document.getElementById('det-linea').innerText = eq.iccid || 'NO ENCONTRADA';
        document.getElementById('det-iccid').innerText = eq.iccid || 'N/A';
        document.getElementById('det-imei').innerText = eq.imei || eq.id;
        document.getElementById('det-marca').innerText = eq.marca;
        document.getElementById('det-modelo').innerText = eq.modelo;
        document.getElementById('det-cliente').innerText = eq.cliente;
        document.getElementById('det-servicio').innerText = eq.servicio;

        // Guardamos la línea para los comandos SMS
        document.getElementById('det-marca').setAttribute('data-linea', eq.iccid || '');
        
        panel.classList.add('abierto');
    }

    cerrarDetalles() {
        const panel = document.getElementById('panel-detalles');
        if (panel) panel.classList.remove('abierto');
    }

    enviarSMS(accion) {
        const numero = document.getElementById('det-marca').getAttribute('data-linea');
        if (!numero || numero === 'NO ENCONTRADA') {
            alert("No hay un número vinculado para enviar comandos.");
            return;
        }
        const comando = (accion === 'apagar') ? "SA200CMD;123456;02;Enable1" : "SA200CMD;123456;02;Disable1";
        window.open(`sms:${numero}?body=${encodeURIComponent(comando)}`, '_self');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.appSoporte = new SoporteTecnico('grid-salidas');
});
