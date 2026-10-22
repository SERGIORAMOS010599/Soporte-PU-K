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

        // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // ¡¡¡ ATENCIÓN SERGIO !!!
        // PEGA AQUÍ LA URL DE TU "SUPER-SCRIPT" DE APPS SCRIPT (EL DE IA PU-K)
        // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        const urlMicroservicioJasper = 'TU_URL_DE_APPS_SCRIPT_IA_PUK_AQUI';

        try {
            const respuesta = await fetch(urlMicroservicioJasper, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ 
                    accion: "consultar_jasper", 
                    iccid: iccidUnidad,
                    imei: imeiParaCortar // Mandamos el IMEI para que Apps Script lo corte a 14 y le ponga "00"
                })
            });
            const data = await respuesta.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // 1. Colores y estilos translúcidos tipo "Píldora"
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

            // Actualizamos la UI principal (si la tabla está visible)
            const spanDetLinea = document.getElementById('det-linea');
            if (spanDetLinea && data.linea !== 'Sin dato') spanDetLinea.innerHTML = `<b style="color:#00e676;">${data.linea}</b>`;
            
            const spanDetIccid = document.getElementById('det-iccid');
            if (spanDetIccid && data.iccid !== 'Sin dato') spanDetIccid.innerHTML = `<b style="color:#00e676;">${data.iccid}</b>`;

            // 2. Renderizado de la UI Profesional (Tus tarjetas originales)
            if (contenedorResultado) {
                contenedorResultado.innerHTML = `
                    <div style="background: #1a1a1a; border: 1px solid #333; padding: 15px; border-radius: 8px; font-size: 11px; color: #bbb; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
                        
                        <!-- CABECERA DE LA TARJETA -->
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
                        
                        <!-- CUADRÍCULA DE DATOS INTERNA -->
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; background: #222; padding: 12px; border-radius: 6px; border: 1px solid #2a2a2a; margin-bottom: 15px;">
                            <div><span style="color: #777;">📞 MSISDN:</span> <b style="color: #fff;">${data.linea || 'N/A'}</b></div>
                            <div><span style="color: #777;">💳 PLAN:</span> <b style="color: #fff;">N/A</b></div>
                            <div style="grid-column: span 2;"><span style="color: #777;">🏷️ ICCID:</span> <b style="color: #fff; letter-spacing: 0.5px;">${data.iccid || iccidUnidad}</b></div>
                            <div style="grid-column: span 2;"><span style="color: #777;">📱 IMEI RED:</span> <b style="color: #fff; letter-spacing: 0.5px;">${imeiParaCortar} (Cortado)</b></div>
                            <div><span style="color: #777;">🚫 LÍMITE:</span> ${limiteUso}</div>
                            <div><span style="color: #777;">🔐 BLOQUEO:</span> ${bloqueoSIM}</div>
                        </div>

                        <!-- BOTONES DE CONTROL DE ESTADO -->
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

        // Usamos también la misma URL del Super-Script
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

// --- FUNCION PARA CAMBIAR ENTRE PESTAÑAS ---
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

    // --- FUNCIONES DEL BUSCADOR GLOBAL ---
    buscarGlobal(texto) {
        this.Actual = texto;
        localStorage.setItem('Global', texto); 
        
        const btnLimpiar = document.getElementById('btn-limpiar-busqueda');
        if (btnLimpiar) {
            btnLimpiar.style.display = texto.length > 0 ? 'block' : 'none';
        }

        // 1. Filtrar Soporte
        this.renderizar(); 

        // 2. Filtrar Mapon
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

    // --- RENDERIZADO Y PANTALLAS ---
    renderizar() {
        if (!this.container) return;
        this.container.innerHTML = '';
        const query = this.Actual.toLowerCase().trim();

        // 1. BÚSQUEDA INTELIGENTE DE MAPON EN MEMORIA GLOBAL
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

            // --- 2. LÓGICA DE CRUCE CON MAPON ---
            let estadoServicioFinal = eq.estadoServicio;
            let unidadFinal = eq.unidad;
            let marcaModeloUnidadFinal = eq.marcaModeloUnidad;
            let anioFinal = eq.anio;
            let numSerieFinal = eq.numSerie;
            let clienteFinal = eq.cliente;

            if (maponData && maponData.length > 0) {
                let idSoporte = String(eq.id).replace(/\.0$/, '').replace(/\s+/g, '').trim().toLowerCase();
                let imeiSoporte = String(eq.imei).replace(/\.0$/, '').replace(/\s+/g, '').trim().toLowerCase();

                // Buscar coincidencias
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

        // Limpiar datos de Jasper de consultas anteriores
        const spanEstJasper = document.getElementById('det-jasper-estado');
        const spanConsumoJasper = document.getElementById('det-jasper-consumo');
        const spanSesionJasper = document.getElementById('det-jasper-sesion');
        if(spanEstJasper) spanEstJasper.innerText = "---";
        if(spanConsumoJasper) spanConsumoJasper.innerText = "---";
        if(spanSesionJasper) spanSesionJasper.innerText = "---";

        // --- DETECCIÓN DINÁMICA DE PLATAFORMA PARA BOTONES REDONDOS ---
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
            cajaBotonesRedondos.
