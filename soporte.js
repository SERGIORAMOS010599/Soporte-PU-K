class SoporteTecnico {
    constructor() {
        this.container = document.getElementById('grid-salidas');
        this.sheetId = '1JpRyU-cFuGpmZpfuTil7FicbyFUrX3GS_nMUZLSUKKM'; 
        
        this.equipos = [];
        this.diccionarioComandos = []; // Se cargará dinámicamente desde el JSON
        this.equipoSeleccionado = null; 
        this.comandoSeleccionado = null; 
        
        this.busquedaActual = localStorage.getItem('busquedaGlobal') || ''; 
        this.iniciar();
    }

    async iniciar() {
        if (!this.container) return;
        this.container.innerHTML = '<p style="text-align:center; color: #ffb74d; padding: 20px;">Conectando con Google Sheets y GitHub...</p>';
        
        const urlInventario = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('Salidas')}`;
        
        // AQUÍ VA TU ENLACE RAW DE GITHUB (El de comandos.json)
        const urlComandos = 'https://raw.githubusercontent.com/SERGIORAMOS010599/Soporte-PU-K/refs/heads/main/comandos.json';
        
        try {
            // Hacemos ambas peticiones al mismo tiempo para mayor velocidad
            const [respuestaInv, respuestaCmd] = await Promise.all([
                fetch(urlInventario),
                fetch(urlComandos)
            ]);

            const textInv = await respuestaInv.text();
            const jsonInv = JSON.parse(textInv.substring(47).slice(0, -2));
            
            // Cargamos tu Biblia Técnica desde el JSON
            this.diccionarioComandos = await respuestaCmd.json();
            
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
                        compania: val(7) || 'N/A', // NUEVO: Compañía
                        estado: val(8) || 'N/A',   // NUEVO: Estado
                        cliente: val(9) || 'SIN CLIENTE',
                        estadoServicio: val(10) || 'PENDIENTE',
                        unidad: val(11) || 'SIN UNIDAD',
                        marcaModeloUnidad: val(12) || 'pendiente de asignar',
                        anio: val(13) || 'pendiente de asignar',
                        numSerie: val(14) || 'pendiente de asignar',
                        tipoServicio: val(15) || 'PENDIENTE DE ASIGNAR'
                    };
                    // Protección con String()
                    if (equipo.id !== 'N/A' && String(equipo.id).trim() !== '') this.equipos.push(equipo);
                }
            });

            const inputBuscador = document.getElementById('buscador-global');
            if (inputBuscador) {
                inputBuscador.value = this.busquedaActual;
                document.getElementById('btn-limpiar-busqueda').style.display = this.busquedaActual ? 'block' : 'none';
            }
            this.renderizar();
        } catch (error) {
            console.error("Error al conectar con las bases de datos:", error);
            this.container.innerHTML = '<p style="text-align:center; color:#ff4c4c;">Error al cargar inventario o comandos.</p>';
        }
    } 

    // --- FUNCIONES DEL BUSCADOR GLOBAL ---
    buscarGlobal(texto) {
        this.busquedaActual = texto;
        localStorage.setItem('busquedaGlobal', texto); 
        document.getElementById('btn-limpiar-busqueda').style.display = texto.length > 0 ? 'block' : 'none';
        this.renderizar(); 
    }

    limpiarBusqueda() {
        document.getElementById('buscador-global').value = '';
        this.buscarGlobal('');
    }

    // --- RENDERIZADO Y PANTALLAS ---
renderizar() {
        this.container.innerHTML = '';
        const query = this.busquedaActual.toLowerCase().trim();
        
        // --- BUSCADOR UNIVERSAL MEJORADO ---
        const equiposFiltrados = this.equipos.filter(eq => {
            // Si no hay texto de búsqueda, muestra todos
            if (query === '') return true;
            
            // Revisa TODAS las propiedades del equipo (id, marca, cliente, serie, etc.)
            // Si alguna coincide con lo que el técnico escribió, muestra la tarjeta.
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
            icono = '🐕‍🦺'; colorBorde = '#ff4c4c'; // Rojo
        } else if (estado === 'exito') {
            icono = '🐾'; colorBorde = '#4caf50'; // Verde
        } else if (estado === 'pensando') {
            icono = '🐕'; colorBorde = '#64b5f6'; // Azul (Conectando a la IA)
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

    // --- CONEXIÓN CON GEMINI (EL CEREBRO EN LA NUBE) ---
    async consultarCerebroPUK(pregunta) {
        this.hablarPUK("Olfateando en mis manuales técnicos... Dame unos segundos 🐕", "pensando");
        
        // TU ENLACE DE APPS SCRIPT
        const urlAppsScript = 'https://script.google.com/macros/s/AKfycbwtMAnW-IoAEjLEGTq6TVzalr4XaKxt0IV7aczKNaqKFI-Vt3WE3MEFN522uWE81tM/exec';

        try {
            const peticion = await fetch(urlAppsScript, {
                method: 'POST',
                body: JSON.stringify({ mensaje: pregunta })
            });
            const respuesta = await peticion.json();

            if (respuesta.success) {
                // Formateamos la respuesta de Gemini (saltos de línea y negritas) para que se vea bien en HTML
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

    // --- TRADUCTOR DE INTENCIONES ACTUALIZADO ---
    filtrarAsistente(ejecutarPeticion = false) {
        if (!this.equipoSeleccionado) return;
        const inputBuscador = document.getElementById('buscador-asistente');
        const textoOriginal = inputBuscador ? inputBuscador.value.toLowerCase().trim() : '';
        
        const comandosValidos = this.diccionarioComandos.filter(cmd => this.esComandoValido(cmd));
        
        if (textoOriginal === '') {
            this.mostrarBotonesSugerencia(comandosValidos);
            this.hablarPUK("¡Hola! Soy PU-K. Escribe un comando (ej. 'apn corporativo') o <b>hazme una pregunta técnica y presiona Enter</b>. ¡Guau!", "normal");
            return;
        }

        const palabrasBuscadas = textoOriginal.split(' ').filter(p => p.trim().length > 0);

        let comandosFiltrados = comandosValidos.filter(cmd => {
            const clavesText = cmd.claves.toLowerCase();
            const tituloText = cmd.titulo.toLowerCase();
            return palabrasBuscadas.every(palabra => clavesText.includes(palabra) || tituloText.includes(palabra));
        });

        comandosFiltrados.sort((a, b) => {
            if (a.claves.includes('default') && !b.claves.includes('default')) return -1;
            if (!a.claves.includes('default') && b.claves.includes('default')) return 1;
            return 0;
        });

        if (ejecutarPeticion) {
            if (comandosFiltrados.length > 0) {
                const mejorComando = comandosFiltrados[0];
                this.seleccionarComandoAsistente(mejorComando);
                if (mejorComando.preguntas === "") this.generarComandoFinal();
                
                this.hablarPUK(`¡Atrapé el comando para <b style="color:#fff;">${mejorComando.titulo}</b>! Generando la trama...`, "exito");
            } else {
                // AQUÍ ENTRA LA INTELIGENCIA ARTIFICIAL (GEMINI)
                document.getElementById('asistente-sugerencias').innerHTML = '';
                this.consultarCerebroPUK(textoOriginal);
            }
        } else {
            if (comandosFiltrados.length > 0) {
                this.mostrarBotonesSugerencia(comandosFiltrados);
                this.hablarPUK("¡Olfateé estos comandos! Haz clic en el que necesites o presiona Enter.", "normal");
            } else {
                document.getElementById('asistente-sugerencias').innerHTML = '';
                // Si no hay comandos, le avisa al usuario que puede buscar en la IA
                this.hablarPUK(`No encontré comandos directos para "<i>${textoOriginal}</i>". <br><b style="color:#64b5f6;">¡Presiona Enter y le preguntaré a mi cerebro de IA! 🐶</b>`, "pensando");
            }
        }
    }

    mostrarBotonesSugerencia(comandosFiltrados) {
        const contenedorSugerencias = document.getElementById('asistente-sugerencias');
        if (!contenedorSugerencias) return;
        contenedorSugerencias.innerHTML = '';

        comandosFiltrados.forEach((cmd) => {
            const btn = document.createElement('button');
            btn.innerText = cmd.titulo;
            btn.style.cssText = 'background: #333; color: #ffb74d; border: 1px solid #555; padding: 6px 12px; border-radius: 15px; cursor: pointer; font-size: 0.85em; transition: 0.2s;';
            btn.onmouseover = () => btn.style.background = '#444';
            btn.onmouseout = () => btn.style.background = '#333';
            btn.onclick = () => {
                this.seleccionarComandoAsistente(cmd);
                if (cmd.preguntas === "") this.generarComandoFinal();
            };
            contenedorSugerencias.appendChild(btn);
        });
    }

    seleccionarComandoAsistente(cmd) {
        this.comandoSeleccionado = cmd;
        const contenedorSugerencias = document.getElementById('asistente-sugerencias');
        const contenedor = document.getElementById('asistente-interactivo');
        
        if (contenedorSugerencias) contenedorSugerencias.innerHTML = ''; 
        contenedor.style.display = 'block';
        contenedor.innerHTML = '';

        const titulo = document.createElement('h4');
        titulo.innerText = `⚙️ Ejecutando: ${cmd.titulo}`;
        titulo.style.cssText = 'margin: 0 0 10px 0; color: #fff; font-size: 1rem;';
        contenedor.appendChild(titulo);

        if (cmd.preguntas && cmd.preguntas.trim() !== '') {
            const preguntasArray = cmd.preguntas.split(',');
            preguntasArray.forEach((pregunta, index) => {
                const div = document.createElement('div');
                div.style.marginBottom = '10px';
                div.innerHTML = `
                    <label style="display:block; font-size:0.8em; color:#a0a0a0; margin-bottom:4px;">${pregunta.trim()}</label>
                    <input type="text" id="asistente-input-${index}" class="input-edicion-general" onkeyup="appSoporte.generarComandoFinal()">
                `;
                contenedor.appendChild(div);
            });
            
            const resultado = document.createElement('div');
            resultado.id = 'asistente-resultado-final';
            resultado.style.marginTop = '15px';
            resultado.innerHTML = '<span style="color:#ffb74d; font-size:0.85em;">Por favor, llena los datos requeridos para generar la trama...</span>';
            contenedor.appendChild(resultado);
        } else {
            const resultado = document.createElement('div');
            resultado.id = 'asistente-resultado-final';
            contenedor.appendChild(resultado);
        }
    }

    generarComandoFinal() {
        const cmd = this.comandoSeleccionado;
        if (!cmd) return;

        let tramaFinal = cmd.plantilla;
        tramaFinal = tramaFinal.replace(/{ID}/g, this.equipoSeleccionado.id);
        
        if (cmd.preguntas && cmd.preguntas.trim() !== '') {
            const preguntasArray = cmd.preguntas.split(',');
            let faltanDatos = false;

            preguntasArray.forEach((_, index) => {
                const inputElem = document.getElementById(`asistente-input-${index}`);
                const valorInput = inputElem ? inputElem.value.trim() : '';
                if (valorInput === '') faltanDatos = true;
                tramaFinal = tramaFinal.replace(new RegExp(`{VALOR${index + 1}}`, 'g'), valorInput);
            });

            if (faltanDatos) {
                document.getElementById('asistente-resultado-final').innerHTML = '<span style="color:#ffb74d; font-size:0.85em;">Llena todos los datos para continuar.</span>';
                return;
            }
        }

        const numeroLinea = this.equipoSeleccionado.linea;
        let enlaceSMS = '#';
        if (numeroLinea && numeroLinea !== 'SIN NÚMERO') {
            enlaceSMS = `sms:${numeroLinea}?body=${encodeURIComponent(tramaFinal)}`;
        }

        document.getElementById('asistente-resultado-final').innerHTML = `
            <div class="comando-resultado">
                <a href="${enlaceSMS}" style="color: #6db6ff; text-decoration: none; word-break: break-all; width: 85%;" title="Haz clic para enviar SMS">${tramaFinal}</a> 
                <span class="icono-copiar" style="cursor:pointer; font-size: 1.2rem;" onclick="navigator.clipboard.writeText('${tramaFinal}'); alert('¡Comando Copiado!');">📋</span>
            </div>
        `;
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

        // --- ACCIONES DIRECTAS DE LOS BOTONES ---
        if (accion === 'apagar') {
            if (modelo.startsWith("ST6")) comando = `ST600CMD;${id};02;Enable1`;
            else if (modelo.startsWith("ST30") || modelo.startsWith("ST34")) comando = `ST300CMD;${id};02;Enable1`;
            else if (modelo.startsWith("ST2")) comando = `SA200CMD;${id};02;Enable1`;
            else if (modelo.startsWith("ST33") || modelo.startsWith("ST43") || modelo.startsWith("ST82")) comando = `CMD;${id};04;01`;
            else if (marca === "TELTONIKA") comando = "  setdigout 1 0";
        } else if (accion === 'encender') {
            if (modelo.startsWith("ST6")) comando = `ST600CMD;${id};02;Disable1`;
            else if (modelo.startsWith("ST30") || modelo.startsWith("ST34")) comando = `ST300CMD;${id};02;Disable1`;
            else if (modelo.startsWith("ST2")) comando = `SA200CMD;${id};02;Disable1`;
            else if (modelo.startsWith("ST33") || modelo.startsWith("ST43") || modelo.startsWith("ST82")) comando = `CMD;${id};04;02`;
            else if (marca === "TELTONIKA") comando = "  setdigout 0 0";
        } 
        else if (accion === 'reiniciar') {
            if (marca === "SUNTECH") comando = `CMD;${id};03;03`;
            else if (marca === "TELTONIKA") comando = "  cpureset";
        }

        // --- EJECUCIÓN O DERIVACIÓN A LA IA ---
        if (comando) {
            window.open(`sms:${numero}?body=${encodeURIComponent(comando)}`, '_self');
        } else {
            const inputBuscador = document.getElementById('buscador-asistente');
            if (inputBuscador) {
                inputBuscador.value = accion;
                this.filtrarAsistente(true); 
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => { window.appSoporte = new SoporteTecnico(); });
