class SoporteTecnico {
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

        const botones = document.querySelectorAll('.tab-btn');
        botones.forEach(btn => btn.classList.remove('activo'));

        if (vistaDestino === 'soporte') {
            document.getElementById('vista-soporte').classList.remove('vista-oculta');
            document.getElementById('vista-soporte').classList.add('vista-activa');
            botones[0].classList.add('activo');
        } 
        else if (vistaDestino === 'monitores') {
            document.getElementById('vista-monitores').classList.remove('vista-oculta');
            document.getElementById('vista-monitores').classList.add('vista-activa');
            botones[1].classList.add('activo');
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
            tarjeta.innerHTML = `
                <div class="tarjeta-unidad">${eq.unidad}</div>
                <div class="tarjeta-cliente">${eq.cliente} (${eq.id})</div>
                <h2 class="tarjeta-marca">${eq.marca}</h2>
                <div class="tarjeta-modelo">${eq.modelo}</div>
                <div class="tarjeta-servicio">${eq.estadoServicio}</div>
                <div class="tarjeta-acciones">
                    <div class="accion-btn rojo" onclick="event.stopPropagation(); appSoporte.enviarSMS('apagar', '${eq.id}')">APAGAR <span class="circulo"></span></div>
                    <div class="accion-btn verde" onclick="event.stopPropagation(); appSoporte.enviarSMS('encender', '${eq.id}')">ENCENDER <span class="circulo"></span></div>
                </div>
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
            <h1 class="titulo-detalles" id="det-titulo">${eq.unidad}</h1>
            <span class="icono-editar" onclick="appSoporte.activarEdicionGeneral()">✏️</span>
        `;
        document.getElementById('det-id').innerText = eq.id;
        document.getElementById('det-linea').innerText = eq.linea;
        document.getElementById('det-iccid').innerText = eq.iccid;
        document.getElementById('det-imei').innerText = eq.imei;
        document.getElementById('det-marca').innerText = eq.marca;
        document.getElementById('det-modelo').innerText = eq.modelo;
        document.getElementById('det-cliente').innerText = eq.cliente;
        document.getElementById('det-tipo-servicio').innerText = eq.tipoServicio;
        document.getElementById('det-servicio').innerText = eq.estadoServicio;
        document.getElementById('det-marcaModeloUnidad').innerText = eq.marcaModeloUnidad;
        document.getElementById('det-anio').innerText = eq.anio;
        document.getElementById('det-numSerie').innerText = eq.numSerie;

        this.iniciarAsistente();
    }

    // --- ASISTENTE IA DIRECTO ---
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

    // --- MOTOR DE PERSONALIDAD PU-K 🐶 ---
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

    // --- CONEXIÓN CON GEMINI ---
    async consultarCerebroPUK(pregunta) {
        this.hablarPUK("Revisando mis manuales técnicos... Dame unos segundos 🐕", "pensando");
        
        const urlAppsScript = 'https://script.google.com/macros/s/AKfycbxechSb9x2TtDrI_E8egBEkGjZOOFGMXNl5UiBjB9s8n_hJwH6qGHe5aEMMENaEO39H/exec';

        try {
            const peticion = await fetch(urlAppsScript, {
                method: 'POST',
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

    // ==========================================
    // EDICIÓN GENERAL Y UTILIDADES
    // ==========================================
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
        const id = eq.id;
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
            else if (marca.startsWith("CONCOX") || marca.startsWith("JIMIIOT")) comando = "GPRSSET#";
        }
        else if (accion === 'borrar') {
            if (modelo.startsWith("ST6")) comando = `ST600CMD;${id};02;EraseAll`;
            else if (modelo.startsWith("ST30") || modelo.startsWith("ST34")) comando = `ST300CMD;${id};02;EraseAll`;
            else if (modelo.startsWith("ST2")) comando = `SA200CMD;${id};02;EraseAll`;
            else if (modelo.startsWith("ST33") || modelo.startsWith("ST43") || modelo.startsWith("ST82")) comando = `CMD;${id};05;02`;
            else if (marca.startsWith("RUPTELA")) comando = " delrecords";
            else if (marca.startsWith("TELTONIKA")) comando = "  deleterecords";
        }

        if (comando) {
            window.open(`sms:${numero}?body=${encodeURIComponent(comando)}`, '_self');
        }
    }
    
    // --- CHAT FLOTANTE PU-K ---
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

        const urlAppsScript = 'https://script.google.com/macros/s/AKfycbxechSb9x2TtDrI_E8egBEkGjZOOFGMXNl5UiBjB9s8n_hJwH6qGHe5aEMMENaEO39H/exec'; 
        
        try {
            const peticion = await fetch(urlAppsScript, {
                method: 'POST',
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
