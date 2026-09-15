class MonitorMapon {
    constructor(containerId, datosFila) {
        this.container = document.getElementById(containerId);
        this.datosUnidades = datosFila; // El universo completo de equipos de Mapon
        this.grafica = null; // Guardamos la gráfica por si la necesitamos actualizar
        this.inicializar();
    }

    inicializar() {
        this.renderizarEstructura();
        this.renderizarTabla(this.datosUnidades);
        this.renderizarGrafica();
    }

    renderizarEstructura() {
        // Estructura HTML inyectada dinámicamente
        this.container.innerHTML = `
            <div class="monitor-container">
                <div class="mapon-table-wrapper">
                    <!-- Botón/Texto para limpiar el filtro -->
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

        // Evento para limpiar el filtro al darle clic al aviso
        document.getElementById('mapon-filter-info').addEventListener('click', () => {
            this.filtrarPorEstado(null);
        });
    }

    renderizarTabla(datos) {
        const tbody = document.getElementById('mapon-tbody');
        tbody.innerHTML = ''; // Limpiar la tabla antes de llenarla

        datos.forEach(unidad => {
            // Extraer las columnas exactas tal como vienen de tu script de Python / Google Sheets
            let compania = unidad['Compañía:'] || unidad['Compañía'] || 'Sin asignar';
            let economico = unidad['Economico'] || 'S/N';
            let estado = unidad['Online status'] || 'Desconocido';
            let ultimoReporte = unidad['Last data received'] || 'Sin fecha';

            const tr = document.createElement('tr');
            
            // Colores condicionales en texto
            let colorEstado = estado === 'OK' ? '#4caf50' : '#f44336'; // Verde para OK, Rojo para lo demás
            
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
        // 1. Contar cuántos equipos hay por cada estado
        const conteoEstados = {};
        this.datosUnidades.forEach(unidad => {
            let estado = unidad['Online status'] || 'Desconocido';
            conteoEstados[estado] = (conteoEstados[estado] || 0) + 1;
        });

        const labels = Object.keys(conteoEstados);
        const dataValues = Object.values(conteoEstados);

        // 2. Asignar colores chulos dependiendo del estado (Dark Mode compatible)
        const backgroundColors = labels.map(label => {
            if (label.toUpperCase() === 'OK') return '#4caf50'; // Verde
            if (label.toUpperCase().includes('NODATA')) return '#f44336'; // Rojo alerta
            return '#ffb74d'; // Naranja Mapon para estados raros
        });

        // 3. Obtener el lienzo (Canvas)
        const ctx = document.getElementById('mapon-chart').getContext('2d');
        
        // Si ya había una gráfica (por ejemplo, si se refresca la info), la destruimos para redibujar
        if (this.grafica) {
            this.grafica.destroy();
        }

        // 4. Dibujar la Gráfica Dona con Chart.js
        this.grafica = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: backgroundColors,
                    borderWidth: 2,
                    borderColor: '#1e1e1e' // Borde oscuro para que contraste con tu fondo
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { 
                            color: '#ffffff', // Letras blancas de la leyenda
                            padding: 20
                        } 
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` ${context.label}: ${context.raw} equipos`;
                            }
                        }
                    }
                },
                // LA MAGIA: Evento clic en las rebanadas
                onClick: (event, elements) => {
                    if (elements && elements.length > 0) {
                        // Saber a qué rebanada se le dio clic
                        const indexClick = elements[0].index;
                        const estadoSeleccionado = this.grafica.data.labels[indexClick];
                        
                        // Llamar a nuestra función de filtrado
                        this.filtrarPorEstado(estadoSeleccionado);
                    }
                }
            }
        });
    }

    filtrarPorEstado(estado) {
        const infoDiv = document.getElementById('mapon-filter-info');
        
        if (!estado) {
            // Si le mandamos 'null', limpia el filtro y muestra todo
            infoDiv.innerHTML = `✅ Mostrando todos los equipos`;
            infoDiv.style.color = "#ffb74d"; // Vuelve a naranja
            this.renderizarTabla(this.datosUnidades);
        } else {
            // Si hay un estado, filtra el arreglo original y lo pinta
            infoDiv.innerHTML = `🔍 Filtrando por: <b style="color:white;">${estado}</b> (Clic aquí para ver todos)`;
            infoDiv.style.color = "#4caf50"; // Se pone verde para avisar que está filtrado
            
            const datosFiltrados = this.datosUnidades.filter(u => (u['Online status'] || 'Desconocido') === estado);
            this.renderizarTabla(datosFiltrados);
        }
    }
}
