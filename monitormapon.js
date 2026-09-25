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
            <div style="display: flex; flex-direction: row; gap: 20px; background: #1a1a1a; padding: 15px; border-radius: 8px; border: 1px solid #333; height: 500px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); position: relative;">
        
        <div style="flex: 2; overflow-y: auto; background: #141414; border-radius: 6px; padding: 10px; position: relative;">
            
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                <div id="mapon-filter-info" style="cursor: pointer; color: #ffb74d; font-weight: bold; font-size: 14px; padding: 5px 10px; background: #2a2a2a; border-radius: 4px; display: inline-block; border: 1px solid #444;">
                    ✅ Mostrando todos los equipos
                </div>
                <button onclick="window.descargarExcelMapon()" style="width: 35px; height: 35px; background-color: #1D6F42; color: white; border: 1px solid #145230; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold; display: flex; justify-content: center; align-items: center;" title="Descargar vista actual en Excel">
                    XLSX
                </button>
            </div>

            <table id="tabla-mapon-exportar" style="width: 100%; border-collapse: collapse; color: #fff; font-size: 13px;">
                <thead style="background: #1e1e1e; position: sticky; top: 0; z-index: 2;">
                    <tr>
                        <th style="padding: 10px; text-align: left; color: #ffb74d; border-bottom: 1px solid #333;">Compañía</th>
                        <th style="padding: 10px; text-align: left; color: #ffb74d; border-bottom: 1px solid #333;">Económico</th>
                        <th style="padding: 10px; text-align: left; color: #ffb74d; border-bottom: 1px solid #333;">ID (Serie)</th>
                        <th style="padding: 10px; text-align: left; color: #ffb74d; border-bottom: 1px solid #333;">Modelo GPS</th>
                        <th style="padding: 10px; text-align: left; color: #ffb74d; border-bottom: 1px solid #333;">Estado</th>
                        <th style="padding: 10px; text-align: left; color: #ffb74d; border-bottom: 1px solid #333;">Último Reporte</th>
                    </tr>
                </thead>
                <tbody id="mapon-tbody"></tbody>
            </table>
        </div>

        <div style="flex: 1; display: flex; justify-content: center; align-items: center; background: #141414; border-radius: 6px; padding: 10px; max-width: 400px;">
            <div style="position: relative; width: 100%; height: 100%;">
                <canvas id="mapon-chart"></canvas>
            </div>
        </div>

        <!-- MODAL DE DETALLES AMPLIADO PARA SOPORTE -->
        <div id="mapon-modal-detalles" style="display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 10; border-radius: 8px; justify-content: center; align-items: center; backdrop-filter: blur(3px);">
            
            <div id="mapon-modal-box" style="background: #1e1e1e; border: 1px solid #ffb74d; width: 90%; max-width: 550px; max-height: 95%; border-radius: 8px; display: flex; flex-direction: column; box-shadow: 0 10px 25px rgba(0,0,0,0.5); transition: max-width 0.3s ease;">
                
                <!-- ENCABEZADO DEL MODAL -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid #333; background: #2a2a2a; border-radius: 8px 8px 0 0;">
                    <div style="display: flex; gap: 15px; align-items: center;">
                        <h3 style="margin: 0; color: #ffb74d;" id="modal-titulo-unidad">Detalles del Equipo</h3>
                        <button id="btn-mostrar-soporte" style="display: none; background: #1976d2; color: white; border: 1px solid #115293; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold; transition: 0.2s;">🛠️ Opciones de Soporte</button>
                    </div>
                    <button onclick="document.getElementById('mapon-modal-detalles').style.display='none'; window.equipoEnPantallaMapon = null;" style="background: transparent; color: #aaa; border: none; font-size: 20px; cursor: pointer;">✖</button>
                </div>
                
                <!-- CONTENEDOR DIVIDIDO (IZQ: Mapon | DER: Soporte) -->
                <div style="display: flex; flex-direction: row; overflow-y: auto; max-height: calc(100vh - 100px);">
                    
                    <!-- COLUMNA IZQUIERDA: Info Mapon Original -->
                    <div id="modal-contenido-detalles" style="padding: 20px; color: #ddd; font-size: 13px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; flex: 1; align-content: start;">
                    </div>
                    
                    <!-- COLUMNA DERECHA: Comandos y Datos de Inventario (Oculto por defecto) -->
                    <div id="modal-contenido-soporte" style="display: none; padding: 20px; background: #141414; border-left: 1px solid #333; flex: 1; flex-direction: column; gap: 15px;">
                    </div>

                </div>
            </div>
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

        let datosOrdenados = [...datos].sort((a, b) => {
            let compA = (a['Compañía:'] || a['Compañía'] || 'Sin asignar').toUpperCase();
            let compB = (b['Compañía:'] || b['Compañía'] || 'Sin asignar').toUpperCase();
            
            if (compA < compB) return -1;
            if (compA > compB) return 1;

            let estA = (a['Online status'] || 'Desconocido').toUpperCase();
            let estB = (b['Online status'] || 'Desconocido').toUpperCase();
            
            if (estA < estB) return -1;
            if (estA > estB) return 1;

            return 0;
        });

        datosOrdenados.forEach((unidad, index) => {
            let compania = unidad['Compañía:'] || unidad['Compañía'] || 'Sin asignar';
            let economico = unidad['Economico'] || unidad['Name'] || 'S/N';
            
            // 1. EXTRACCIÓN EXACTA (Solo busca la columna de Número de Serie, ignorando ID disp)
            let idSerie = 'S/N';
            for (let key in unidad) {
                let nombreColumna = key.toLowerCase();
                // Al buscar explícitamente "de serie", nos aseguramos de atrapar "núm. de serie" sin importar acentos
                if (nombreColumna.includes('de serie')) {
                    if (unidad[key] && String(unidad[key]).trim() !== '') {
                        idSerie = unidad[key];
                        break; 
                    }
                }
            }
            
            let modelo = unidad['Device model'] || 'Desconocido';
            let estado = unidad['Online status'] || 'Desconocido';
            let ultimoReporte = unidad['Last data received'] || 'Sin fecha';

            let colorEstado = '#fff';
            let estadoUp = estado.toUpperCase();
            if (estadoUp.includes('NODATA')) colorEstado = '#f44336'; 
            else if (estadoUp === 'OK') colorEstado = '#4caf50'; 
            else if (estadoUp.includes('NOGPS')) colorEstado = '#ffeb3b'; 
            else colorEstado = '#ffb74d'; 

            const tr = document.createElement('tr');
            tr.style.cssText = "cursor: pointer; transition: background 0.2s;";
            tr.onmouseover = () => tr.style.background = "#2a2a2a";
            tr.onmouseout = () => tr.style.background = "transparent";
            
            tr.onclick = () => this.abrirModalDetalles(unidad, economico, colorEstado);

            // 2. EL TRUCO MAESTRO: Texto oculto para el buscador universal
            let dataOculta = Object.values(unidad).join(' ');

            tr.innerHTML = `
                <td style="padding: 10px; border-bottom: 1px solid #333;">${compania}</td>
                <td style="padding: 10px; border-bottom: 1px solid #333; font-weight: bold;">${economico}</td>
                <td style="padding: 10px; border-bottom: 1px solid #333; color: #aaa;">
                    ${idSerie}
                    <span style="display:none;">${dataOculta}</span>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #333;">${modelo}</td>
                <td style="padding: 10px; border-bottom: 1px solid #333; color: ${colorEstado}; font-weight: bold;">${estado}</td>
                <td style="padding: 10px; border-bottom: 1px solid #333; font-size: 12px;">${ultimoReporte}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    renderizarGrafica() {
        const conteoEstados = {};
        this.datosUnidades.forEach(unidad => {
            let estado = (unidad['Online status'] || 'Desconocido').toString().trim();
            conteoEstados[estado] = (conteoEstados[estado] || 0) + 1;
        });

        const labels = Object.keys(conteoEstados);
        const dataValues = Object.values(conteoEstados);

        const backgroundColors = labels.map(label => {
            let lbl = label.toUpperCase();
            if (lbl.includes('NODATA')) return '#f44336'; 
            if (lbl === 'OK') return '#4caf50'; 
            if (lbl.includes('NOGPS')) return '#ffeb3b'; 
            return '#9e9e9e'; 
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
                    legend: { position: 'top', labels: { color: '#ffffff', padding: 15, font: {size: 11} } }
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
            infoDiv.innerHTML = `🔍 Filtrando por: <b style="color:white;">${estado}</b> (Clic para quitar filtro)`;
            infoDiv.style.color = "#4caf50"; 
            const datosFiltrados = this.datosUnidades.filter(u => (u['Online status'] || 'Desconocido') === estado);
            this.renderizarTabla(datosFiltrados);
        }
    }

    abrirModalDetalles(unidad, nombreUnidad, colorBorde) {
        document.getElementById('modal-titulo-unidad').innerText = nombreUnidad;
        document.getElementById('mapon-modal-detalles').style.display = 'flex';
        
        const modalBox = document.getElementById('mapon-modal-box');
        modalBox.style.maxWidth = '550px'; 
        
        const panelSoporte = document.getElementById('modal-contenido-soporte');
        panelSoporte.style.display = 'none';
        
        const btnSoporte = document.getElementById('btn-mostrar-soporte');
        btnSoporte.style.display = 'none';
        btnSoporte.innerText = '🛠️ Opciones de Soporte';
        btnSoporte.style.background = '#1976d2';

        const contenedor = document.getElementById('modal-contenido-detalles');
        contenedor.innerHTML = ''; 

        if (typeof appSoporte !== 'undefined') {
            window.equipoEnPantallaMapon = unidad;
        }

        Object.keys(unidad).forEach(key => {
            const valor = unidad[key] || '-';
            if(key.trim() !== '' && valor !== '-') {
                const divItem = document.createElement('div');
                divItem.style.cssText = "background: #222; padding: 10px; border-radius: 4px; border-left: 3px solid " + colorBorde + ";";
                divItem.innerHTML = `
                    <div style="font-size: 10px; color: #888; text-transform: uppercase; margin-bottom: 3px;">${key}</div>
                    <div style="font-size: 13px; font-weight: bold; word-break: break-all;">${valor}</div>
                `;
                contenedor.appendChild(divItem);
            }
        });

        let rawNumSerieMapon = unidad['Núm. de serie'] || unidad['ID DISP.'] || unidad['IMEI'] || '';
        const numSerieMapon = String(rawNumSerieMapon).replace(/\.0$/, '').replace(/\s+/g, '').trim().toLowerCase();
        
        let eqSoporteEncontrado = null;
        
        if (window.appSoporte && window.appSoporte.equipos && numSerieMapon && numSerieMapon !== 's/n' && numSerieMapon !== 'sindato') {
            eqSoporteEncontrado = window.appSoporte.equipos.find(e => {
                const idSalida = String(e.id).replace(/\.0$/, '').replace(/\s+/g, '').trim().toLowerCase();
                return idSalida === numSerieMapon || 
                       (e.imei && String(e.imei).replace(/\s+/g, '').toLowerCase() === numSerieMapon);
            });
        }

        if (eqSoporteEncontrado) {
            btnSoporte.style.display = 'block';
            
            const id = eqSoporteEncontrado.id;
            const linea = eqSoporteEncontrado.linea || 'N/A';
            const imei = eqSoporteEncontrado.imei || 'N/A';
            
            panelSoporte.innerHTML = `
                <div style="border-bottom: 1px solid #444; padding-bottom: 5px; margin-bottom: 10px;">
                    <h4 style="margin: 0; color: #ffb74d;">Acciones Rápidas</h4>
                    <span style="font-size: 11px; color: #888;">Línea conectada: <b>${linea}</b></span>
                </div>
                
                <div class="panel-botones" style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-start;">
                    <button class="btn-accion" style="flex: 1 1 30%; padding: 8px 5px; font-size: 9px; min-height: unset; flex-direction: row; gap: 8px; justify-content: flex-start;" onclick="appSoporte.enviarSMS('apagar', '${id}')">
                        <div class="icono" style="background-color: #d32f2f; width: 22px; height: 22px; font-size: 12px; line-height: 22px; margin: 0;">⏻</div>APAGAR
                    </button>
                    <button class="btn-accion" style="flex: 1 1 30%; padding: 8px 5px; font-size: 9px; min-height: unset; flex-direction: row; gap: 8px; justify-content: flex-start;" onclick="appSoporte.enviarSMS('encender', '${id}')">
                        <div class="icono" style="background-color: #388e3c; width: 22px; height: 22px; font-size: 12px; line-height: 22px; margin: 0;">⏻</div>ENCENDER
                    </button>
                    <button class="btn-accion" style="flex: 1 1 30%; padding: 8px 5px; font-size: 9px; min-height: unset; flex-direction: row; gap: 8px; justify-content: flex-start;" onclick="appSoporte.enviarSMS('configuracion', '${id}')">
                        <div class="icono" style="background-color: #ffb74d; width: 22px; height: 22px; font-size: 12px; line-height: 22px; margin: 0;">?</div>CONFIG.
                    </button>
                    <button class="btn-accion" style="flex: 1 1 30%; padding: 8px 5px; font-size: 9px; min-height: unset; flex-direction: row; gap: 8px; justify-content: flex-start;" onclick="appSoporte.enviarSMS('reiniciar', '${id}')">
                        <div class="icono" style="background-color: #f57c00; width: 22px; height: 22px; font-size: 12px; line-height: 22px; margin: 0;">⟳</div>REINICIAR
                    </button>
                    <button class="btn-accion" style="flex: 1 1 30%; padding: 8px 5px; font-size: 9px; min-height: unset; flex-direction: row; gap: 8px; justify-content: flex-start;" onclick="appSoporte.enviarSMS('borrar', '${id}')">
                        <div class="icono" style="background-color: #f57c00; width: 22px; height: 22px; font-size: 12px; line-height: 22px; margin: 0;">🗑️</div>BORRAR
                    </button>
                    <button class="btn-accion" style="flex: 1 1 30%; padding: 8px 5px; font-size: 9px; min-height: unset; flex-direction: row; gap: 8px; justify-content: flex-start;" onclick="appSoporte.enviarSMS('formatear', '${id}')">
                        <div class="icono" style="background-color: #d32f2f; width: 22px; height: 22px; font-size: 12px; line-height: 22px; margin: 0;">⌫</div>FORMATO
                    </button>
                </div>
                
                <div style="border-bottom: 1px solid #444; padding-bottom: 5px; margin-top: 15px; margin-bottom: 10px;">
                    <h4 style="margin: 0; color: #ffb74d;">Enlaces Externos</h4>
                </div>
                
                <div class="panel-botones" style="display: flex; gap: 10px;">
                    <button class="btn-accion" style="flex: 1; padding: 8px 5px; font-size: 10px; min-height: unset; flex-direction: row; gap: 8px;" onclick="window.open('https://soporte.zeekgps.com/ZeekSoporte/', '_blank')">
                        <div class="icono" style="background-color: #1976d2; width: 22px; height: 22px; font-size: 12px; line-height: 22px; margin: 0;">🛠️</div>ZEEK
                    </button>
                    <button class="btn-accion" style="flex: 1; padding: 8px 5px; font-size: 10px; min-height: unset; flex-direction: row; gap: 8px;" onclick="window.open('https://mapon.com/partner/gbox_new/', '_blank')">
                        <div class="icono" style="background-color: #00c853; width: 22px; height: 22px; font-size: 12px; line-height: 22px; margin: 0;">📍</div>MAPON
                    </button>
                </div>
            `;
            
            btnSoporte.onclick = () => {
                if (panelSoporte.style.display === 'none') {
                    panelSoporte.style.display = 'flex';
                    modalBox.style.maxWidth = '850px'; 
                    btnSoporte.innerText = '◀ Ocultar Soporte';
                    btnSoporte.style.background = '#444';
                    btnSoporte.style.border = '1px solid #666';
                } else {
                    panelSoporte.style.display = 'none';
                    modalBox.style.maxWidth = '550px'; 
                    btnSoporte.innerText = '🛠️ Opciones de Soporte';
                    btnSoporte.style.background = '#1976d2';
                    btnSoporte.style.border = '1px solid #115293';
                }
            };
        }
    }
}
