// js/soporte.js

class SoporteTecnico {
    // --- CONSULTA Y CONTROL EN VIVO DE JASPER / TELCEL ---
    async consultarJasperLinea(iccidUnidad, containerId = 'jasper-resultado-box') {
        const contenedorResultado = document.getElementById(containerId);
        
        if (!iccidUnidad || iccidUnidad === 'N/A' || iccidUnidad === 'S/N') {
            if (contenedorResultado) {
                contenedorResultado.innerHTML = '<span style="color: #ff4c4c;">❌ Este equipo no tiene un ICCID válido registrado.</span>';
            }
            return;
        }

        // --- MAGIA: Rescatar el IMEI de la UI para mandarlo a cortar ---
        let imeiParaCortar = "N/A";
        const spanImei = document.getElementById('det-imei');
        if (spanImei && spanImei.innerText !== '---' && spanImei.innerText !== '') {
            imeiParaCortar = spanImei.innerText.trim();
        } else if (window.equipoEnPantallaMapon) {
            imeiParaCortar = window.equipoEnPantallaMapon['IMEI'] || "N/A";
        }

        if (contenedorResultado) {
            contenedorResultado.innerHTML = '<span style="color: #ffb74d;">⏳ Consultando satélites de Telcel Jasper (Vía PU-K)... 📡</span>';
        }

        const urlMicroservicioJasper = 'TU_URL_DE_APPS_SCRIPT_IA_PUK_AQUI';

        try {
            const respuesta = await fetch(urlMicroservicioJasper, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ 
                    accion: "consultar_jasper", 
                    iccid: iccidUnidad,
                    imei: imeiParaCortar 
                })
            });
            const data = await respuesta.json();

            if (data.error) {
                throw new Error(data.error);
            }

            let colorEstadoSim = data.estado === 'ACTIVATED' ? '#00e676' : '#f44336';
            let bgEstadoSim = data.estado === 'ACTIVATED' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(244, 67, 54, 0.1)';

            const enSesionBadge = data.enSesion 
                ? '<span style="background: rgba(0, 230, 118, 0.15); color: #00e676; border: 1px solid rgba(0, 230, 118, 0.3); padding: 3px 8px; border-radius: 12px; font-size: 9px; font-weight: bold; letter-spacing: 0.5px;">🟢 EN SESIÓN</span>' 
                : '<span style="background: rgba(244, 67, 54, 0.15); color: #f44336; border: 1px solid rgba(244, 67, 54, 0.3); padding: 3px 8px; border-radius: 12px; font-size: 9px; font-weight: bold; letter-spacing: 0.5px;">🔴 SIN SESIÓN</span>';
            
            const consumoMB = data.consumoMB !== "No disponible" ? `${data.consumoMB} MB` : "N/A";
            
            const limiteUso = data.limiteAlcanzado 
                ? '<span style="color:#f44336; font-weight: bold;">⚠️ Alcanzado</span>' 
                : '<span style="color:#aaa;">Normal</span>';
                
            const bloqueoSIM = '<span style="color:#777; font-style: italic;">Portal web</span>';

            const spanDetLinea = document.getElementById('det-linea');
            if (spanDetLinea && data.linea !== 'Sin dato') spanDetLinea.innerHTML = `<b style="color:#00e676;">${data.linea}</b>`;
            
            const spanDetIccid = document.getElementById('det-iccid');
            if (spanDetIccid && data.iccid !== 'Sin dato') spanDetIccid.innerHTML = `<b style="color:#00e676;">${data.iccid}</b>`;

            if (contenedorResultado) {
                contenedorResultado.innerHTML = `
                    <div style="background: #1a1a1a; border: 1px solid #333; padding: 15px; border-radius: 8px; font-size: 11px; color: #bbb; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <span style="color: #fff; font-weight: bold; font-size: 13px; letter-spacing: 0.5px;">LÍNEA TELCEL</span>
                                <span style="background: ${bgEstadoSim}; color: ${colorEstadoSim}; border: 1px solid ${colorEstadoSim}; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; letter-spacing: 0.5px;">${data.estado || 'DESCONOCIDO'}</span>
                            </div>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <span style="color: #90caf9; font-weight: bold; font-size: 12px; background: rgba(144, 202, 249, 0.1); padding: 3px 6px; border-radius: 4px; border: 1px solid rgba(144, 202, 249, 0.2);">📊 ${consumoMB}</span>
                                ${enSesionBadge}
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; background: #222; padding: 12px; border-radius: 6px; border: 1px solid #2a2a2a; margin-bottom: 15px;">
                            <div><span style="color: #777;">📞 MSISDN:</span> <b style="color: #fff;">${data.linea || 'N/A'}</b></div>
                            <div><span style="color: #777;">💳 PLAN:</span> <b style="color: #fff;">N/A</b></div>
                            <div style="grid-column: span 2;"><span style="color: #777;">🏷️ ICCID:</span> <b style="color: #fff; letter-spacing: 0.5px;">${data.iccid || iccidUnidad}</b></div>
                            <div style="grid-column: span 2;"><span style="color: #777;">📱 IMEI RED:</span> <b style="color: #fff; letter-spacing: 0.5px;">${imeiParaCortar} (Cortado)</b></div>
                            <div><span style="color: #777;">🚫 LÍMITE:</span> ${limiteUso}</div>
                            <div><span style="color: #777;">🔐 BLOQUEO:</span> ${bloqueoSIM}</div>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="appSoporte.cambiarEstadoSim('${data.iccid || iccidUnidad}', 'ACTIVATED', '${containerId}')" 
                                    style="flex: 1; background: rgba(0, 200, 83, 0.1); color: #00e676; border: 1px solid #00c853; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: bold; text-transform: uppercase; transition: all 0.2s ease;"
                                    onmouseover="this.style.background='#00c853'; this.style.color='#fff';"
                                    onmouseout="this.style.background='rgba(0, 200, 83, 0.1)'; this.style.color='#00e676';">
                                ▶ Activar SIM
                            </button>
                            <button onclick="appSoporte.cambiarEstadoSim('${data.iccid || iccidUnidad}', 'DEACTIVATED', '${containerId}')" 
                                    style="flex: 1; background: rgba(244, 67, 54, 0.1); color: #f44336; border: 1px solid #d32f2f; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: bold; text-transform: uppercase; transition: all 0.2s ease;"
                                    onmouseover="this.style.background='#d32f2f'; this.style.color='#fff';"
                                    onmouseout="this.style.background='rgba(244, 67, 54, 0.1)'; this.style.color='#f44336';">
                                ⏹ Desactivar SIM
                            </button>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error("Error Jasper:", error);
            if (contenedorResultado) {
                contenedorResultado.innerHTML = `<span style="color: #ff4c4c;">❌ Error al consultar Jasper: SIM no encontrado o error de red.</span>`;
            }
        }
    }

    async cambiarEstadoSim(iccidUnidad, nuevoEstado, containerId = 'jasper-resultado-box') {
        const accionTexto = nuevoEstado === 'ACTIVATED' ? 'ACTIVAR' : 'DESACTIVAR';
        if (!confirm(`⚠️ ¿Estás seguro de que deseas ${accionTexto} la línea con ICCID: ${iccidUnidad} en la red de Telcel?`)) {
            return;
        }

        const contenedorResultado = document.getElementById(containerId);
        if (contenedorResultado) {
            contenedorResultado.innerHTML = `<span style="color: #ffb74d;">⏳ Enviando orden de ${accionTexto} a Telcel Jasper... 📡</span>`;
        }

        const urlMicroservicioJasper = 'TU_URL_DE_APPS_SCRIPT_IA_PUK_AQUI';

        try {
            const respuesta = await fetch(urlMicroservicioJasper, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ accion: "cambiar_estado", iccid: iccidUnidad, nuevoEstado: nuevoEstado })
            });
            const data = await respuesta.json();

            if (data.error) {
                throw new Error(data.error);
            }

            alert(`✅ ¡Éxito! La línea ha sido actualizada a estado: ${data.status}`);
            this.consultarJasperLinea(iccidUnidad, containerId);

        } catch (error) {
            console.error("Error al cambiar estado:", error);
            alert("❌ Ocurrió un error al intentar cambiar el estado en Jasper.");
            this.consultarJasperLinea(iccidUnidad, containerId);
        }
    }
    
    constructor() {
        this.container = document.getElementById('grid-salidas');
        this.sheetId = '1JpRyU-cFuGpmZpfuTil7FicbyFUrX3GS_nMUZLSUKKM'; 
        this.equipos = [];
        this.equipoSeleccionado = null; 
        this.Actual = localStorage.getItem('Global') || ''; 
        this.iniciar();
    }

    cambiarVista(vistaDestino) {
        document.getElementById('vista-soporte').classList.add('vista-oculta');
        document.getElementById('vista-soporte').classList.remove('vista-activa');
        
        document.getElementById('vista-monitores').classList.add('vista-oculta');
        document.getElementById('vista-monitores').classList.remove('vista-activa');
        
        const vistaDiag = document.getElementById('vista-diagnostico');
        if(vistaDiag) {
            vistaDiag.classList.add('vista-oculta');
            vistaDiag.classList.remove('vista-activa');
        }

        const botones = document.querySelectorAll('.tab-btn');
        botones.forEach(btn => btn.classList.remove('activo'));

        if (vistaDestino === 'soporte') {
            document.getElementById('vista-soporte').classList.remove('vista-oculta');
            document.getElementById('vista-soporte').classList.add('vista-activa');
            if(botones[0]) botones[0].classList.add('activo');
            this.renderizar();
        } 
        else if (vistaDestino === 'monitores') {
            document.getElementById('vista-monitores').classList.remove('vista-oculta');
            document.getElementById('vista-monitores').classList.add('vista-activa');
            if(botones[1]) botones[1].classList.add('activo');
        }
        else if (vistaDestino === 'diagnostico') {
            if(vistaDiag) {
                vistaDiag.classList.remove('vista-oculta');
                vistaDiag.classList.add('vista-activa');
            }
            if(botones[2]) botones[2].classList.add('activo'); 
        }
    }

    async iniciar() {
        if (!this.container) return;
        this.container.innerHTML = '<p style="text-align:center; color: #ffb74d; padding: 20px;">Conectando con el Inventario en la nube...</p>';
        
        const urlInventario = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('Salidas')}`;
        
        try {
            const respuestaInv = await fetch(urlInventario);
            const textInv = await respuestaInv.text();
            const jsonInv = JSON.parse(textInv.substring(47).slice(0, -2));
            
            this.equipos = [];
            jsonInv.table.rows.forEach((row, index) => {
                if (row && row.c && index > 0) {
                    const val = (colIndex) => row.c[colIndex] ? row.c[colIndex].v : '';
                    const equipo = {
                        marca: val(1) || 'SIN MARCA',
                        modelo: val(2) || 'SIN MODELO',
                        id: val(3) || 'N/A',
                        imei: val(4) || 'N/A',
                        linea: val(5) || 'SIN NÚMERO',
                        iccid: val(6) || 'N/A',
                        compania: val(7) || 'N/A', 
                        estado: val(8) || 'N/A',   
                        cliente: val(9) || 'SIN CLIENTE',
                        estadoServicio: val(10) || 'PENDIENTE',
                        unidad: val(11) || 'SIN UNIDAD',
                        marcaModeloUnidad: val(12) || 'pendiente de asignar',
                        anio: val(13) || 'pendiente de asignar',
                        numSerie: val(14) || 'pendiente de asignar',
                        tipoServicio: val(15) || 'PENDIENTE DE ASIGNAR'
                    };
                    if (equipo.id !== 'N/A' && String(equipo.id).trim() !== '') this.equipos.push(equipo);
                }
            });

            const inputBuscador = document.getElementById('buscador-global');
            if (inputBuscador) {
                inputBuscador.value = this.Actual;
                const btnLimpiar = document.getElementById('btn-limpiar-busqueda');
                if (btnLimpiar) {
                    btnLimpiar.style.display = this.Actual ? 'block' : 'none';
                }
            }
            this.renderizar();
            
            if (this.Actual !== '') {
                setTimeout(() => this.buscarGlobal(this.Actual), 500);
            }

        } catch (error) {
            console.error("Error al conectar con Google Sheets:", error);
            this.container.innerHTML = '<p style="text-align:center; color:#ff4c4c;">Error al cargar inventario.</p>';
        }
    } 

    buscarGlobal(texto) {
        this.Actual = texto;
        localStorage.setItem('Global', texto); 
        
        const btnLimpiar = document.getElementById('btn-limpiar-busqueda');
        if (btnLimpiar) {
            btnLimpiar.style.display = texto.length > 0 ? 'block' : 'none';
        }

        this.renderizar(); 

        const query = texto.toLowerCase().trim();
        const filasMapon = document.querySelectorAll('#mapon-tbody tr'); 
        
        filasMapon.forEach(fila => {
            if (query === '') {
                fila.style.display = ''; 
            } else {
                const contenido = fila.textContent.toLowerCase();
                fila.style.display = contenido.includes(query) ? '' : 'none';
            }
        });
    }

    limpiarBusqueda() {
        const input = document.getElementById('buscador-global');
        if (input) input.value = '';
        this.buscarGlobal('');
    }

    renderizar() {
        if (!this.container) return;
        this.container.innerHTML = '';
        const query = this.Actual.toLowerCase().trim();

        let maponData = [];
        for (let key in window) {
            if (window[key] && window[key].datosUnidades && Array.isArray(window[key].datosUnidades)) {
                maponData = window[key].datosUnidades;
                break;
            }
        }
        
        const equiposFiltrados = this.equipos.filter(eq => {
            if (query === '') return true;
            return Object.values(eq).some(valor => 
                String(valor).toLowerCase().includes(query)
            );
        });

        if (equiposFiltrados.length === 0) return this.container.innerHTML = '<p style="color:#a0a0a0; text-align:center;">Sin resultados.</p>';

        equiposFiltrados.forEach(eq => {
            const tarjeta = document.createElement('div');
            tarjeta.className = 'tarjeta-gps';

            let estadoServicioFinal = eq.estadoServicio;
            let unidadFinal = eq.unidad;
            let marcaModeloUnidadFinal = eq.marcaModeloUnidad;
            let anioFinal = eq.anio;
            let numSerieFinal = eq.numSerie;
            let clienteFinal = eq.cliente;

            if (maponData && maponData.length > 0) {
                let idSoporte = String(eq.id).replace(/\.0$/, '').replace(/\s+/g, '').trim().toLowerCase();
                let imeiSoporte = String(eq.imei).replace(/\.0$/, '').replace(/\s+/g, '').trim().toLowerCase();

                let eqMapon = maponData.find(m => {
                    let rawMapon = m['Núm. de serie '] || m['Núm. de serie'] || m['ID disp.'] || m['IMEI'] || '';
                    let idM = String(rawMapon).replace(/\.0$/, '').replace(/\s+/g, '').trim().toLowerCase();
                    return (idM !== '' && idM !== 's/n') && (idM === idSoporte || idM === imeiSoporte);
                });

                if (eqMapon) {
                    estadoServicioFinal = 'INSTALADO';
                    unidadFinal = eqMapon['Economico'] || eqMapon['Name'] || eq.unidad;
                    let mMarca = eqMapon['Marca'] || eqMapon['Vehicle brand'] || '';
                    let mModelo = eqMapon['Modelo'] || eqMapon['Vehicle model'] || '';
                    marcaModeloUnidadFinal = `${mMarca} ${mModelo}`.trim() || eq.marcaModeloUnidad;
                    anioFinal = eqMapon['Año fabricación'] || eqMapon['Año'] || eqMapon['Year'] || eq.anio;
                    numSerieFinal = eqMapon['VIN'] || eqMapon['Chassis number'] || eq.numSerie;
                    clienteFinal = eqMapon['Compañía:'] || eqMapon['Compañía'] || eqMapon['Company'] || eq.cliente;
                } else {
                    estadoServicioFinal = 'PENDIENTE';
                }
            }

            eq.estadoServicioVisible = estadoServicioFinal;
            eq.unidadVisible = unidadFinal;
            eq.clienteVisible = clienteFinal;
            eq.marcaModeloUnidadVisible = marcaModeloUnidadFinal;
            eq.anioVisible = anioFinal;
            eq.numSerieVisible = numSerieFinal;
            
            tarjeta.innerHTML = `
                <div class="tarjeta-unidad">${eq.unidadVisible}</div>
                <div class="tarjeta-cliente">${eq.clienteVisible} (${eq.id})</div>
                <h2 class="tarjeta-marca">${eq.marca}</h2>
                <div class="tarjeta-modelo">${eq.modelo}</div>
                <div class="tarjeta-servicio">${eq.estadoServicioVisible}</div>
            `;
            tarjeta.onclick = () => this.abrirDetalles(eq);
            this.container.appendChild(tarjeta);
        });
    }

    abrirDetalles(eq) {
        document.body.classList.add('con-panel-abierto');
        document.getElementById('panel-detalles').classList.add('abierto');
        this.equipoSeleccionado = eq;

        document.getElementById('det-titulo-contenedor').innerHTML = `
            <h1 class="titulo-detalles" id="det-titulo">${eq.unidadVisible || eq.unidad}</h1>
            <span class="icono-editar" onclick="appSoporte.activarEdicionGeneral()">✏️</span>
        `;
        document.getElementById('det-id').innerText = eq.id;
        document.getElementById('det-linea').innerText = eq.linea;
        document.getElementById('det-iccid').innerText = eq.iccid;
        document.getElementById('det-imei').innerText = eq.imei;
        document.getElementById('det-marca').innerText = eq.marca;
        document.getElementById('det-modelo').innerText = eq.modelo;
        document.getElementById('det-cliente').innerText = eq.clienteVisible || eq.cliente;
        document.getElementById('det-tipo-servicio').innerText = eq.tipoServicio;
        document.getElementById('det-servicio').innerText = eq.estadoServicioVisible || eq.estadoServicio;
        document.getElementById('det-marcaModeloUnidad').innerText = eq.marcaModeloUnidadVisible || eq.marcaModeloUnidad;
        document.getElementById('det-anio').innerText = eq.anioVisible || eq.anio;
        document.getElementById('det-numSerie').innerText = eq.numSerieVisible || eq.numSerie;

        const spanEstJasper = document.getElementById('det-jasper-estado');
        const spanConsumoJasper = document.getElementById('det-jasper-consumo');
        const spanSesionJasper = document.getElementById('det-jasper-sesion');
        if(spanEstJasper) spanEstJasper.innerText = "---";
        if(spanConsumoJasper) spanConsumoJasper.innerText = "---";
        if(spanSesionJasper) spanSesionJasper.innerText = "---";

        let modeloUpper = (eq.marca || '').toUpperCase() + ' ' + (eq.modelo || '').toUpperCase();
        let btnPlataformaNombre = '';
        let btnPlataformaURL = '';
        let btnPlataformaColor = ''; 
        let comandoDinamicoNombre = '';
        
        if (modeloUpper.includes('SUNTECH') || modeloUpper.includes('ST4') || modeloUpper.includes('ST3') || modeloUpper.includes('ST8')) {
            btnPlataformaNombre = 'SCUTI WEB';
            comandoDinamicoNombre = 'COMANDO SCUTI';
            btnPlataformaURL = 'https://www.suntechscuti.com/scuti/Login';
            btnPlataformaColor = '#ffb74d'; 
        } else if (modeloUpper.includes('TELTONIKA') || modeloUpper.includes('FMC') || modeloUpper.includes('FMB')) {
            btnPlataformaNombre = 'FOTA WEB';
            comandoDinamicoNombre = 'COMANDO FOTA';
            btnPlataformaURL = 'https://fota.teltonika.lt/devices?root=27623';
            btnPlataformaColor = '#ffb74d'; 
        } else if (modeloUpper.includes('RUPTELA') || modeloUpper.includes('HCV') || modeloUpper.includes('PRO') || modeloUpper.includes('TRACE')) {
            btnPlataformaNombre = 'DMP WEB';
            comandoDinamicoNombre = 'COMANDO DMP';
            btnPlataformaURL = 'https://dmp.ruptela.com/login';
            btnPlataformaColor = '#ffb74d'; 
        }

        const cajaBotonesRedondos = document.querySelector('.panel-botones');
        
        if (cajaBotonesRedondos && btnPlataformaNombre !== '') {
            const btnWebOld = document.getElementById('btn-dinamico-web');
            const btnComandoOld = document.getElementById('btn-dinamico-comando');
            if (btnWebOld) btnWebOld.remove();
            if (btnComandoOld) btnComandoOld.remove();
            
            const btnWeb = document.createElement('button');
            btnWeb.id = 'btn-dinamico-web';
            btnWeb.className = 'btn-accion';
            btnWeb.onclick = () => window.open(btnPlataformaURL, '_blank');
            btnWeb.innerHTML = `
                <div class="icono" style="background-color: ${btnPlataformaColor}; color: #111;">T</div>
                ${btnPlataformaNombre}
            `;
            
            const btnComando = document.createElement('button');
            btnComando.id = 'btn-dinamico-comando';
            btnComando.className = 'btn-accion';
            btnComando.onclick = () => appSoporte.enviarSMS('comando_plataforma', eq.id);
            btnComando.innerHTML = `
                <div class="icono" style="background-color: ${btnPlataformaColor}; color: #111;">🗔</div>
                ${comandoDinamicoNombre}
            `;
            
            cajaBotonesRedondos.appendChild(btnWeb);
            cajaBotonesRedondos.appendChild(btnComando);
        }

        const contenedorAsistenteBody = document.querySelector('.comandos-body');
        let botonJasperExistente = document.getElementById('contenedor-jasper-panel');
        const companiaUpper = (eq.compania || '').toUpperCase();
        
        if (companiaUpper.includes('TELCEL')) {
            if (!botonJasperExistente && contenedorAsistenteBody) {
                const wrapperJasper = document.createElement('div');
                wrapperJasper.id = 'contenedor-jasper-panel';
                wrapperJasper.style.cssText = "margin-top: 15px; border-top: 1px dashed #444; padding-top: 15px; text-align: center;";
                wrapperJasper.innerHTML = `
                    <button onclick="appSoporte.consultarJasperLinea('${eq.iccid}')" style="background: #00c853; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 11px; width: 100%;">
                        📡 Consultar Estado en Telcel Jasper
                    </button>
                    <div id="jasper-resultado-box" style="margin-top: 10px;"></div>
                `;
                contenedorAsistenteBody.appendChild(wrapperJasper);
            } else if (botonJasperExistente) {
                botonJasperExistente.querySelector('button').setAttribute('onclick', `appSoporte.consultarJasperLinea('${eq.iccid}')`);
                document.getElementById('jasper-resultado-box').innerHTML = ''; 
            }
        } else if (botonJasperExistente) {
            botonJasperExistente.remove();
        }

        this.iniciarAsistente();
    }

    iniciarAsistente() {
        const eq = this.equipoSeleccionado;
        const badgeMarca = document.getElementById('asistente-badge-marca');
        if (badgeMarca) badgeMarca.innerText = eq.marca;
        
        const contenedorInteractivo = document.getElementById('asistente-interactivo');
        if (contenedorInteractivo) contenedorInteractivo.style.display = 'none';
        const contenedorSugerencias = document.getElementById('asistente-sugerencias');
        if (contenedorSugerencias) contenedorSugerencias.innerHTML = '';
        
        const inputBuscador = document.getElementById('buscador-asistente');
        
        if (inputBuscador) {
            inputBuscador.value = '';
            inputBuscador.placeholder = "🐶 Pídele un comando a PU-K y presiona Enter...";
            inputBuscador.style.cssText = "width: 100%; padding: 12px 15px; border-radius: 20px; border: 1px solid #444; background: #222; color: #fff; font-size: 0.95rem; margin-bottom: 15px; outline: none; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); transition: all 0.3s ease; box-sizing: border-box;";
            inputBuscador.onfocus = () => inputBuscador.style.border = "1px solid #ffb74d";
            inputBuscador.onblur = () => inputBuscador.style.border = "1px solid #444";

            inputBuscador.oninput = null; 

            inputBuscador.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const pregunta = inputBuscador.value.trim();
                    if (pregunta !== '') {
                        const promptOculto = `El técnico solicita: "${pregunta}". NOTA INTERNA: El equipo en pantalla es Marca: ${eq.marca}, Modelo: ${eq.modelo}, ID: ${eq.id}. Usa esta información para armar el comando correcto en base a tus manuales y reemplaza el {ID}.`;
                        this.consultarCerebroPUK(promptOculto);
                        inputBuscador.value = '';
                    }
                }
            };
        }
        
        this.hablarPUK(`¡Hola! Soy PU-K. Dime qué necesitas hacer con este <b>${eq.marca} ${eq.modelo}</b> y te armaré el comando.`, "normal");
    }

    hablarPUK(mensaje, estado = 'normal') {
        let cajaPUK = document.getElementById('puk-dialogo-caja');
        const inputBuscador = document.getElementById('buscador-asistente');
        
        if (!cajaPUK && inputBuscador) {
            cajaPUK = document.createElement('div');
            cajaPUK.id = 'puk-dialogo-caja';
            cajaPUK.style.cssText = "background: #1e1e1e; border-left: 4px solid #ffb74d; padding: 12px 15px; border-radius: 8px; margin-bottom: 15px; display: flex; align-items: center; gap: 15px; font-size: 0.9em; color: #ccc; box-shadow: 0 4px 6px rgba(0,0,0,0.3); transition: 0.3s ease;";
            inputBuscador.parentNode.insertBefore(cajaPUK, inputBuscador);
        }

        if (!cajaPUK) return;

        let icono = '🐶'; 
        let colorBorde = '#ffb74d'; 

        if (estado === 'error') {
            icono = '🐕‍🦺'; colorBorde = '#ff4c4c';
        } else if (estado === 'exito') {
            icono = '🐾'; colorBorde = '#4caf50';
        } else if (estado === 'pensando') {
            icono = '🐕'; colorBorde = '#64b5f6';
        }

        cajaPUK.style.borderLeft = `4px solid ${colorBorde}`;
        cajaPUK.innerHTML = `
            <span style="font-size: 2.2em; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));">${icono}</span> 
            <span style="line-height: 1.4; width: 100%;">
                <b style="color: ${colorBorde}; font-size: 1.05em;">PU-K dice:</b><br>
                ${mensaje}
            </span>
        `;
    }

    async consultarCerebroPUK(pregunta) {
        this.hablarPUK("Revisando mis manuales técnicos... Dame unos segundos 🐕", "pensando");
        
        const urlAppsScript = 'TU_URL_DE_APPS_SCRIPT_IA_PUK_AQUI';

        try {
            const peticion = await fetch(urlAppsScript, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ mensaje: pregunta })
            });
            const respuesta = await peticion.json();

            if (respuesta.success) {
                let textoHTML = respuesta.respuesta
                    .replace(/\n/g, '<br>')
                    .replace(/\*\*(.*?)\*\*/g, '<b style="color:#fff;">$1</b>');
                
                this.hablarPUK(textoHTML, "exito");
            } else {
                this.hablarPUK("¡Grrr! Hubo un error al pensar: " + respuesta.error, "error");
            }
        } catch (error) {
            console.error(error);
            this.hablarPUK("¡Grrr! No pude conectarme con mi cerebro en la nube. Revisa tu conexión a internet.", "error");
        }
    }

    cerrarDetalles() { 
        document.body.classList.remove('con-panel-abierto');
        document.getElementById('panel-detalles').classList.remove('abierto'); 
    }

    activarEdicionGeneral() {
        const eq = this.equipoSeleccionado;
        document.getElementById('det-titulo-contenedor').innerHTML = `
            <input type="text" id="input-edit-unidad" value="${eq.unidad}" class="input-edicion-general" style="font-size: 1.5rem; width: 50%;">
            <button class="btn-guardar-edicion" onclick="appSoporte.guardarEdicionGeneral()">Guardar</button>
            <button class="btn-cancelar" onclick="appSoporte.abrirDetalles(appSoporte.equipoSeleccionado)" style="padding: 5px;">✖</button>
        `;
        const crearInput = (idHTML, idInput, valor) => {
            document.getElementById(idHTML).innerHTML = `<input type="text" id="${idInput}" value="${valor}" class="input-edicion-general">`;
        };
        crearInput('det-linea', 'input-edit-linea', eq.linea);
        crearInput('det-iccid', 'input-edit-iccid', eq.iccid);
        crearInput('det-imei', 'input-edit-imei', eq.imei);
        crearInput('det-marca', 'input-edit-marca', eq.marca);
        crearInput('det-modelo', 'input-edit-modelo', eq.modelo);
        crearInput('det-cliente', 'input-edit-cliente', eq.cliente);
        crearInput('det-tipo-servicio', 'input-edit-tipoServicio', eq.tipoServicio);
        crearInput('det-servicio', 'input-edit-estadoServicio', eq.estadoServicio);
        crearInput('det-marcaModeloUnidad', 'input-edit-marcaModeloUnidad', eq.marcaModeloUnidad);
        crearInput('det-anio', 'input-edit-anio', eq.anio);
        crearInput('det-numSerie', 'input-edit-numSerie', eq.numSerie);
    }

    async guardarEdicionGeneral() {
        const btn = document.querySelector('.btn-guardar-edicion');
        btn.innerText = "Guardando...";
        btn.disabled = true;

        const updates = {
            unidad: document.getElementById('input-edit-unidad').value,
            linea: document.getElementById('input-edit-linea').value,
            iccid: document.getElementById('input-edit-iccid').value,
            imei: document.getElementById('input-edit-imei').value,
            marca: document.getElementById('input-edit-marca').value,
            modelo: document.getElementById('input-edit-modelo').value,
            cliente: document.getElementById('input-edit-cliente').value,
            tipoServicio: document.getElementById('input-edit-tipoServicio').value,
            estadoServicio: document.getElementById('input-edit-estadoServicio').value,
            marcaModeloUnidad: document.getElementById('input-edit-marcaModeloUnidad').value,
            anio: document.getElementById('input-edit-anio').value,
            numSerie: document.getElementById('input-edit-numSerie').value,
        };

        const scriptUrl = 'https://script.google.com/macros/s/AKfycbzgwP6L_DDx5XXidThkm__ECIEX8uba7tbqTlh-JOWACArOkaoRPDIf80qaVsf7gwGz/exec'; 

        try {
            const respuesta = await fetch(scriptUrl, {
                method: 'POST',
                body: JSON.stringify({ id: this.equipoSeleccionado.id, updates: updates })
            });
            const resultado = await respuesta.json();

            if (resultado.success) {
                Object.assign(this.equipoSeleccionado, updates);
                this.abrirDetalles(this.equipoSeleccionado);
                this.renderizar();
            } else {
                throw new Error("No se encontró el ID en Sheets");
            }
        } catch (error) {
            console.error(error);
            alert("Error al guardar en la base de datos.");
            btn.innerText = "Reintentar";
            btn.disabled = false;
        }
    }

    enviarSMS(accion, eqIdDesdeTarjeta = null) {
        let eq = eqIdDesdeTarjeta 
            ? this.equipos.find(e => String(e.id) === String(eqIdDesdeTarjeta)) 
            : this.equipoSeleccionado;

        if (!eq) return; 

        const numero = eq.linea;
        if (!numero || numero === 'SIN NÚMERO') {
            alert("No hay un número vinculado para este equipo.");
            return;
        }

        const marca = eq.marca.toUpperCase().trim();
        const modelo = eq.modelo.toUpperCase().trim();
        const id = String(eq.id).trim(); 
        let comando = "";

        if (accion === 'apagar') {
            if (modelo.startsWith("ST6")) comando = `ST600CMD;${id};02;Enable1`;
            else if (modelo.startsWith("ST30") || modelo.startsWith("ST34")) comando = `ST300CMD;${id};02;Enable1`;
            else if (modelo.startsWith("ST2")) comando = `SA200CMD;${id};02;Enable1`;
            else if (modelo.startsWith("ST33") || modelo.startsWith("ST43") || modelo.startsWith("ST82")) comando = `CMD;${id};04;01`;
            else if (marca === "TELTONIKA") comando = "  setdigout 1 0"; 
        }
        else if (accion === 'encender') {
            if (modelo.startsWith("ST6")) comando = `ST600CMD;${id};02;Disable1`;
            else if (modelo.startsWith("ST30") || modelo.startsWith("ST34")) comando = `ST300CMD;${id};02;Disable1`;
            else if (modelo.startsWith("ST2")) comando = `SA200CMD;${id};02;Disable1`;
            else if (modelo.startsWith("ST33") || modelo.startsWith("ST43") || modelo.startsWith("ST82")) comando = `CMD;${id};04;02`;
            else if (marca === "TELTONIKA") comando = "  setdigout 0 0";
        } 
        else if (accion === 'reiniciar') {
            if (marca === "SUNTECH") comando = `CMD;${id};03;03`;
            else if (marca === "TELTONIKA") comando = "  cpureset";
            else if (marca === "RUPTELA") comando = " reset";
            else if (marca === "CONCOX" || marca === "JIMIIOT") comando = "REBOOT#";
        }
        else if (accion === 'configuracion') {
            if (modelo.startsWith("ST6")) comando = `ST600CMD;${id};02;PresetA`;
            else if (modelo.startsWith("ST30") || modelo.startsWith("ST34")) comando = `ST300CMD;${id};02;PresetA`;
            else if (modelo.startsWith("ST2")) comando = `SA200CMD;${id};02;PresetA`;
            else if (modelo.startsWith("ST33") || modelo.startsWith("ST43") || modelo.startsWith("ST82")) comando = `CMD;${id};03;05`;
            else if (marca.startsWith("TELTONIKA")) comando = "  getparam 2001:;2002:;2003:;2004:;2005:;2006:;1004:";
            else if (marca.startsWith("RUPTELA")) comando = " getapn";
            else if (marca.startsWith("CONCOX" ) || marca.startsWith("JIMIIOT")) comando = "GPRSSET#";
        }
        else if (accion === 'borrar') {
            if (modelo.startsWith("ST6")) comando = `ST600CMD;${id};02;EraseAll`;
            else if (modelo.startsWith("ST30") || modelo.startsWith("ST34")) comando = `ST300CMD;${id};02;EraseAll`;
            else if (modelo.startsWith("ST2")) comando = `SA200CMD;${id};02;EraseAll`;
            else if (modelo.startsWith("ST33") || modelo.startsWith("ST43") || modelo.startsWith("ST82")) comando = `CMD;${id};05;02`;
            else if (marca.startsWith("RUPTELA")) comando = " delrecords";
            else if (marca.startsWith("TELTONIKA")) comando = "  deleterecords";
        }
        else if (accion === 'comando_plataforma') {
            if (marca === "SUNTECH") comando = `CMD;${id};01;01`;
            else if (marca === "TELTONIKA") comando = "  web_connect";
            else if (marca === "RUPTELA") comando = " dmpfconnect";
        }

        if (comando) {
            window.open(`sms:${numero}?body=${encodeURIComponent(comando)}`, '_self');
        }
    }
    
    toggleChatPUK() {
        const panel = document.getElementById('puk-panel-chat');
        panel.classList.toggle('puk-oculto');
    }

    manejarEnterChat(e) {
        if (e.key === 'Enter') {
            this.enviarMensajeChat();
        }
    }

    async enviarMensajeChat() {
        const input = document.getElementById('puk-input-chat');
        const mensajeUsuario = input.value.trim();
        if (!mensajeUsuario) return;

        this.agregarBurbujaChat(mensajeUsuario, 'puk-usuario');
        input.value = '';

        const idPensando = this.agregarBurbujaChat('Olfateando el manual y revisando el equipo... 🐕', 'puk-ia');

        let contextoOculto = "";
        
        if (window.equipoEnPantallaMapon) {
            const eq = window.equipoEnPantallaMapon;
            const marca = eq['Device model'] || 'Desconocido';
            const estado = eq['Online status'] || 'Desconocido';
            const ultimoReporte = eq['Last data received'] || 'Desconocido';
            const imei = eq['IMEI'] || 'Desconocido';

            contextoOculto = `
                NOTA INTERNA PARA LA IA: El técnico está viendo actualmente un equipo en el dashboard de Mapon. 
                Aquí están los datos técnicos de ese equipo:
                - Marca/Modelo: ${marca}
                - Estado actual en Mapon: ${estado}
                - Último reporte: ${ultimoReporte}
                - IMEI: ${imei}
                
                Guía rápida de estados de Mapon para tu análisis:
                - NODATA (NOGPS): El equipo tiene energía pero no recibe señal de satélite (GPS). Sugiere revisar la ubicación del vehículo (si está bajo techo), la posición de la antena o problemas con el módulo GPS.
                - NODATA (INSTALL): Es un equipo nuevo que aún no ha reportado por primera vez o la instalación quedó inconclusa.
                - NODATA (NOPOWER): El equipo perdió la alimentación eléctrica principal (batería desconectada, fusible fundido o cables cortados).
                - OK: Funcionando correctamente.
                - OK (NOGPS): Reporta datos pero sin posición válida.
                
                Si la pregunta del técnico ("${mensajeUsuario}") es sobre fallas, usa estos datos y la guía de estados para darle un diagnóstico preciso, sugiriendo comandos o revisiones físicas necesarias para ese modelo específico (${marca}). No menciones que leíste esta "Nota Interna", actúa como si lo supieras por contexto.
            `;
        }

        const mensajeFinalParaIA = contextoOculto ? contextoOculto + "\n\nPregunta del técnico: " + mensajeUsuario : mensajeUsuario;

        const urlAppsScript = 'TU_URL_DE_APPS_SCRIPT_IA_PUK_AQUI'; 
        
        try {
            const peticion = await fetch(urlAppsScript, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ mensaje: mensajeFinalParaIA })
            });
            const respuesta = await peticion.json();

            document.getElementById(idPensando).remove();

            if (respuesta.success) {
                let textoHTML = respuesta.respuesta
                    .replace(/\n/g, '<br>')
                    .replace(/\*\*(.*?)\*\*/g, '<b style="color:#ffb74d;">$1</b>');
                
                this.agregarBurbujaChat(textoHTML, 'puk-ia');
            } else {
                this.agregarBurbujaChat("¡Grrr! Hubo un error al pensar: " + respuesta.error, 'puk-ia');
            }
        } catch (error) {
            document.getElementById(idPensando).remove();
            this.agregarBurbujaChat("¡Grrr! No pude conectarme con mi cerebro en la nube.", 'puk-ia');
            console.error(error);
        }
    }

    agregarBurbujaChat(texto, clase) {
        const contenedor = document.getElementById('puk-mensajes');
        const div = document.createElement('div');
        div.className = `puk-mensaje ${clase}`;
        div.innerHTML = texto;
        
        const idUnico = 'msg-' + Date.now();
        div.id = idUnico;
        
        contenedor.appendChild(div);
        contenedor.scrollTop = contenedor.scrollHeight; 
        
        return idUnico;
    }
}

// INICIALIZACIÓN CORRECTA
document.addEventListener('DOMContentLoaded', () => { 
    window.appSoporte = new SoporteTecnico(); 
});
