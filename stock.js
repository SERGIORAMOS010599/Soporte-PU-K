// js/stock.js

class ControlInventario {
    constructor() {
        this.tbody = document.getElementById('tbody-stock');
        this.inputBuscador = document.getElementById('buscador-stock');
        this.inventarioGlobal = []; 
        
        this.inicializarEventos();
        this.cargarDatos(); // Aquí en el futuro conectaremos con Google Sheets
    }

    inicializarEventos() {
        if (this.inputBuscador) {
            this.inputBuscador.addEventListener('input', (e) => this.filtrarTabla(e.target.value));
        }
    }

    async cargarDatos() {
        // TODO: En la próxima iteración, haremos el fetch() a la hoja "Stock" de tu Google Sheets.
        // Por ahora, usamos datos de prueba para maquetar la tabla.
        this.inventarioGlobal = [
            { id: '1', marca: 'TELTONIKA', modelo: 'FMC130', imei: '351158360010480', iccid: '8952020028397441552', estado: 'DISPONIBLE', ubicacion: 'Oficina Hermosillo' },
            { id: '2', marca: 'TELTONIKA', modelo: 'FMC650', imei: '351158360010481', iccid: 'N/A', estado: 'REVISIÓN', ubicacion: 'Taller' },
            { id: '3', marca: 'SUNTECH', modelo: 'ST300', imei: '863719063804844', iccid: '8952020524694483248', estado: 'ASIGNADO', ubicacion: 'FORD PIPA' }
        ];

        this.renderizarTabla(this.inventarioGlobal);
    }

    renderizarTabla(datos) {
        if (!this.tbody) return;
        this.tbody.innerHTML = '';

        if (datos.length === 0) {
            this.tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color:#777;">No se encontraron equipos en stock.</td></tr>`;
            return;
        }

        datos.forEach(equipo => {
            let claseBadge = 'badge-revision';
            if (equipo.estado === 'DISPONIBLE') claseBadge = 'badge-disponible';
            if (equipo.estado === 'ASIGNADO') claseBadge = 'badge-asignado';

            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td><b>${equipo.marca}</b></td>
                <td>${equipo.modelo}</td>
                <td style="font-family: monospace; letter-spacing: 0.5px;">${equipo.imei}</td>
                <td style="font-family: monospace; letter-spacing: 0.5px;">${equipo.iccid}</td>
                <td><span class="stock-badge ${claseBadge}">${equipo.estado}</span></td>
                <td>${equipo.ubicacion}</td>
                <td>
                    <button class="btn-stock-accion" onclick="appStock.verDetalles('${equipo.imei}')">✏️ Editar</button>
                </td>
            `;
            this.tbody.appendChild(fila);
        });
    }

    filtrarTabla(texto) {
        const query = texto.toLowerCase().trim();
        const filtrados = this.inventarioGlobal.filter(eq => {
            return Object.values(eq).some(valor => 
                String(valor).toLowerCase().includes(query)
            );
        });
        this.renderizarTabla(filtrados);
    }

    verDetalles(imei) {
        // En iteraciones futuras, aquí abriremos un modal o panel lateral para editar ubicación, estado, etc.
        console.log(`Abriendo detalles de edición para el IMEI: ${imei}`);
        alert(`Módulo de edición en construcción. IMEI seleccionado: ${imei}`);
    }
}

// Inicializar la clase cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => { 
    window.appStock = new ControlInventario(); 
});
