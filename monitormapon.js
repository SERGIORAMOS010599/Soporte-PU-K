// js/monitormapon.js

class MonitorMapon {
    constructor(containerId, datosFila) {
        this.container = document.getElementById(containerId);
        this.datosUnidades = datosFila; 
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
                    <div id="mapon-filter-info" style="margin-bottom: 15px; cursor: pointer; color: #ffb74d; font-weight: bold; font-size: 14px; padding: 5px; background: #2a2a2a; border-radius: 4px; display: inline-block;">
                        ✅ Mostrando todos los equipos
                    </div>
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
                <div class="mapon-chart-wrapper" style="position: relative; width: 100%; max-width: 450px;">
                    <canvas id="mapon-chart"></canvas>
                </div>
            </div>
        `;

        document.getElementById('mapon-filter-info').addEventListener('click', () => {
            this.filtrarPorEstado(null);
        });
    }

    renderizarTabla(datos) {
        const tbody = document.getElementById('mapon-tbody');
        tbody.innerHTML = ''; 

        datos.forEach(unidad => {
            let compania = unidad['Compañía:'] || unidad['Compañía'] || 'Sin asignar';
            let economico = unidad['Economico'] || 'S/N';
            let estado = unidad['Online status'] || 'Desconocido';
            let ultimoReporte = unidad['Last data received'] || 'Sin fecha';

            const tr = document.createElement('tr');
            let colorEstado = estado === 'OK' ? '#4caf50' : '#f44336'; 
            
            tr.innerHTML = `
                <td>${compania}</td>
                <td>${economico}</td>
                <td style="color: ${colorEstado}; font-weight: bold;">${estado}</td>
                <td>${ultimoReporte}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    renderizarGrafica() {
        const conteoEstados = {};
        this.datosUnidades.forEach(unidad => {
            let estado = unidad['Online status'] || 'Desconocido';
            conteoEstados[estado] = (conteoEstados[estado] || 0) + 1;
        });

        const labels = Object.keys(conteoEstados);
        const dataValues = Object.values(conteoEstados);

        const backgroundColors = labels.map(label => {
            if (label.toUpperCase() === 'OK') return '#4caf50'; 
            if (label.toUpperCase().includes('NODATA')) return '#f44336'; 
            return '#ffb74d'; 
        });

        const ctx = document.getElementById('mapon-chart').getContext('2d');
        if (this.grafica) this.grafica.destroy();

        this.grafica = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: backgroundColors,
                    borderWidth: 2,
                    borderColor: '#1e1e1e' 
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { color: '#ffffff', padding: 20 } },
                    tooltip: { callbacks: { label: function(context) { return ` ${context.label}: ${context.raw} equipos`; } } }
                },
                onClick: (event, elements) => {
                    if (elements && elements.length > 0) {
                        const indexClick = elements[0].index;
                        const estadoSeleccionado = this.grafica.data.labels[indexClick];
                        this.filtrarPorEstado(estadoSeleccionado);
                    }
                }
            }
        });
    }

    filtrarPorEstado(estado) {
        const infoDiv = document.getElementById('mapon-filter-info');
        if (!estado) {
            infoDiv.innerHTML = `✅ Mostrando todos los equipos`;
            infoDiv.style.color = "#ffb74d"; 
            this.renderizarTabla(this.datosUnidades);
        } else {
            infoDiv.innerHTML = `🔍 Filtrando por: <b style="color:white;">${estado}</b> (Clic aquí para ver todos)`;
            infoDiv.style.color = "#4caf50"; 
            const datosFiltrados = this.datosUnidades.filter(u => (u['Online status'] || 'Desconocido') === estado);
            this.renderizarTabla(datosFiltrados);
        }
    }
    function descargarExcel() {
    // 1. Reemplaza 'idDeTuTabla' con el ID real de tu tabla HTML
    let tabla = document.getElementById("idDeTuTabla"); 
    
    // 2. Extraer el nombre del filtro actual (opcional, para el nombre del archivo)
    // Si tu etiqueta de filtro está oculta cuando no hay filtro, detectamos eso:
    let nombreFiltro = "Completo";
    let textoFiltro = document.getElementById("etiquetaFiltro").innerText;
    
    if (textoFiltro && !textoFiltro.includes("oculto")) { // Ajusta esta lógica según cómo ocultes tu texto
        // Extraemos solo el nombre del estado (ej. "NODATA (NOPOWER)")
        nombreFiltro = textoFiltro.replace("🔍 Filtrando por: ", "").replace(" (Clic para quitar filtro)", "");
    }

    // 3. Crear el libro de Excel a partir de la tabla HTML visible
    let libro = XLSX.utils.table_to_book(tabla, { sheet: "Monitor" });
    
    // 4. Forzar la descarga del archivo
    let nombreArchivo = `Reporte_Unidades_${nombreFiltro}.xlsx`;
    XLSX.writeFile(libro, nombreArchivo);
}
}
