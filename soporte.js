class SoporteTecnico {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.sheetId = '18gsvPp2HSMR0DKIfYfZijnwc_PyNV7ULch-UDEVupV0'; // El ID de tu sheet
        this.equipos = [];
        this.lineasMapa = new Map();
    }

    async loadData() {
        const url = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:json`;
        try {
            const response = await fetch(url);
            const text = await response.text();
            const json = JSON.parse(text.substring(47).slice(0, -2));
            const rows = json.table.rows;
            
            // Asumimos que la fila 0 son encabezados
            this.equipos = rows.map(row => ({
                id: row.c[0]?.v,
                unidad: row.c[1]?.v,
                cliente: row.c[2]?.v,
                marca: row.c[3]?.v,
                modelo: row.c[4]?.v,
                servicio: row.c[5]?.v,
                iccid: row.c[6]?.v
            })).filter(item => item.id); // Solo registros con ID
            
            this.render();
        } catch (error) {
            console.error("Error al cargar Sheets:", error);
        }
    }

    render() {
        this.container.innerHTML = '';
        this.equipos.forEach(eq => {
            const card = document.createElement('div');
            card.className = 'tarjeta-gps';
            card.onclick = () => this.abrirDetalles(eq);
            card.innerHTML = `
                <div class="tarjeta-unidad">${eq.unidad || 'SIN UNIDAD'}</div>
                <div class="tarjeta-cliente">${eq.cliente} ${eq.id}</div>
                <h2 class="tarjeta-marca">${eq.marca}</h2>
                <div class="tarjeta-modelo">${eq.modelo}</div>
                <div class="tarjeta-servicio">${eq.servicio || 'PENDIENTE'}</div>
            `;
            this.container.appendChild(card);
        });
    }

    abrirDetalles(eq) {
        document.getElementById('det-id').innerText = eq.id;
        document.getElementById('det-linea').innerText = eq.iccid || 'N/A';
        document.getElementById('det-marca').innerText = eq.marca;
        // ... aquí llenarás el resto de tus campos como en el otro proyecto
        document.getElementById('panel-detalles').classList.add('abierto');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.appSoporte = new SoporteTecnico('grid-salidas');
    window.appSoporte.loadData();
});
