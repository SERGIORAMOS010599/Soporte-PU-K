// js/diagnostico.js

class DiagnosticoEnVivo {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.equiposConFalla = [];
        this.analisisEnProgreso = false;
        
        this.triaje = {
            'NODATA (NOGPS)': { color: '#ffeb3b', mensaje: '⚠️ Sin señal GPS. Posible vehículo bajo techo, antena desconectada o módulo GPS dañado.' },
            'NODATA (NOPOWER)': { color: '#ff9800', mensaje: '🔴 Sin alimentación. Batería desconectada, fusible fundido o equipo saboteado.' },
            'NODATA (INSTALL)': { color: '#9c27b0', mensaje: '🟣 Equipo en modo instalación. No ha reportado su primera posición.' },
            'DESCONOCIDO': { color: '#f44336', mensaje: '❌ Estado desconocido. Requiere revisión manual profunda.' }
        };

        this.renderizarEstructura();
        this.activarBuscadorGlobal();
    }

    // ==========================================
    // 1. CONEXIÓN AL BUSCADOR UNIVERSAL
    // ==========================================
    activarBuscadorGlobal() {
        const buscador = document.getElementById('buscador-global');
        const btnLimpiar = document.getElementById('btn-limpiar-busqueda');

        // Escucha cada tecla que escribas en el buscador
        if (buscador) {
            buscador.addEventListener('input', () => {
                // Solo renderiza si estamos en la pestaña de diagnóstico
                if(document.getElementById('vista-diagnostico').classList.contains('vista-activa')){
                    this.renderizarTarjetas();
                }
            });
        }

        // Escucha cuando le picas a la tachita "✖" para limpiar
        if (btnLimpiar) {
            btnLimpiar.addEventListener('click', () => {
                setTimeout(() => {
                    if(document.getElementById('vista-diagnostico').classList.contains('vista-activa')){
                        this.renderizarTarjetas();
                    }
                }, 50); // Retraso de 50ms para dejar que el buscador se limpie primero
            });
        }
    }

    actualizarDatos(datosMapon) {
        if (!datosMapon || datosMapon.length === 0) return;

        const extraer = (unidad, posibles) => {
            for(let n of posibles) {
                let nLimpio = String(n).replace(/[^a-z0-9]/gi, "").toLowerCase();
                for(let k in unidad) {
                    let kLimpio = String(k).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
                    if(kLimpio === nLimpio || kLimpio.includes(nLimpio)) return unidad[k];
                }
            }
            return null;
        };

        this.equiposConFalla = datosMapon.filter(unidad => {
            let estado = extraer(unidad, ["onlinestatus", "estado", "columna14"]);
            let eLimpio = (estado || "").toString().trim().toUpperCase();
            return eLimpio !== "OK" && eLimpio !== "OK (NOGPS)" && eLimpio !== "" && eLimpio !== "SIN ASIGNAR" && eLimpio !== "DESCONOCIDO";
        });

        // Agregamos la data extraída directamente al objeto para facilitar la búsqueda y el envío a la IA
        this.equiposConFalla = this.equiposConFalla.map(unidad => {
            return {
                ...unidad,
                _compania: extraer(unidad, ["compania", "company", "cliente", "columna0"]) || 'Sin asignar',
                _economico: extraer(unidad, ["economico", "name", "unidad", "columna1"]) || 'S/N',
                _idSerie: extraer(unidad, ["numdeserie", "serie", "imei", "iddisp", "columna10", "columna8", "columna6"]) || 'S/N',
                _estado: extraer(unidad, ["onlinestatus", "estado", "columna14"]) || 'Desconocido',
                _ultimoReporte: extraer(unidad, ["lastdatareceived", "ultimoreporte", "reporte", "columna15"]) || 'Sin fecha',
                _marca: extraer(unidad, ["marca", "vehiclebrand", "columna2"]) || '-',
                _modelo: extraer(unidad, ["modelo", "vehiclemodel", "columna3"]) || '-'
            };
        });

        this.renderizarTarjetas();
    }

    renderizarEstructura() {
        if (!this.container) return;
        this.container.innerHTML = `
            <div style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 15px;">
                    <div>
                        <h2 style="color: #ffb74d; margin: 0; display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 1.5rem;">🩺</span> Centro de Diagnóstico PU-K
                        </h2>
                        <p style="color: #888; margin: 5px 0 0 0; font-size: 0.9rem;">Analizando equipos desconectados en tiempo real.</p>
                    </div>
                    <button id="btn-iniciar-analisis" onclick="window.appDiagnostico.iniciarAnalisisEnCola()" style="background: #ffb74d; color: #111; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: transform 0.2s; box-shadow: 0 4px 10px rgba(255, 183, 77, 0.3);">
                        ▶ Iniciar Análisis Inteligente
                    </button>
                </div>
                
                <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                    <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; border: 1px solid #333; flex: 1; text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: #f44336;" id="diag-count-total">0</div>
                        <div style="color: #888; font-size: 0.8rem; text-transform: uppercase;">Equipos Caídos</div>
                    </div>
                    <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; border: 1px solid #333; flex: 1; text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: #4caf50;" id="diag-count-resueltos">0</div>
                        <div style="color: #888; font-size: 0.8rem; text-transform: uppercase;">Analizados por PU-K</div>
                    </div>
                </div>

                <div id="contenedor-tarjetas-falla" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
                    <p style="color: #666; width: 100%; text-align: center; grid-column: 1 / -1; padding: 40px;">Esperando datos de Mapon...</p>
                </div>
            </div>
        `;
    }

    renderizarTarjetas() {
        const contenedor = document.getElementById('contenedor-tarjetas-falla');
        if (!contenedor) return;

        // LECTURA DEL BUSCADOR GLOBAL
        const buscador = document.getElementById('buscador-global');
        const termino = buscador ? buscador.value.toLowerCase().trim() : '';

        // FILTRADO DINÁMICO
        let equiposAFiltrar = this.equiposConFalla;
        if (termino !== '') {
            equiposAFiltrar = this.equiposConFalla.filter(u => {
                let textoUnidad = Object.values(u).join(' ').toLowerCase();
                return textoUnidad.includes(termino);
            });
        }

        document.getElementById('diag-count-total').innerText = equiposAFiltrar.length;
        
        if (equiposAFiltrar.length === 0) {
            if (termino !== '' && this.equiposConFalla.length > 0) {
                contenedor.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: #888; background: #1a1a1a; border-radius: 8px;">No hay equipos caídos que coincidan con la búsqueda: <b style="color:#ffb74d;">"${termino}"</b></div>`;
            } else {
                contenedor.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 50px; background: rgba(0, 230, 118, 0.05); border: 1px dashed #00e676; border-radius: 8px;">
                    <span style="font-size: 3rem;">🎉</span>
                    <h3 style="color: #00e676; margin: 10px 0;">¡Todos los equipos están en línea!</h3>
                    <p style="color: #aaa; margin: 0;">No se detectaron fallas en el reporte actual de Mapon.</p>
                </div>`;
            }
            return;
        }

        contenedor.innerHTML = '';

        equiposAFiltrar.forEach((unidad, index) => {
            let estadoUp = unidad._estado.toString().toUpperCase().trim();
            let datosTriaje = this.triaje[estadoUp] || { color: '#f44336', mensaje: 'Falla no catalogada. Se requiere análisis manual.' };
            
            let linea = 'Desconocida';
            if (window.appSoporte && window.appSoporte.equipos) {
                let eqMatch = window.appSoporte.equipos.find(e => {
                    let idLimpio = String(e.id).replace(/\.0$/, '').replace(/\s+/g, '').toLowerCase();
                    let sLimpia = String(unidad._idSerie).replace(/\.0$/, '').replace(/\s+/g, '').toLowerCase();
                    return idLimpio === sLimpia;
                });
                if(eqMatch) linea = eqMatch.linea || 'Sin número';
            }
            
            // Guardamos la línea en el objeto para pasárselo a la IA después
            unidad._lineaAsignada = linea;

            const idRespuestaIA = `ia-resp-${index}`;

            const tarjeta = document.createElement('div');
            tarjeta.style.cssText = `background: #1a1a1a; border-radius: 8px; border: 1px solid #333; overflow: hidden; display: flex; flex-direction: column;`;
            
            tarjeta.innerHTML = `
                <div style="padding: 12px 15px; background: rgba(255, 255, 255, 0.02); border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-weight: bold; color: #fff; font-size: 1.1rem;">${unidad._economico}</div>
                    <div style="background: ${datosTriaje.color}20; color: ${datosTriaje.color}; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; border: 1px solid ${datosTriaje.color}50;">
                        ${unidad._estado}
                    </div>
                </div>
                
                <div style="padding: 15px; font-size: 0.85rem; color: #aaa; flex: 1;">
                    <div style="margin-bottom: 5px;"><strong style="color: #ddd;">Compañía:</strong> ${unidad._compania}</div>
                    <div style="margin-bottom: 5px;"><strong style="color: #ddd;">Equipo:</strong> ${unidad._marca} ${unidad._modelo}</div>
                    <div style="margin-bottom: 5px;"><strong style="color: #ddd;">ID/Serie:</strong> ${unidad._idSerie}</div>
                    <div style="margin-bottom: 10px;"><strong style="color: #ddd;">Último Reporte:</strong> ${unidad._ultimoReporte}</div>
                    <div style="margin-bottom: 15px;"><strong style="color: #ddd;">Línea SMS:</strong> ${linea}</div>
                    
                    <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px; border-left: 3px solid ${datosTriaje.color}; font-size: 0.8rem; line-height: 1.4;">
                        <strong style="color: ${datosTriaje.color};">Pre-Diagnóstico:</strong><br>
                        ${datosTriaje.mensaje}
                    </div>
                    
                    <div id="${idRespuestaIA}" style="display: none; margin-top: 15px; padding: 10px; background: #111; border: 1px dashed #ffb74d; border-radius: 6px; color: #e0e0e0; font-size: 0.85rem; line-height: 1.4;"></div>
                </div>
                
                <div style="padding: 10px 15px; border-top: 1px solid #333; background: rgba(0,0,0,0.2);">
                    <button onclick="window.appDiagnostico.analizarEquipoIndividual(${index})" style="width: 100%; background: transparent; color: #ffb74d; border: 1px solid #ffb74d; padding: 8px; border-radius: 4px; cursor: pointer; font-weight: bold; transition: 0.2s;">
                        🧠 Solicitar Análisis IA
                    </button>
                </div>
            `;
            
            contenedor.appendChild(tarjeta);
        });
    }

    // ==========================================
    // 2. PREPARACIÓN DEL PROMPT PARA LA IA
    // ==========================================
    
async analizarEquipoIndividual(index) {
        const unidad = this.equiposConFalla[index];
        if(!unidad) return;
        
        const idCaja = `ia-resp-${index}`;
        const caja = document.getElementById(idCaja);
        if (!caja) return;

        caja.style.display = 'block';
        caja.innerHTML = '<span style="color: #64b5f6;">🐕 PU-K analizando manuales y estado del equipo...</span>';

        // 1. Preparamos el paquete exacto para Apps Script
        const payload = {
            accion: 'diagnostico_puk',
            compania: unidad._compania,
            economico: unidad._economico,
            idSerie: unidad._idSerie,
            modelo: unidad._marca + ' ' + unidad._modelo,
            linea: unidad._lineaAsignada,
            estado: unidad._estado,
            ultimoReporte: unidad._ultimoReporte
        };

        try {
            // ¡PON TU URL DE APPS SCRIPT AQUÍ!
            const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbxechSb9x2TtDrI_E8egBEkGjZOOFGMXNl5UiBjB9s8n_hJwH6qGHe5aEMMENaEO39H/exec"; 
            
            const respuesta = await fetch(URL_APPS_SCRIPT, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            // Recibimos la respuesta JSON
            const dataJSON = await respuesta.json();
            
            if (!dataJSON.success) {
                throw new Error(dataJSON.error || "Falla desconocida en el servidor");
            }

            let textoGemini = dataJSON.respuesta;

            // 2. Extractor Mágico de Botones SMS
            const regexBotones = /\[BOTON:\s*([^\]]+)\]/gi;
            let botonesHTML = '';
            let match;
            
            while ((match = regexBotones.exec(textoGemini)) !== null) {
                let comando = match[1].trim().toLowerCase();
                let colorBase = '#ffb74d';
                let icono = '📡';
                
                if(comando === 'reiniciar') { colorBase = '#f57c00'; icono = '⟳'; }
                if(comando === 'configuracion') { colorBase = '#ffb74d'; icono = '⚙️'; }
                if(comando === 'apagar') { colorBase = '#d32f2f'; icono = '⏻'; }
                if(comando === 'encender') { colorBase = '#388e3c'; icono = '⏻'; }

                botonesHTML += `
                    <button onclick="appSoporte.enviarSMS('${comando}', '${unidad._idSerie}')" style="background: ${colorBase}20; color: ${colorBase}; border: 1px solid ${colorBase}; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: bold; width: 100%; transition: 0.2s; margin-top: 8px;" onmouseover="this.style.background='${colorBase}'; this.style.color='#111';" onmouseout="this.style.background='${colorBase}20'; this.style.color='${colorBase}';">
                        ${icono} ENVIAR SMS: ${comando.toUpperCase()}
                    </button>
                `;
            }

            // Ocultamos las etiquetas de texto puro y dejamos el diagnóstico limpio
            let textoLimpio = textoGemini.replace(regexBotones, '').trim();

            // 3. Pintamos el resultado final con los botones funcionales
            caja.innerHTML = `
                <div style="margin-bottom: 8px; border-bottom: 1px solid #333; padding-bottom: 5px;">
                    <b style="color: #ffb74d;">Diagnóstico de PU-K:</b>
                </div>
                ${textoLimpio.replace(/\n/g, '<br>')}
                
                <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 10px;">
                    ${botonesHTML}
                </div>
            `;

        } catch (error) {
            caja.innerHTML = `<span style="color: #f44336;">❌ Ocurrió un error al contactar a PU-K: ${error.message}</span>`;
        }
    }

    async iniciarAnalisisEnCola() {
        if(this.analisisEnProgreso) return;
        
        // Si hay una búsqueda activa, analizaremos SOLO los filtrados en pantalla
        const buscador = document.getElementById('buscador-global');
        const termino = buscador ? buscador.value.toLowerCase().trim() : '';
        
        let targetIndexList = [];
        this.equiposConFalla.forEach((u, i) => {
            if (termino === '' || Object.values(u).join(' ').toLowerCase().includes(termino)) {
                targetIndexList.push(i);
            }
        });

        if(targetIndexList.length === 0) {
            alert("No hay equipos en pantalla para analizar.");
            return;
        }

        this.analisisEnProgreso = true;
        const btn = document.getElementById('btn-iniciar-analisis');
        if (btn) {
            btn.innerHTML = '⏳ Analizando en cola...';
            btn.style.background = '#64b5f6';
        }

        let resueltos = 0;
        const contadorResueltos = document.getElementById('diag-count-resueltos');

        // Iteramos respetando el filtro
        for (let idx of targetIndexList) {
            await this.analizarEquipoIndividual(idx);
            resueltos++;
            if (contadorResueltos) contadorResueltos.innerText = resueltos;
            await new Promise(resolve => setTimeout(resolve, 1000)); 
        }

        this.analisisEnProgreso = false;
        if (btn) {
            btn.innerHTML = '✅ Análisis Completado';
            btn.style.background = '#4caf50';
            setTimeout(() => {
                btn.innerHTML = '▶ Iniciar Análisis Inteligente';
                btn.style.background = '#ffb74d';
            }, 3000);
        }
    }
}
