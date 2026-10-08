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
            <!-- ELIMINAMOS los overflow restrictivos. Ahora el dashboard se adapta y deja que el navegador ponga la barra maestra si es necesario -->
            <div style="display: flex; flex-direction: row; gap: 15px; position: relative; margin-bottom: 20px;">
                
                <!-- PANEL IZQUIERDO: TABLA -->
                <div style="flex: 2.5; background: #1a1a1a; border-radius: 8px; padding: 15px; border: 1px solid #2a2a2a; box-shadow: inset 0 2px 5px rgba(0,0,0,0.2); display: flex; flex-direction: column;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #333;">
                        <div id="mapon-filter-info" style="cursor: pointer; color: #ffb74d; font-weight: bold; font-size: 11px; padding: 6px 12px; background: rgba(255, 183, 77, 0.1); border-radius: 20px; display: inline-flex; align-items: center; gap: 6px; border: 1px solid rgba(255, 183, 77, 0.3); transition: all 0.2s ease; text-transform: uppercase; letter-spacing: 0.5px;" onmouseover="this.style.background='rgba(255, 183, 77, 0.2)'" onmouseout="this.style.background='rgba(255, 183, 77, 0.1)'">
                            <span>✅</span> Mostrando todos los equipos
                        </div>
                        <button onclick="window.descargarExcelMapon()" style="background: rgba(0, 200, 83, 0.1); color: #00e676; border: 1px solid #00c853; padding: 6px 15px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: bold; text-transform: uppercase; transition: all 0.2s ease; display: flex; align-items: center; gap: 6px; letter-spacing: 0.5px;" title="Descargar vista actual en Excel" onmouseover="this.style.background='#00c853'; this.style.color='#fff';" onmouseout="this.style.background='rgba(0, 200, 83, 0.1)'; this.style.color='#00e676';">
                            <span>📊</span> EXCEL
                        </button>
                    </div>

                    <div style="overflow-y: auto; max-height: 500px; padding-right: 5px;">
                        <table id="tabla-mapon-exportar" style="width: 100%; border-collapse: separate; border-spacing: 0; color: #ccc; font-size: 11px;">
                            <thead style="position: sticky; top: 0; z-index: 2;">
                                <tr>
                                    <th style="padding: 12px 10px; text-align: left; color: #888; border-bottom: 1px solid #444; background: #1a1a1a; text-transform: uppercase; letter-spacing: 0.5px; font-size: 10px;">Compañía</th>
                                    <th style="padding: 12px 10px; text-align: left; color: #888; border-bottom: 1px solid #444; background: #1a1a1a; text-transform: uppercase; letter-spacing: 0.5px; font-size: 10px;">Económico</th>
                                    <th style="padding: 12px 10px; text-align: left; color: #888; border-bottom: 1px solid #444; background: #1a1a1a; text-transform: uppercase; letter-spacing: 0.5px; font-size: 10px;">Marca</th>
                                    <th style="padding: 12px 10px; text-align: left; color: #888; border-bottom: 1px solid #444; background: #1a1a1a; text-transform: uppercase; letter-spacing: 0.5px; font-size: 10px;">Modelo</th>
                                    <th style="padding: 12px 10px; text-align: left; color: #888; border-bottom: 1px solid #444; background: #1a1a1a; text-transform: uppercase; letter-spacing: 0.5px; font-size: 10px;">VIN</th>
                                    <th style="padding: 12px 10px; text-align: left; color: #888; border-bottom: 1px solid #444; background: #1a1a1a; text-transform: uppercase; letter-spacing: 0.5px; font-size: 10px;">Año</th>
                                    <th style="padding: 12px 10px; text-align: left; color: #888; border-bottom: 1px solid #444; background: #1a1a1a; text-transform: uppercase; letter-spacing: 0.5px; font-size: 10px;">ID Serie</th>
                                    <th style="padding: 12px 10px; text-align: left; color: #888; border-bottom: 1px solid #444; background: #1a1a1a; text-transform: uppercase; letter-spacing: 0.5px; font-size: 10px;">GPS</th>
                                    <th style="padding: 12px 10px; text-align: center; color: #888; border-bottom: 1px solid #444; background: #1a1a1a; text-transform: uppercase; letter-spacing: 0.5px; font-size: 10px;">Estado</th>
                                    <th style="padding: 12px 10px; text-align: left; color: #888; border-bottom: 1px solid #444; background: #1a1a1a; text-transform: uppercase; letter-spacing: 0.5px; font-size: 10px;">Últ. Reporte</th>
                                </tr>
                            </thead>
                            <tbody id="mapon-tbody"></tbody>
                        </table>
                    </div>
                </div>

                <!-- PANEL DERECHO: GRÁFICA (SIN BARRA DE SCROLL FEA) -->
                <div style="flex: 1; display: flex; flex-direction: column; background: #1a1a1a; border-radius: 8px; padding: 15px; border: 1px solid #2a2a2a; box-shadow: inset 0 2px 5px rgba(0,0,0,0.2); min-width: 300px; height: fit-content;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #333;">
                        <h4 style="margin: 0; color: #ffb74d; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">📊 Distribución de Estados</h4>
                    </div>
                    <!-- Aumentamos un poco el min-height del canvas para que quepa bien sin forzar scroll -->
                    <div style="position: relative; width: 100%; flex: 1; display: flex; justify-content: center; align-items: center; min-height: 350px;">
                        <canvas id="mapon-chart"></canvas>
                    </div>
                </div>

                <!-- MODAL DE DETALLES -->
                <div id="mapon-modal-detalles" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); z-index: 9999; justify-content: center; align-items: center; backdrop-filter: blur(3px);">
                    <div id="mapon-modal-box" style="background: #1e1e1e; border: 1px solid #ffb74d; width: 90%; max-width: 550px; max-height: 90vh; border-radius: 8px; display: flex; flex-direction: column; box-shadow: 0 10px 25px rgba(0,0,0,0.5); transition: max-width 0.3s ease;">
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid #333; background: #2a2a2a; border-radius: 8px 8px 0 0;">
                            <div style="display: flex; gap: 15px; align-items: center;">
                                <h3 style="margin: 0; color: #ffb74d;" id="modal-titulo-unidad">Detalles del Equipo</h3>
                                <button id="btn-mostrar-soporte" style="display: none; background: rgba(25, 118, 210, 0.1); color: #64b5f6; border: 1px solid #1976d2; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold; transition: 0.2s;">🛠️ Opciones de Soporte</button>
                            </div>
                            <button onclick="document.getElementById('mapon-modal-detalles').style.display='none'; window.equipoEnPantallaMapon = null;" style="background: transparent; color: #aaa; border: none; font-size: 20px; cursor: pointer;">✖</button>
                        </div>
                        
                        <div style="display: flex; flex-direction: row; overflow-y: auto; max-height: calc(90vh - 70px);">
                            <div id="modal-contenido-detalles" style="padding: 20px; color: #ddd; font-size: 13px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; flex: 1; align-content: start; min-height: min-content;"></div>
                            <div id="modal-contenido-soporte" style="display: none; padding: 20px; padding-bottom: 40px; background: #141414; border-left: 1px solid #333; flex: 1; flex-direction: column; gap: 15px; min-height: min-content;"></div>
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
            let marcaUnidad = unidad['Marca'] || unidad['Vehicle brand'] || '-';
            let modeloUnidad = unidad['Modelo'] || unidad['Vehicle model'] || '-';
            let vin = unidad['VIN'] || unidad['Chassis number'] || '-';
            let anio = unidad['Año fabricación'] || unidad['Año'] || unidad['Year'] || '-';
            
            let idSerie = 'S/N';
            for (let key in unidad) {
                let nombreColumna = key.toLowerCase();
                if (nombreColumna.includes('de serie') || nombreColumna === 'imei' || nombreColumna === 'id disp.') {
                    if (unidad[key] && String(unidad[key]).trim() !== '') {
                        idSerie = unidad[key];
                        break; 
                    }
                }
            }
            
            let modelo = unidad['Device model'] || 'Desconocido';
            let estado = unidad['Online status'] || 'Desconocido';
            let ultimoReporte = unidad['Last data received'] || 'Sin fecha';

            let colorTexto = '#fff';
            let colorFondo = 'rgba(158, 158, 158, 0.1)';
            let colorBorde = 'rgba(158, 158, 158, 0.3)';
            let estadoUp = estado.toString().toUpperCase();
            
            if (estadoUp.includes('NODATA')) { colorTexto = '#f44336'; colorFondo = 'rgba(244, 67, 54, 0.1)'; colorBorde = 'rgba(244, 67, 54, 0.3)'; } 
            else if (estadoUp === 'OK') { colorTexto = '#00e676'; colorFondo = 'rgba(0, 230, 118, 0.1)'; colorBorde = 'rgba(0, 230, 118, 0.3)'; } 
            else if (estadoUp.includes('NOGPS')) { colorTexto = '#ffeb3b'; colorFondo = 'rgba(255, 235, 59, 0.1)'; colorBorde = 'rgba(255, 235, 59, 0.3)'; } 
            else if (estadoUp.includes('NOPOWER')) { colorTexto = '#ff9800'; colorFondo = 'rgba(255, 152, 0, 0.1)'; colorBorde = 'rgba(255, 152, 0, 0.3)'; } 
            else { colorTexto = '#9e9e9e'; }

            let badgeEstado = `<span style="background: ${colorFondo}; color: ${colorTexto}; border: 1px solid ${colorBorde}; padding: 4px 8px; border-radius: 12px; font-size: 9px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; white-space: nowrap;">${estado}</span>`;

            const tr = document.createElement('tr');
            tr.style.cssText = "cursor: pointer; transition: background 0.2s;";
            tr.onmouseover = () => tr.style.background = "#222";
            tr.onmouseout = () => tr.style.background = "transparent";
            
            tr.onclick = () => this.abrirModalDetalles(unidad, economico, colorTexto);

            let dataOculta = Object.values(unidad).join(' ');

            tr.innerHTML = `
                <td style="padding: 12px 10px; border-bottom: 1px solid #2a2a2a; color: #ddd;">${compania}</td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #2a2a2a; font-weight: bold; color: #fff;">${economico}</td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #2a2a2a; color: #ccc;">${marcaUnidad}</td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #2a2a2a; color: #ccc;">${modeloUnidad}</td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #2a2a2a; font-size: 10px; color: #888;">${vin}</td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #2a2a2a; color: #ccc;">${anio}</td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #2a2a2a; color: #888;">${idSerie}<span style="display:none;">${dataOculta}</span></td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #2a2a2a; color: #ccc;">${modelo}</td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #2a2a2a; text-align: center;">${badgeEstado}</td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #2a2a2a; font-size: 10px; color: #aaa;">${ultimoReporte}</td>
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
            if (lbl === 'OK') return '#00e676'; 
            if (lbl.includes('NOGPS')) return '#ffeb3b'; 
            if (lbl.includes('NOPOWER')) return '#ff9800';
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
                    borderWidth: 3,
                    borderColor: '#1a1a1a' 
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%', 
                plugins: {
                    legend: { position: 'top', labels: { color: '#ccc', padding: 15, font: {size: 11, family: 'sans-serif'} } }
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
            infoDiv.innerHTML = `<span>✅</span> Mostrando todos los equipos`;
            infoDiv.style.background = "rgba(255, 183, 77, 0.1)";
            infoDiv.style.border = "1px solid rgba(255, 183, 77, 0.3)";
            infoDiv.style.color = "#ffb74d";
            this.renderizarTabla(this.datosUnidades);
        } else {
            infoDiv.innerHTML = `<span>🔍</span> Filtrando: <b style="color:#fff;">${estado}</b> <span style="font-size:10px; margin-left:4px;">(✖)</span>`;
            infoDiv.style.background = "rgba(0, 230, 118, 0.1)";
            infoDiv.style.border = "1px solid rgba(0, 230, 118, 0.3)";
            infoDiv.style.color = "#00e676"; 
            
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
        btnSoporte.style.background = 'rgba(25, 118, 210, 0.1)';
        btnSoporte.style.color = '#64b5f6';
        btnSoporte.style.border = '1px solid #1976d2';

        const contenedor = document.getElementById('modal-contenido-detalles');
        contenedor.innerHTML = ''; 

        if (typeof appSoporte !== 'undefined') {
            window.equipoEnPantallaMapon = unidad;
        }

        Object.keys(unidad).forEach(key => {
            const valor = unidad[key] || '-';
            if(key.trim() !== '' && valor !== '-') {
                let badgeStyle = "";
                let displayValor = valor;

                if (key.toUpperCase() === 'ONLINE STATUS') {
                    badgeStyle = `background: ${colorBorde}15; color: ${colorBorde}; border: 1px solid ${colorBorde}; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; display: inline-block; letter-spacing: 0.5px;`;
                    displayValor = `<span style="${badgeStyle}">${valor}</span>`;
                }

                const divItem = document.createElement('div');
                divItem.style.cssText = `background: #1a1a1a; padding: 12px; border-radius: 6px; border: 1px solid #2a2a2a; border-left: 3px solid ${colorBorde}; position: relative; transition: all 0.2s ease;`;
                divItem.onmouseover = () => divItem.style.borderColor = '#444';
                divItem.onmouseout = () => divItem.style.borderColor = '#2a2a2a';
                
                divItem.innerHTML = `
                    <div style="font-size: 9px; color: #777; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">${key}</div>
                    <div style="font-size: 13px; font-weight: bold; color: #eee; word-break: break-all;">${displayValor}</div>
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
            const iccid = eqSoporteEncontrado.iccid || 'N/A';
            const compania = eqSoporteEncontrado.compania || '';
            // --- DETECCIÓN DINÁMICA DE PLATAFORMA ---
            let modeloUpper = (modelo || '').toUpperCase();
            let btnPlataformaNombre = '';
            let btnPlataformaURL = '';
            let btnPlataformaColor = ''; 
            
            if (modeloUpper.includes('SUNTECH') || modeloUpper.includes('ST4') || modeloUpper.includes('ST3') || modeloUpper.includes('ST8')) {
                btnPlataformaNombre = 'SCUTI WEB';
                btnPlataformaURL = 'https://www.suntechscuti.com/scuti/Login';
                btnPlataformaColor = '#ff9800'; // Naranja
            } else if (modeloUpper.includes('TELTONIKA') || modeloUpper.includes('FMC') || modeloUpper.includes('FMB')) {
                btnPlataformaNombre = 'FOTA WEB';
                btnPlataformaURL = 'https://fota.teltonika.lt/devices?root=27623';
                btnPlataformaColor = '#03a9f4'; // Azul
            } else if (modeloUpper.includes('RUPTELA') || modeloUpper.includes('HCV') || modeloUpper.includes('PRO') || modeloUpper.includes('TRACE')) {
                btnPlataformaNombre = 'DMP WEB';
                btnPlataformaURL = 'https://dmp.ruptela.com/login';
                btnPlataformaColor = '#e91e63'; // Rosa/Rojo
            }

            let btnPlataformaHTML = '';
            if (btnPlataformaNombre !== '') {
                btnPlataformaHTML = `
                    <button onclick="window.open('${btnPlataformaURL}', '_blank')" style="flex: 1; background: rgba(255, 255, 255, 0.05); color: ${btnPlataformaColor}; border: 1px solid ${btnPlataformaColor}; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: bold; text-transform: uppercase; transition: all 0.2s ease; display: flex; justify-content: center; align-items: center; gap: 8px;" onmouseover="this.style.background='${btnPlataformaColor}'; this.style.color='#fff';" onmouseout="this.style.background='rgba(255, 255, 255, 0.05)'; this.style.color='${btnPlataformaColor}';">
                        <span style="font-size: 14px;">☁️</span> ${btnPlataformaNombre}
                    </button>
                `;
            }
            let bloqueJasperModal = '';
            if (compania.toUpperCase().includes('TELCEL')) {
                bloqueJasperModal = `
                    <div style="margin-top: 25px;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                            <h4 style="margin: 0; color: #ffb74d; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">📡 Conectividad M2M</h4>
                            <div style="flex: 1; height: 1px; background: #333;"></div>
                        </div>
                        <button onclick="appSoporte.consultarJasperLinea('${iccid}', 'jasper-modal-box')" 
                                style="background: #1a1a1a; color: #00e676; border: 1px solid #00c853; padding: 10px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 11px; width: 100%; transition: all 0.2s ease; text-transform: uppercase; letter-spacing: 0.5px; display: flex; justify-content: center; align-items: center; gap: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);" 
                                onmouseover="this.style.background='#00c853'; this.style.color='#fff';" 
                                onmouseout="this.style.background='#1a1a1a'; this.style.color='#00e676';">
                            <span style="font-size: 14px;">📶</span> Diagnóstico Telcel Jasper
                        </button>
                        <div id="jasper-modal-box" style="margin-top: 10px;"></div>
                    </div>
                `;
            }

            panelSoporte.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                    <h4 style="margin: 0; color: #ffb74d; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">⚡ Acciones Rápidas</h4>
                    <div style="flex: 1; height: 1px; background: #333;"></div>
                </div>
                <div style="margin-bottom: 15px; font-size: 11px; color: #888;">Línea vinculada: <b style="color: #ccc; letter-spacing: 0.5px;">${linea}</b></div>
                
                <div class="panel-botones" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 25px;">
                    <button onclick="appSoporte.enviarSMS('apagar', '${id}')" style="background: rgba(244, 67, 54, 0.1); color: #ef5350; border: 1px solid #d32f2f; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: bold; text-transform: uppercase; transition: all 0.2s ease; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='#d32f2f'; this.style.color='#fff';" onmouseout="this.style.background='rgba(244, 67, 54, 0.1)'; this.style.color='#ef5350';">
                        <span style="font-size: 14px;">⏻</span> APAGAR
                    </button>
                    <button onclick="appSoporte.enviarSMS('encender', '${id}')" style="background: rgba(76, 175, 80, 0.1); color: #66bb6a; border: 1px solid #388e3c; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: bold; text-transform: uppercase; transition: all 0.2s ease; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='#388e3c'; this.style.color='#fff';" onmouseout="this.style.background='rgba(76, 175, 80, 0.1)'; this.style.color='#66bb6a';">
                        <span style="font-size: 14px;">⏻</span> ENCENDER
                    </button>
                    <button onclick="appSoporte.enviarSMS('configuracion', '${id}')" style="background: rgba(255, 152, 0, 0.1); color: #ffa726; border: 1px solid #f57c00; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: bold; text-transform: uppercase; transition: all 0.2s ease; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='#f57c00'; this.style.color='#fff';" onmouseout="this.style.background='rgba(255, 152, 0, 0.1)'; this.style.color='#ffa726';">
                        <span style="font-size: 14px;">⚙️</span> CONFIG
                    </button>
                    <button onclick="appSoporte.enviarSMS('reiniciar', '${id}')" style="background: rgba(255, 152, 0, 0.1); color: #ffa726; border: 1px solid #f57c00; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: bold; text-transform: uppercase; transition: all 0.2s ease; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='#f57c00'; this.style.color='#fff';" onmouseout="this.style.background='rgba(255, 152, 0, 0.1)'; this.style.color='#ffa726';">
                        <span style="font-size: 14px;">⟳</span> REINICIAR
                    </button>
                    <button onclick="appSoporte.enviarSMS('borrar', '${id}')" style="background: rgba(255, 87, 34, 0.1); color: #ff7043; border: 1px solid #e64a19; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: bold; text-transform: uppercase; transition: all 0.2s ease; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='#e64a19'; this.style.color='#fff';" onmouseout="this.style.background='rgba(255, 87, 34, 0.1)'; this.style.color='#ff7043';">
                        <span style="font-size: 14px;">🗑️</span> BORRAR
                    </button>
                    <button onclick="appSoporte.enviarSMS('formatear', '${id}')" style="background: rgba(211, 47, 47, 0.1); color: #ef5350; border: 1px solid #d32f2f; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: bold; text-transform: uppercase; transition: all 0.2s ease; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='#d32f2f'; this.style.color='#fff';" onmouseout="this.style.background='rgba(211, 47, 47, 0.1)'; this.style.color='#ef5350';">
                        <span style="font-size: 14px;">⌫</span> FORMATO
                    </button>
                </div>
                
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                    <h4 style="margin: 0; color: #ffb74d; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">🔗 Enlaces Externos</h4>
                    <div style="flex: 1; height: 1px; background: #333;"></div>
                </div>
                
                <div class="panel-botones" style="display: flex; gap: 8px;">
                    <button onclick="window.open('https://soporte.zeekgps.com/ZeekSoporte/', '_blank')" style="flex: 1; background: rgba(33, 150, 243, 0.1); color: #42a5f5; border: 1px solid #1976d2; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: bold; text-transform: uppercase; transition: all 0.2s ease; display: flex; justify-content: center; align-items: center; gap: 8px;" onmouseover="this.style.background='#1976d2'; this.style.color='#fff';" onmouseout="this.style.background='rgba(33, 150, 243, 0.1)'; this.style.color='#42a5f5';">
                        <span style="font-size: 14px;">🛠️</span> ZEEK
                    </button>
                    <button onclick="window.open('https://mapon.com/partner/gbox_new/', '_blank')" style="flex: 1; background: rgba(0, 200, 83, 0.1); color: #69f0ae; border: 1px solid #00c853; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: bold; text-transform: uppercase; transition: all 0.2s ease; display: flex; justify-content: center; align-items: center; gap: 8px;" onmouseover="this.style.background='#00c853'; this.style.color='#fff';" onmouseout="this.style.background='rgba(0, 200, 83, 0.1)'; this.style.color='#69f0ae';">
                        <span style="font-size: 14px;">📍</span> MAPON
                    </button>
                    ${btnPlataformaHTML}
                </div>
                
                ${bloqueJasperModal}
            `;
            
            btnSoporte.onclick = () => {
                if (panelSoporte.style.display === 'none') {
                    panelSoporte.style.display = 'flex';
                    modalBox.style.maxWidth = '850px'; 
                    btnSoporte.innerHTML = '◀ Ocultar Soporte';
                    btnSoporte.style.background = 'rgba(255, 255, 255, 0.05)';
                    btnSoporte.style.color = '#ccc';
                    btnSoporte.style.border = '1px solid #444';
                } else {
                    panelSoporte.style.display = 'none';
                    modalBox.style.maxWidth = '550px'; 
                    btnSoporte.innerHTML = '🛠️ Opciones de Soporte';
                    btnSoporte.style.background = 'rgba(25, 118, 210, 0.1)';
                    btnSoporte.style.color = '#64b5f6';
                    btnSoporte.style.border = '1px solid #1976d2';
                }
            };
        }
    }
}
