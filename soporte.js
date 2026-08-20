class SoporteTecnico {
    constructor() {
        this.container = document.getElementById('grid-salidas');
        this.sheetId = '1JpRyU-cFuGpmZpfuTil7FicbyFUrX3GS_nMUZLSUKKM'; 
        
        this.equipos = [];
        this.equipoSeleccionado = null; 
        this.comandoSeleccionado = null; 
        
        // LA "BIBLIA TÉCNICA" (DICCIONARIO INTELIGENTE)
        this.diccionarioComandos = [
            // --- SERVIDORES Y BÁSICOS SUNTECH ---
            { marca: "SUNTECH", modelo: "UNIVERSAL", titulo: "Cambiar IP / Servidor Manual", claves: "ip, servidor, dns", plantilla: "CMD;{ID};02;01;{VALOR1};{VALOR2}", preguntas: "Ingresa la IP, Ingresa el Puerto" },
            { marca: "SUNTECH", modelo: "UNIVERSAL", titulo: "Configurar a MAPON", claves: "mapon, servidor, ip, tcp", plantilla: "CMD;{ID};02;01;in.fleetapi.com;5729", preguntas: "" },
            { marca: "SUNTECH", modelo: "UNIVERSAL", titulo: "Configurar a ZEEK PÚBLICO", claves: "zeek, servidor, ip, publico", plantilla: "CMD;{ID};02;01;mobile.zeekgps.com;2404", preguntas: "" },
            { marca: "SUNTECH", modelo: "UNIVERSAL", titulo: "Configurar a ZEEK PRIVADO", claves: "zeek, servidor, ip, privado", plantilla: "CMD;{ID};02;01;192.168.9.100;2405", preguntas: "" },
            
            // --- APNs SUNTECH ---
            { marca: "SUNTECH", modelo: "UNIVERSAL", titulo: "APN Corporativo (Con Usuario/Pass)", claves: "apn, telcel, corporativo", plantilla: "CMD;{ID};03;01;wwwcorps.itelcel.com;webgprs;webgprs2002", preguntas: "" },
            { marca: "SUNTECH", modelo: "UNIVERSAL", titulo: "APN Público (Sin Usuario/Pass)", claves: "apn, telcel, publico, internet", plantilla: "CMD;{ID};03;01;internet.itelcel.com;;", preguntas: "" },
            { marca: "SUNTECH", modelo: "UNIVERSAL", titulo: "APN Argus R2 (Privado)", claves: "apn, argus, r2", plantilla: "CMD;{ID};03;01;argus.itelcel.com;;", preguntas: "" },
            { marca: "SUNTECH", modelo: "UNIVERSAL", titulo: "APN Argus R9 (Privado)", claves: "apn, argus, r9", plantilla: "CMD;{ID};03;01;argte.itelcel.com;;", preguntas: "" },

            // --- ACCIONES SUNTECH ---
            { marca: "SUNTECH", modelo: "UNIVERSAL", titulo: "Ignición por Voltaje (12V)", claves: "ignicion, voltaje, 12v", plantilla: "PRG:{ID}#15:13.50,PRG:{ID}#16:13.30", preguntas: "" },
            { marca: "SUNTECH", modelo: "UNIVERSAL", titulo: "Ignición por Voltaje (24V)", claves: "ignicion, voltaje, 24v", plantilla: "PRG:{ID}#15:25.50,PRG:{ID}#16:25.30", preguntas: "" },
            { marca: "SUNTECH", modelo: "UNIVERSAL", titulo: "Apagar Motor / Activar Corte", claves: "apagar, motor, corte, bloquear", plantilla: "CMD;{ID};04;01", preguntas: "" },
            { marca: "SUNTECH", modelo: "UNIVERSAL", titulo: "Encender Motor / Restaurar", claves: "encender, motor, restaurar, desbloquear", plantilla: "CMD;{ID};04;02", preguntas: "" },
            { marca: "SUNTECH", modelo: "UNIVERSAL", titulo: "Reiniciar Dispositivo", claves: "reiniciar, reboot, apagar", plantilla: "CMD;{ID};03;03", preguntas: "" },

            // --- SERVIDORES Y BÁSICOS TELTONIKA ---
            { marca: "TELTONIKA", modelo: "UNIVERSAL", titulo: "Configurar a MAPON", claves: "mapon, servidor, ip, tcp", plantilla: "  setparam 2004:in.fleetapi.com;2005:5688", preguntas: "" },
            { marca: "TELTONIKA", modelo: "UNIVERSAL", titulo: "Configurar a ZEEK PÚBLICO", claves: "zeek, servidor, ip, publico", plantilla: "  setparam 2004:mobile.zeekgps.com;2005:20513", preguntas: "" },
            { marca: "TELTONIKA", modelo: "UNIVERSAL", titulo: "Configurar a ZEEK PRIVADO", claves: "zeek, servidor, ip, privado", plantilla: "  setparam 2004:192.168.9.100;2005:20512", preguntas: "" },
            
            // --- APNs TELTONIKA ---
            { marca: "TELTONIKA", modelo: "UNIVERSAL", titulo: "APN Corporativo (Con Usuario/Pass)", claves: "apn, telcel, corporativo", plantilla: "  setparam 2001:wwwcorps.itelcel.com;2002:webgprs;2003:webgprs2002", preguntas: "" },
            { marca: "TELTONIKA", modelo: "UNIVERSAL", titulo: "APN Público (Sin Usuario/Pass)", claves: "apn, telcel, publico, internet", plantilla: "  setparam 2001:internet.itelcel.com", preguntas: "" },
            { marca: "TELTONIKA", modelo: "UNIVERSAL", titulo: "APN Argus R2 (Privado)", claves: "apn, argus, r2", plantilla: "  setparam 2001:argus.itelcel.com", preguntas: "" },
            { marca: "TELTONIKA", modelo: "UNIVERSAL", titulo: "APN Argus R9 (Privado)", claves: "apn, argus, r9", plantilla: "  setparam 2001:argte.itelcel.com", preguntas: "" },

            // --- ACCIONES TELTONIKA ---
            { marca: "TELTONIKA", modelo: "UNIVERSAL", titulo: "Apagar Motor / Corte", claves: "apagar, motor, corte, salida", plantilla: "  setdigout 1 0", preguntas: "" },
            { marca: "TELTONIKA", modelo: "UNIVERSAL", titulo: "Encender Motor / Restaurar", claves: "encender, motor, restaurar, salida", plantilla: "  setdigout 0 0", preguntas: "" },
            { marca: "TELTONIKA", modelo: "FMC125, FMC920", titulo: "Tipo de Ignición (FMC125/FMC920)", claves: "ignicion, voltaje, 101, movimiento", plantilla: "  setparam 101:{VALOR1}", preguntas: "Valor (1=DIN1, 2=DIN2, 4=DIN3, 16=Mov., 32=Voltaje, suma los valores)" },
            { marca: "TELTONIKA", modelo: "FMC150, FMC003", titulo: "Tipo de Ignición (FMC150/FMC003)", claves: "ignicion, voltaje, 101, can", plantilla: "  setparam 101:{VALOR1}", preguntas: "Valor (1=DIN1, 2=Acel., 4=Volt., 8=RPM, 16=DIN3, 32=CAN, suma valores)" },
            { marca: "TELTONIKA", modelo: "UNIVERSAL", titulo: "Variación de Voltaje (Min/Max)", claves: "voltaje, umbral, ignicion, 104, 105", plantilla: "  setparam 104:{VALOR1};105:{VALOR2}", preguntas: "Voltaje Max (ej. 30000), Voltaje Min (ej. 13300)" },
            { marca: "TELTONIKA", modelo: "UNIVERSAL", titulo: "Información de Sistema", claves: "getinfo, sistema, runtime, estado", plantilla: "  getinfo", preguntas: "" },
            { marca: "TELTONIKA", modelo: "UNIVERSAL", titulo: "Datos GPS Actuales", claves: "getgps, gps, fecha, hora", plantilla: "  getgps", preguntas: "" },
            { marca: "TELTONIKA", modelo: "UNIVERSAL", titulo: "Ubicación en Google Maps", claves: "ggps, mapa, link, google maps", plantilla: "  ggps", preguntas: "" },
            { marca: "TELTONIKA", modelo: "UNIVERSAL", titulo: "Reiniciar Dispositivo", claves: "reiniciar, reboot, cpu", plantilla: "  cpureset", preguntas: "" }
        ];
        
        this.busquedaActual = localStorage.getItem('busquedaGlobal') || ''; 
        this.iniciar();
    }

    async iniciar() {
        if (!this.container) return;
        this.container.innerHTML = '<p style="text-align:center; color: #ffb74d; padding: 20px;">Conectando con Google Sheets...</p>';
        
        const urlInventario = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('Salidas')}`;

        try {
            const respuesta = await fetch(urlInventario);
            const text = await respuesta.text();
            const json = JSON.parse(text.substring(47).slice(0, -2));
            
            this.equipos = [];
            json.table.rows.forEach((row, index) => {
                if (row && row.c && index > 0) {
                    const val = (colIndex) => row.c[colIndex] ? row.c[colIndex].v : '';
                    const equipo = {
                        marca: val(1) || 'SIN MARCA',
                        modelo: val(2) || 'SIN MODELO',
                        id: val(3) || 'N/A',
                        imei: val(4) || 'N/A',
                        linea: val(5) || 'SIN NÚMERO',
                        iccid: val(6) || 'N/A',
                        cliente: val(9) || 'SIN CLIENTE',
                        estadoServicio: val(10) || 'PENDIENTE',
                        unidad: val(11) || 'SIN UNIDAD',
                        marcaModeloUnidad: val(12) || 'pendiente de asignar',
                        anio: val(13) || 'pendiente de asignar',
                        numSerie: val(14) || 'pendiente de asignar',
                        tipoServicio: val(15) || 'PENDIENTE DE ASIGNAR'
                    };
                    if (equipo.id !== 'N/A' && equipo.id.toString().trim() !== '') this.equipos.push(equipo);
                }
            });

            const inputBuscador = document.getElementById('buscador-global');
            if (inputBuscador) {
                inputBuscador.value = this.busquedaActual;
                document.getElementById('btn-limpiar-busqueda').style.display = this.busquedaActual ? 'block' : 'none';
            }
            this.renderizar();
        } catch (error) {
            console.error("Error al conectar con Sheets:", error);
            this.container.innerHTML = '<p style="text-align:center; color:#ff4c4c;">Error al cargar inventario.</p>';
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
        const equiposFiltrados = this.equipos.filter(eq => {
            return eq.id.toString().toLowerCase().includes(query) || 
                   eq.imei.toString().toLowerCase().includes(query) || 
                   eq.iccid.toString().toLowerCase().includes(query) || 
                   eq.cliente.toString().toLowerCase().includes(query) ||
                   eq.unidad.toString().toLowerCase().includes(query);
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

    // ==========================================
    // IA - MOTOR EJECUTOR Y PROCESAMIENTO DE LENGUAJE
    // ==========================================
    iniciarAsistente() {
        const eq = this.equipoSeleccionado;
        const badgeMarca = document.getElementById('asistente-badge-marca');
        if (badgeMarca) badgeMarca.innerText = eq.marca;
        
        const inputBuscador = document.getElementById('buscador-asistente');
        const contenedorInteractivo = document.getElementById('asistente-interactivo');
        if (contenedorInteractivo) contenedorInteractivo.style.display = 'none';
        
        if (inputBuscador) {
            inputBuscador.value = '';
            
            // --- MEJORA DE DISEÑO DE LA BARRA ---
            inputBuscador.placeholder = "🤖 Ej. necesito el apn de argus r2...";
            inputBuscador.style.cssText = "width: 100%; padding: 12px 15px; border-radius: 20px; border: 1px solid #444; background: #222; color: #fff; font-size: 0.95rem; margin-bottom: 15px; outline: none; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); transition: all 0.3s ease; box-sizing: border-box;";
            inputBuscador.onfocus = () => inputBuscador.style.border = "1px solid #ffb74d";
            inputBuscador.onblur = () => inputBuscador.style.border = "1px solid #444";

            // --- OPTIMIZACIÓN DE VELOCIDAD (DEBOUNCE) ---
            inputBuscador.oninput = () => {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    this.filtrarAsistente(false);
                }, 250); 
            };

            // IA: Ejecuta la petición al presionar ENTER
            inputBuscador.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    clearTimeout(this.debounceTimer); 
                    this.filtrarAsistente(true);
                }
            };
        }
        
        this.filtrarAsistente(false);
    }

    esComandoValido(cmd) {
        const marcaActual = this.equipoSeleccionado.marca.toUpperCase().trim();
        return cmd.marca === marcaActual || cmd.marca === 'UNIVERSAL';
    }

    filtrarAsistente(ejecutarPeticion = false) {
        if (!this.equipoSeleccionado) return;
        const inputBuscador = document.getElementById('buscador-asistente');
        const textoOriginal = inputBuscador ? inputBuscador.value.toLowerCase().trim() : '';
        const comandosValidos = this.diccionarioComandos.filter(cmd => this.esComandoValido(cmd));
        
        if (textoOriginal === '') {
            this.mostrarBotonesSugerencia(comandosValidos);
            return;
        }

        // --- TRADUCTOR DE INTENCIONES (IA) ---
        let intencion = textoOriginal;
        
        // 1. Servidores
        if (textoOriginal.includes('mapon')) intencion = 'mapon';
        else if (textoOriginal.includes('zeek') && textoOriginal.includes('publico')) intencion = 'zeek, publico';
        else if (textoOriginal.includes('zeek') && (textoOriginal.includes('privado') || textoOriginal.includes('priv'))) intencion = 'zeek, privado';
        
        // 2. APNs Inteligentes
        else if (textoOriginal.includes('apn')) {
            if (textoOriginal.includes('corporativo') || textoOriginal.includes('corps')) intencion = 'apn, corporativo';
            else if (textoOriginal.includes('publico') || textoOriginal.includes('internet')) intencion = 'apn, publico';
            else if (textoOriginal.includes('argus') && textoOriginal.includes('r2')) intencion = 'apn, r2';
            else if (textoOriginal.includes('argus') && textoOriginal.includes('r9')) intencion = 'apn, r9';
            else intencion = 'apn'; 
        }
        
        // 3. Acciones generales
        else if (textoOriginal.includes('ignicion') || textoOriginal.includes('voltaje')) intencion = 'ignicion';
        else if (textoOriginal.includes('apagar') || textoOriginal.includes('cortar')) intencion = 'apagar';
        else if (textoOriginal.includes('encender') || textoOriginal.includes('restaurar')) intencion = 'encender';

        // Filtramos buscando la intención
        const comandosFiltrados = comandosValidos.filter(cmd => {
            const claves = cmd.claves.split(',').map(c => c.trim().toLowerCase());
            const intencionesArr = intencion.split(',').map(i => i.trim().toLowerCase());
            
            return intencionesArr.every(i => claves.some(c => c.includes(i) || i.includes(c))) || 
                   cmd.titulo.toLowerCase().includes(textoOriginal);
        });

        // --- EJECUCIÓN INTELIGENTE ---
        if (ejecutarPeticion && comandosFiltrados.length > 0) {
            const mejorComando = comandosFiltrados[0];
            this.seleccionarComandoAsistente(mejorComando);
            if (mejorComando.preguntas === "") this.generarComandoFinal();
        } else {
            if (comandosFiltrados.length > 0) {
                this.mostrarBotonesSugerencia(comandosFiltrados);
            } else {
                document.getElementById('asistente-sugerencias').innerHTML = '<span style="color:#ffb74d; font-size:0.85em;">No entendí la petición. Intenta ser más directo, ej: "cambiar apn r2" o "apagar".</span>';
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
        
        contenedorSugerencias.innerHTML = ''; 
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

    enviarSMS(accion, eqIdDesdeTarjeta) {
        let eq = this.equipos.find(e => e.id.toString() === eqIdDesdeTarjeta.toString());
        if (!eq) return;

        const numero = eq.linea;
        if (!numero || numero === 'SIN NÚMERO') {
            alert("No hay un número vinculado.");
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
        } else if (accion === 'encender') {
            if (modelo.startsWith("ST6")) comando = `ST600CMD;${id};02;Disable1`;
            else if (modelo.startsWith("ST30") || modelo.startsWith("ST34")) comando = `ST300CMD;${id};02;Disable1`;
            else if (modelo.startsWith("ST2")) comando = `SA200CMD;${id};02;Disable1`;
            else if (modelo.startsWith("ST33") || modelo.startsWith("ST43") || modelo.startsWith("ST82")) comando = `CMD;${id};04;02`;
            else if (marca === "TELTONIKA") comando = "  setdigout 0 0";
        }

        if (comando) window.open(`sms:${numero}?body=${encodeURIComponent(comando)}`, '_self');
    }
}

document.addEventListener('DOMContentLoaded', () => { window.appSoporte = new SoporteTecnico(); });
