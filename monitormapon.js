// js/monitormapon.js
class MonitorMapon {
    constructor(containerId, datosFila) {
        this.container = document.getElementById(containerId);
        this.datosUnidades = datosFila; // Array de objetos con todo el inventario
        this.grafica = null;
        this.inicializar();
    }

    inicializar() {
        this.renderizarEstructura();
        this.renderizarTabla(this.datosUnidades);
        this.renderizarGrafica();
    }

    renderizarEstructura() {
        this.container.innerHTML = `
            <div class="monitor-container">
                <div class="mapon-table-wrapper">
                    <table class="mapon-table">
                        <thead>
                            <tr>
                                <th>Compañía</th>
                                <th>Económico</th>
                                <th>Estado</th>
                                <th>Último Reporte</th>
                            </tr>
                        </thead>
                        <tbody id="mapon-tbody"></tbody>
                    </table>
                </div>
                <div class="mapon-chart-wrapper">
                    <canvas id="mapon-chart"></canvas>
                </div>
            </div>
        `;
    }

    renderizarTabla(datos) {
        const tbody = document.getElementById('mapon-tbody');
        tbody.innerHTML = ''; 

        datos.forEach(unidad => {
            const tr = document.createElement('tr');
            // Formato condicional básico para el color del estado
            let colorEstado = unidad.estado === 'OK' ? '#4caf50' : '#f44336';
            
            tr.innerHTML = `
                <td>${unidad.compania}</td>
                <td>${unidad.economico}</td>
                <td style="color: ${colorEstado}; font-weight: bold;">${unidad.estado}</td>
                <td>${unidad.ultimoReporte}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    renderizarGrafica() {
        // Aquí integraremos Chart.js para dibujar la dona.
        // Al darle clic a una sección, llamaremos a this.filtrarPorEstado(estadoSeleccionado)
        console.log("Preparando gráfica interactiva de Mapon...");
    }

    filtrarPorEstado(estado) {
        if (!estado) {
            this.renderizarTabla(this.datosUnidades); // Mostrar todo
            return;
        }
        const datosFiltrados = this.datosUnidades.filter(u => u.estado === estado);
        this.renderizarTabla(datosFiltrados);
    }
}
