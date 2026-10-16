// js/diagnostico.js

class DiagnosticoEnVivo {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.equiposConFalla = [];
        this.analisisEnProgreso = false;
        
        // Diccionario de Triaje Rápido (Pre-diagnóstico basado en el estado de Mapon)
        this.triaje = {
            'NODATA (NOGPS)': {
                color: '#ffeb3b', // Amarillo
                mensaje: '⚠️ Sin señal GPS. Posible vehículo bajo techo, antena desconectada o módulo GPS dañado.'
            },
            'NODATA (NOPOWER)': {
                color: '#ff9800', // Naranja
                mensaje: '🔴 Sin alimentación. Batería desconectada, fusible fundido o equipo saboteado.'
            },
            'NODATA (INSTALL)': {
                color: '#9c27b0', // Morado
                mensaje: '🟣 Equipo en modo instalación. No ha reportado su primera posición.'
            },
            'DESCONOCIDO': {
                color: '#f44336', // Rojo
                mensaje: '❌ Estado desconocido. Requiere revisión manual profunda.'
            }
        };

        this.renderizarEstructura();
    }

    // Esta función será llamada desde monitormapon.js cada vez que haya datos nuevos
    actualizarDatos(datosMapon) {
        if (!datosMapon || datosMapon.length === 0) return;

        // Limpiador de formato rápido
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

        // Filtrar SOLO los que NO son "OK"
        this.equiposConFalla = datosMapon.filter(unidad => {
            let estado = extraer(unidad, ["onlinestatus", "estado", "columna14"]);
            let eLimpio = (estado || "").toString().trim().toUpperCase();
            // Ignoramos los OK y los que dicen OK (NOGPS) a menos que quieras considerarlos falla también
            return eLimpio !== "OK" && eLimpio !== "OK (NOGPS)" && eLimpio !== "" && eLimpio !== "SIN ASIGNAR" && eLimpio !== "DESCONOCIDO";
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
                
                <!-- ESTADÍSTICAS RÁPIDAS -->
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

                <!-- CONTENEDOR DE TARJETAS -->
                <div id="contenedor-tarjetas-falla" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
                    <p style="color: #666; width: 100%; text-align: center; grid-column: 1 / -1; padding: 40px;">Esperando datos de Mapon...</p>
                </div>
            </div>
        `;
    }

    renderizarTarjetas() {
        const contenedor = document.getElementById('contenedor-tarjetas-falla');
        document.getElementById('diag-count-total').innerText = this.equiposConFalla.length;
        
        if (this.equiposConFalla.length === 0) {
            contenedor.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 50px; background: rgba(0, 230, 118, 0.05); border: 1px dashed #00e676; border-radius: 8px;">
                    <span style="font-size: 3rem;">🎉</span>
                    <h3 style="color: #00e676; margin: 10px 0;">¡Todos los equipos están en línea!</h3>
                    <p style="color: #aaa; margin: 0;">No se detectaron fallas en el reporte actual de Mapon.</p>
                </div>`;
            return;
        }

        contenedor.innerHTML = '';

        this.equiposConFalla.forEach((unidad, index) => {
            // Reusamos el destructor de formatos local
            const extraer = (u, posibles) => {
                for(let n of posibles) {
                    let nLimpio = String(n).replace(/[^a-z0-9]/gi, "").toLowerCase();
                    for(let k in u) {
                        let kLimpio = String(k).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
                        if(kLimpio === nLimpio || kLimpio.includes(nLimpio)) return u[k];
                    }
                }
                return null;
            };

            let compania = extraer(unidad, ["compania", "company", "cliente", "columna0"]) || 'Sin asignar';
            let economico = extraer(unidad, ["economico", "name", "unidad", "columna1"]) || 'S/N';
            let idSerie = extraer(unidad, ["numdeserie", "serie", "imei", "iddisp", "columna10", "columna8", "columna6"]) || 'S/N';
            let estado = extraer(unidad, ["onlinestatus", "estado", "columna14"]) || 'Desconocido';
            let ultimoReporte = extraer(unidad, ["lastdatareceived", "ultimoreporte", "reporte", "columna15"]) || 'Sin fecha';
            let marca = extraer(unidad, ["marca", "vehiclebrand", "columna2"]) || '-';
            let modelo = extraer(unidad, ["modelo", "vehiclemodel", "columna3"]) || '-';

            let estadoUp = estado.toString().toUpperCase().trim();
            
            // Evaluamos el Triaje
            let datosTriaje = this.triaje[estadoUp] || { color: '#f44336', mensaje: 'Falla no catalogada. Se requiere análisis manual.' };
            
            // Buscamos si tenemos más info en nuestro inventario de soporte
            let linea = 'Desconocida';
            if (window.appSoporte && window.appSoporte.equipos) {
                let eqMatch = window.appSoporte.equipos.find(e => {
                    let idLimpio = String(e.id).replace(/\.0$/, '').replace(/\s+/g, '').toLowerCase();
                    let sLimpia = String(idSerie).replace(/\.0$/, '').replace(/\s+/g, '').toLowerCase();
                    return idLimpio === sLimpia;
                });
                if(eqMatch) linea = eqMatch.linea || 'Sin número';
            }

            // ID único para la caja de la respuesta de la IA
            const idRespuestaIA = `ia-resp-${index}`;

            const tarjeta = document.createElement('div');
            tarjeta.style.cssText = `background: #1a1a1a; border-radius: 8px; border: 1px solid #333; overflow: hidden; display: flex; flex-direction: column;`;
            
            tarjeta.innerHTML = `
                <!-- Cabecera de la tarjeta -->
                <div style="padding: 12px 15px; background: rgba(255, 255, 255, 0.02); border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-weight: bold; color: #fff; font-size: 1.1rem;">${economico}</div>
                    <div style="background: ${datosTriaje.color}20; color: ${datosTriaje.color}; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; border: 1px solid ${datosTriaje.color}50;">
                        ${estado}
                    </div>
                </div>
                
                <!-- Cuerpo de datos -->
                <div style="padding: 15px; font-size: 0.85rem; color: #aaa; flex: 1;">
                    <div style="margin-bottom: 5px;"><strong style="color: #ddd;">Compañía:</strong> ${compania}</div>
                    <div style="margin-bottom: 5px;"><strong style="color: #ddd;">Equipo:</strong> ${marca} ${modelo}</div>
                    <div style="margin-bottom: 5px;"><strong style="color: #ddd;">ID/Serie:</strong> ${idSerie}</div>
                    <div style="margin-bottom: 10px;"><strong style="color: #ddd;">Último Reporte:</strong> ${ultimoReporte}</div>
                    <div style="margin-bottom: 15px;"><strong style="color: #ddd;">Línea SMS:</strong> ${linea}</div>
                    
                    <!-- Pre-diagnóstico (Triaje) -->
                    <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px; border-left: 3px solid ${datosTriaje.color}; font-size: 0.8rem; line-height: 1.4;">
                        <strong style="color: ${datosTriaje.color};">Pre-Diagnóstico:</strong><br>
                        ${datosTriaje.mensaje}
                    </div>
                    
                    <!-- Contenedor para la respuesta de PU-K -->
                    <div id="${idRespuestaIA}" style="display: none; margin-top: 15px; padding: 10px; background: #111; border: 1px dashed #ffb74d; border-radius: 6px; color: #e0e0e0; font-size: 0.85rem; line-height: 1.4;">
                        <!-- Aquí escupirá el texto Gemini -->
                    </div>
                </div>
                
                <!-- Botonera -->
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
    // LÓGICA DE LA COLA DE TRABAJO (LA MAGIA)
    // ==========================================
    
    async analizarEquipoIndividual(index) {
        const unidad = this.equiposConFalla[index];
        if(!unidad) return;
        
        const idCaja = `ia-resp-${index}`;
        const caja = document.getElementById(idCaja);
        if (caja) {
            caja.style.display = 'block';
            caja.innerHTML = '<span style="color: #64b5f6;">🐕 PU-K olfateando este equipo...</span>';

            // Simularemos una respuesta por ahora:
            setTimeout(() => {
                caja.innerHTML = `
                    <b style="color: #ffb74d;">Diagnóstico Inteligente:</b><br>
                    El equipo perdió comunicación. Te sugiero enviar el comando de reinicio:<br>
                    <button style="margin-top:5px; background:#4caf50; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.75rem;">Enviar SMS Reinicio</button>
                `;
            }, 1500);
        }
    }

    async iniciarAnalisisEnCola() {
        if(this.analisisEnProgreso) return;
        if(this.equiposConFalla.length === 0) {
            alert("No hay equipos con falla para analizar.");
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

        // Iteramos con un for asíncrono
        for (let i = 0; i < this.equiposConFalla.length; i++) {
            await this.analizarEquipoIndividual(i);
            resueltos++;
            if (contadorResueltos) contadorResueltos.innerText = resueltos;
            
            // Pausa entre peticiones
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
