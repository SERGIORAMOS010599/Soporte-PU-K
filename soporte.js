class SoporteTecnico {
    constructor() {
        this.container = document.getElementById('grid-salidas');
        this.sheetId = '1JpRyU-cFuGpmZpfuTil7FicbyFUrX3GS_nMUZLSUKKM';

        // URLs de microservicios en Google Apps Script (sin cambios)
        this.urls = {
            principal: 'https://script.google.com/macros/s/AKfycbxua3f3WK8cOQVV8NGFHaRJ4D7omCK7CptzXtDprnTpooGY-fZxw7m5XoHQgQOAMa2V/exec',
            jasperConsulta: 'https://script.google.com/macros/s/AKfycbxechSb9x2TtDrI_E8egBEkGjZOOFGMXNl5UiBjB9s8n_hJwH6qGHe5aEMMENaEO39H/exec',
            edicionGeneral: 'https://script.google.com/macros/s/AKfycbzgwP6L_DDx5XXidThkm__ECIEX8uba7tbqTlh-JOWACArOkaoRPDIf80qaVsf7gwGz/exec'
        };

        this.equipos = [];
        this.equipoSeleccionado = null;
        this.Actual = localStorage.getItem('Global') || '';
        this.iniciar();
    }

    // =========================================================================
    // 1. NAVEGACIÓN, CARGA DE INVENTARIO Y BÚSQUEDA GLOBAL
    // =========================================================================
    cambiarVista(vistaDestino) {
        const botones = document.querySelectorAll('.tab-btn');
        botones.forEach(btn => btn.classList.remove('activo'));

        ['vista-soporte', 'vista-monitores', 'vista-diagnostico', 'vista-stock', 'vista-satelitales'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('vista-oculta');
                el.classList.remove('vista-activa');
            }
        });

        const vistaMostrada = document.getElementById(`vista-${vistaDestino}`);
        if (vistaMostrada) {
            vistaMostrada.classList.remove('vista-oculta');
            vistaMostrada.classList.add('vista-activa');
        }

        // Índices: 0:Stock, 1:Satelitales, 2:Soporte, 3:Monitores, 4:Diagnostico
        const mapaBotones = { stock: 0, satelitales: 1, soporte: 2, monitores: 3, diagnostico: 4 };
        const idx = mapaBotones[vistaDestino];
        if (idx !== undefined && botones[idx]) {
            botones[idx].classList.add('activo');
        }
        if (vistaDestino === 'soporte') {
            this.renderizar();
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
                    const val = (colIndex) => (row.c[colIndex] ? row.c[colIndex].v : '');
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
                    if (equipo.id !== 'N/A' && String(equipo.id).trim() !== '') {
                        this.equipos.push(equipo);
                    }
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

        if (window.appStock) window.appStock.filtrarTabla(texto);
        if (window.appSatelitales) window.appSatelitales.filtrarTabla(texto);

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
            return Object.values(eq).some(valor => String(valor).toLowerCase().includes(query));
        });

        if (equiposFiltrados.length === 0) {
            this.container.innerHTML = '<p style="color:#a0a0a0; text-align:center;">Sin resultados.</p>';
            return;
        }

        const limpiarClave = (v) => String(v || '').replace(/\.0$/, '').replace(/\s+/g, '').trim().toLowerCase();

        equiposFiltrados.forEach(eq => {
            const tarjeta = document.createElement('div');
            tarjeta.className = 'tarjeta-gps';

            let estadoServicioFinal = eq.estadoServicio;
            let unidadFinal = eq.unidad;
            let marcaModeloUnidadFinal = eq.marcaModeloUnidad;
            let anioFinal = eq.anio;
            let numSerieFinal = eq.numSerie;
            let clienteFinal = eq.cliente;

            if (maponData.length > 0) {
                const idSoporte = limpiarClave(eq.id);
                const imeiSoporte = limpiarClave(eq.imei);

                const eqMapon = maponData.find(m => {
                    const rawMapon = m['Núm. de serie '] || m['Núm. de serie'] || m['ID disp.'] || m['IMEI'] || '';
                    const idM = limpiarClave(rawMapon);
                    return (idM !== '' && idM !== 's/n') && (idM === idSoporte || idM === imeiSoporte);
                });

                if (eqMapon) {
                    estadoServicioFinal = 'INSTALADO';
                    unidadFinal = eqMapon['Economico'] || eqMapon['Name'] || eq.unidad;
                    const mMarca = eqMapon['Marca'] || eqMapon['Vehicle brand'] || '';
                    const mModelo = eqMapon['Modelo'] || eqMapon['Vehicle model'] || '';
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

    // =========================================================================
    // 2. PANEL DE DETALLES Y EDICIÓN GENERAL
    // =========================================================================
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

        // Botones dinámicos de plataforma (SCUTI / FOTA / DMP)
        const modeloUpper = `${eq.marca || ''} ${eq.modelo || ''}`.toUpperCase();
        let plataforma = null;

        if (modeloUpper.includes('SUNTECH') || /ST\s*-?\s*\d/.test(modeloUpper)) {
            plataforma = {
                nombreWeb: 'SCUTI WEB',
                nombreCmd: 'COMANDO SCUTI',
                url: 'https://www.suntechscuti.com/scuti/Login',
                color: '#ffb74d'
            };
        } else if (modeloUpper.includes('TELTONIKA') || modeloUpper.includes('FMC') || modeloUpper.includes('FMB')) {
            plataforma = {
                nombreWeb: 'FOTA WEB',
                nombreCmd: 'COMANDO FOTA',
                url: 'https://fota.teltonika.lt/devices?root=27623',
                color: '#ffb74d'
            };
        } else if (modeloUpper.includes('RUPTELA') || modeloUpper.includes('HCV') || modeloUpper.includes('PRO') || modeloUpper.includes('TRACE')) {
            plataforma = {
                nombreWeb: 'DMP WEB',
                nombreCmd: 'COMANDO DMP',
                url: 'https://dmp.ruptela.com/login',
                color: '#ffb74d'
            };
        }

        const cajaBotonesRedondos = document.querySelector('.panel-botones');
        if (cajaBotonesRedondos) {
            const btnWebOld = document.getElementById('btn-dinamico-web');
            const btnComandoOld = document.getElementById('btn-dinamico-comando');
            if (btnWebOld) btnWebOld.remove();
            if (btnComandoOld) btnComandoOld.remove();

            if (plataforma) {
                const btnWeb = document.createElement('button');
                btnWeb.id = 'btn-dinamico-web';
                btnWeb.className = 'btn-accion';
                btnWeb.onclick = () => window.open(plataforma.url, '_blank');
                btnWeb.innerHTML = `
                    <div class="icono" style="background-color: ${plataforma.color}; color: #111;">T</div>
                    ${plataforma.nombreWeb}
                `;

                const btnComando = document.createElement('button');
                btnComando.id = 'btn-dinamico-comando';
                btnComando.className = 'btn-accion';
                btnComando.onclick = () => appSoporte.enviarSMS('comando_plataforma', eq.id);
                btnComando.innerHTML = `
                    <div class="icono" style="background-color: ${plataforma.color}; color: #111;">🗔</div>
                    ${plataforma.nombreCmd}
                `;

                cajaBotonesRedondos.appendChild(btnWeb);
                cajaBotonesRedondos.appendChild(btnComando);
            }
        }

        // Botón siempre visible de Telcel Jasper
        const contenedorAsistenteBody = document.querySelector('.comandos-body');
        const botonJasperExistente = document.getElementById('contenedor-jasper-panel');

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
            const btnJasper = botonJasperExistente.querySelector('button');
            if (btnJasper) btnJasper.setAttribute('onclick', `appSoporte.consultarJasperLinea('${eq.iccid}')`);
            const boxJasper = document.getElementById('jasper-resultado-box');
            if (boxJasper) boxJasper.innerHTML = '';
        }

        this.iniciarAsistente();
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
            numSerie: document.getElementById('input-edit-numSerie').value
        };

        try {
            const respuesta = await fetch(this.urls.edicionGeneral, {
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

    // =========================================================================
    // 3. COMANDOS SMS RÁPIDOS (DETECCIÓN AUTOMÁTICA DE PROTOCOLO SUNTECH)
    // =========================================================================
    detectarProtocoloSuntech(modeloRaw) {
        const m = String(modeloRaw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

        // Generación Universal: ST4xxx, ST8xxx y ST3xxx de 4 dígitos (ST3000, ST3310...)
        if (/ST4\d/.test(m) || /ST8\d/.test(m) || /ST3\d{3}/.test(m)) {
            return 'UNIVERSAL';
        }
        // Generación Pasada (Legacy): ST6xx, ST3xx (3 dígitos) y ST2xx
        if (/ST6\d/.test(m)) return 'ST600CMD';
        if (/ST3\d{2}(?!\d)/.test(m)) return 'ST300CMD';
        if (/ST2\d/.test(m)) return 'SA200CMD';

        return 'DESCONOCIDO';
    }

    enviarSMS(accion, eqIdDesdeTarjeta = null) {
        const eq = eqIdDesdeTarjeta
            ? this.equipos.find(e => String(e.id) === String(eqIdDesdeTarjeta))
            : this.equipoSeleccionado;

        if (!eq) return;

        const numero = eq.linea;
        if (!numero || numero === 'SIN NÚMERO') {
            alert("No hay un número vinculado para este equipo.");
            return;
        }

        const marca = String(eq.marca || '').toUpperCase().trim();
        const modelo = String(eq.modelo || '').toUpperCase().trim();
        const id = String(eq.id).trim();
        const esSuntech = marca.includes("SUNTECH") || /ST\s*-?\s*\d/.test(modelo);

        let protoSuntech = null;
        if (esSuntech) {
            protoSuntech = this.detectarProtocoloSuntech(modelo);
            if (protoSuntech === 'DESCONOCIDO') {
                alert(`⚠️ Modelo Suntech no reconocido (${eq.modelo}). Revisa el nombre del modelo en el inventario.`);
                return;
            }
        }

        let comando = "";

        if (accion === 'apagar') {
            if (esSuntech) {
                comando = (protoSuntech === 'UNIVERSAL')
                    ? `CMD;${id};04;01`
                    : `${protoSuntech};${id};02;Enable1`;
            } else if (marca.includes("TELTONIKA")) {
                comando = "  setdigout 1 0";
            }
        } else if (accion === 'encender') {
            if (esSuntech) {
                comando = (protoSuntech === 'UNIVERSAL')
                    ? `CMD;${id};04;02`
                    : `${protoSuntech};${id};02;Disable1`;
            } else if (marca.includes("TELTONIKA")) {
                comando = "  setdigout 0 0";
            }
        } else if (accion === 'reiniciar') {
            if (esSuntech) {
                comando = (protoSuntech === 'UNIVERSAL')
                    ? `CMD;${id};03;03`
                    : `${protoSuntech};${id};02;Reboot`;
            } else if (marca.includes("TELTONIKA")) {
                comando = "  cpureset";
            } else if (marca.includes("RUPTELA")) {
                comando = " reset";
            } else if (marca.includes("CONCOX") || marca.includes("JIMIIOT")) {
                comando = "REBOOT#";
            }
        } else if (accion === 'configuracion') {
            if (esSuntech) {
                comando = (protoSuntech === 'UNIVERSAL')
                    ? `CMD;${id};03;05`
                    : `${protoSuntech};${id};02;PresetA`;
            } else if (marca.includes("TELTONIKA")) {
                comando = "  getparam 2001:;2002:;2003:;2004:;2005:;2006:;1004:";
            } else if (marca.includes("RUPTELA")) {
                comando = " getapn";
            } else if (marca.includes("CONCOX") || marca.includes("JIMIIOT")) {
                comando = "GPRSSET#";
            }
        } else if (accion === 'borrar') {
            if (esSuntech) {
                comando = (protoSuntech === 'UNIVERSAL')
                    ? `CMD;${id};05;02`
                    : `${protoSuntech};${id};02;EraseAll`;
            } else if (marca.includes("RUPTELA")) {
                comando = " delrecords";
            } else if (marca.includes("TELTONIKA")) {
                comando = "  deleterecords";
            }
        } else if (accion === 'comando_plataforma') {
            if (esSuntech) {
                if (protoSuntech === 'UNIVERSAL') {
                    comando = `CMD;${id};01;01`;
                } else {
                    alert(`ℹ️ El modelo ${eq.modelo} (${protoSuntech}) es generación pasada y no soporta el comando SCUTI Universal.`);
                    return;
                }
            } else if (marca.includes("TELTONIKA")) {
                comando = "  web_connect";
            } else if (marca.includes("RUPTELA")) {
                comando = " dmpfconnect";
            }
        }

        if (comando) {
            window.open(`sms:${numero}?body=${encodeURIComponent(comando)}`, '_self');
        } else {
            alert(`⚠️ No hay un comando "${accion}" configurado para ${eq.marca} ${eq.modelo}.`);
        }
    }

    enviarComandoDirectoSMS(comandoCodificado) {
        const eq = this.equipoSeleccionado;
        if (!eq) return;

        const numero = eq.linea;
        if (!numero || numero === 'SIN NÚMERO') {
            alert("No hay un número vinculado para este equipo.");
            return;
        }

        const comando = decodeURIComponent(comandoCodificado);
        window.open(`sms:${numero}?body=${encodeURIComponent(comando)}`, '_self');
    }

    // =========================================================================
    // 4. ASISTENTE DE CONFIGURACIÓN PU-K (IA)
    // =========================================================================
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
            inputBuscador.onfocus = () => { inputBuscador.style.border = "1px solid #ffb74d"; };
            inputBuscador.onblur = () => { inputBuscador.style.border = "1px solid #444"; };
            inputBuscador.oninput = null;

            inputBuscador.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const pregunta = inputBuscador.value.trim();
                    if (pregunta !== '') {
                        const promptOculto = `El técnico solicita: "${pregunta}". NOTA INTERNA: El equipo en pantalla es Marca: ${eq.marca}, Modelo: ${eq.modelo}, ID: ${eq.id}. Usa esta información para armar el comando correcto en base a tus manuales y reemplaza el {ID}. REGLA DE FORMATO: Cada comando SMS listo para enviar que incluyas en tu respuesta debes envolverlo estrictamente así: [SMS:comando_exacto] (sin espacio extra después de los dos puntos a menos que el comando del manual lleve espacios al inicio, como Teltonika o Ruptela, y sin comillas ni acentos invertidos adentro).`;
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

        const estilosEstado = {
            error: { icono: '🐕‍🦺', color: '#ff4c4c' },
            exito: { icono: '🐾', color: '#4caf50' },
            pensando: { icono: '🐕', color: '#64b5f6' },
            normal: { icono: '🐶', color: '#ffb74d' }
        };
        const { icono, color } = estilosEstado[estado] || estilosEstado.normal;

        cajaPUK.style.borderLeft = `4px solid ${color}`;
        cajaPUK.innerHTML = `
            <span style="font-size: 2.2em; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));">${icono}</span>
            <span style="line-height: 1.4; width: 100%;">
                <b style="color: ${color}; font-size: 1.05em;">PU-K dice:</b><br>
                ${mensaje}
            </span>
        `;
    }

    async consultarCerebroPUK(pregunta) {
        this.hablarPUK("Revisando mis manuales técnicos... Dame unos segundos 🐕", "pensando");

        try {
            const peticion = await fetch(this.urls.principal, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ mensaje: pregunta })
            });
            const respuesta = await peticion.json();

            if (respuesta.success) {
                const textoHTML = respuesta.respuesta
                    .replace(/`?\[SMS:([^\]]+)\]`?/g, (match, comando) => {
                        const cmdCodificado = encodeURIComponent(comando).replace(/'/g, "%27");
                        return `<a href="javascript:void(0)" onclick="appSoporte.enviarComandoDirectoSMS('${cmdCodificado}')" title="Clic para abrir en Mensajes SMS" style="display: inline-block; margin: 4px 2px; padding: 5px 10px; background: rgba(255, 183, 77, 0.15); border: 1px solid #ffb74d; border-radius: 6px; color: #ffb74d; font-family: monospace; font-weight: bold; text-decoration: none; cursor: pointer;">📩 ${comando}</a>`;
                    })
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

    // =========================================================================
    // 5. CONSULTA Y CONTROL EN VIVO DE TELCEL JASPER
    // =========================================================================
    async consultarJasperLinea(iccidUnidad, containerId = 'jasper-resultado-box') {
        const contenedorResultado = document.getElementById(containerId);
        const spanIccid = document.getElementById('det-iccid');
        const spanImei = document.getElementById('det-imei');

        const iccidFinal = (spanIccid && spanIccid.innerText !== '---' && spanIccid.innerText !== '')
            ? spanIccid.innerText.trim()
            : iccidUnidad;
        const imeiUI = (spanImei && spanImei.innerText !== '---' && spanImei.innerText !== '')
            ? spanImei.innerText.trim()
            : "N/A";

        const sinIccid = (!iccidFinal || iccidFinal === 'N/A' || iccidFinal === 'S/N');
        const sinImei = (!imeiUI || imeiUI === 'N/A' || imeiUI === 'S/N' || imeiUI === '---');

        if (sinIccid && sinImei) {
            if (contenedorResultado) {
                contenedorResultado.innerHTML = '<span style="color: #ff4c4c; display:block; margin-top:15px;">❌ Este equipo no tiene ICCID ni IMEI válidos para buscar en Jasper.</span>';
            }
            return;
        }

        if (contenedorResultado) {
            contenedorResultado.innerHTML = '<span style="color: #ffb74d; display:block; margin-top:15px;">⏳ Consultando satélites de Telcel Jasper... 📡</span>';
        }

        try {
            const respuesta = await fetch(this.urls.jasperConsulta, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    accion: "consultar_jasper",
                    iccid: iccidFinal,
                    imei: imeiUI
                })
            });
            const data = await respuesta.json();

            if (data.error) throw new Error(data.error);

            const spanDetLinea = document.getElementById('det-linea');
            if (spanDetLinea && data.linea && data.linea !== 'Sin dato') {
                spanDetLinea.innerHTML = `<b style="color:#00e676;">${data.linea}</b>`;
            }
            if (spanIccid && data.iccid && data.iccid !== 'Sin dato') {
                spanIccid.innerHTML = `<b style="color:#00e676;">${data.iccid}</b>`;
            }

            const colorEstadoSim = data.estado === 'ACTIVATED' ? '#00e676' : '#f44336';
            const bgEstadoSim = data.estado === 'ACTIVATED' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(244, 67, 54, 0.1)';

            const sesionHTML = data.enSesion
                ? '<span style="background: rgba(0, 230, 118, 0.15); color: #00e676; border: 1px solid rgba(0, 230, 118, 0.3); padding: 3px 8px; border-radius: 12px; font-size: 9px; font-weight: bold; letter-spacing: 0.5px;">🟢 EN SESIÓN</span>'
                : '<span style="background: rgba(244, 67, 54, 0.15); color: #f44336; border: 1px solid rgba(244, 67, 54, 0.3); padding: 3px 8px; border-radius: 12px; font-size: 9px; font-weight: bold; letter-spacing: 0.5px;">🔴 SIN SESIÓN</span>';

            const consumoMB = data.consumoMB !== "No disponible" ? `${data.consumoMB} MB` : "N/A";
            const limiteUso = data.limiteAlcanzado ? '<span style="color:#f44336; font-weight: bold;">⚠️ Alcanzado</span>' : '<span style="color:#aaa;">Normal</span>';
            const bloqueoSIM = '<span style="color:#777; font-style: italic;">Portal web</span>';

            if (contenedorResultado) {
                contenedorResultado.innerHTML = `
                    <div style="background: #1a1a1a; border: 1px solid #333; padding: 15px; border-radius: 8px; font-size: 11px; color: #bbb; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2); text-align: left; margin-top: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <span style="color: #fff; font-weight: bold; font-size: 13px; letter-spacing: 0.5px;">LÍNEA TELCEL</span>
                                <span style="background: ${bgEstadoSim}; color: ${colorEstadoSim}; border: 1px solid ${colorEstadoSim}; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; letter-spacing: 0.5px;">${data.estado || 'DESCONOCIDO'}</span>
                            </div>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <span style="color: #90caf9; font-weight: bold; font-size: 12px; background: rgba(144, 202, 249, 0.1); padding: 3px 6px; border-radius: 4px; border: 1px solid rgba(144, 202, 249, 0.2);">📊 ${consumoMB}</span>
                                ${sesionHTML}
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; background: #222; padding: 12px; border-radius: 6px; border: 1px solid #2a2a2a; margin-bottom: 15px;">
                            <div><span style="color: #777;">📞 MSISDN:</span> <b style="color: #fff;">${data.linea || 'N/A'}</b></div>
                            <div><span style="color: #777;">💳 PLAN:</span> <b style="color: #fff;">${data.plan || 'M2MZ1'}</b></div>
                            <div style="grid-column: span 2;"><span style="color: #777;">🏷️ ICCID:</span> <b style="color: #fff; letter-spacing: 0.5px;">${data.iccid}</b></div>
                            <div style="grid-column: span 2;"><span style="color: #777;">📱 IMEI RED:</span> <b style="color: #fff; letter-spacing: 0.5px;">${data.imeiRed || imeiUI}</b></div>
                            <div><span style="color: #777;">🚫 LÍMITE:</span> ${limiteUso}</div>
                            <div><span style="color: #777;">🔐 BLOQUEO:</span> ${bloqueoSIM}</div>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="appSoporte.cambiarEstadoSim('${data.iccid}', 'ACTIVATED', '${containerId}')"
                                    style="flex: 1; background: rgba(0, 200, 83, 0.1); color: #00e676; border: 1px solid #00c853; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: bold; text-transform: uppercase; transition: all 0.2s ease;"
                                    onmouseover="this.style.background='#00c853'; this.style.color='#fff';"
                                    onmouseout="this.style.background='rgba(0, 200, 83, 0.1)'; this.style.color='#00e676';">
                                ▶ ACTIVAR SIM
                            </button>
                            <button onclick="appSoporte.cambiarEstadoSim('${data.iccid}', 'DEACTIVATED', '${containerId}')"
                                    style="flex: 1; background: rgba(244, 67, 54, 0.1); color: #f44336; border: 1px solid #d32f2f; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: bold; text-transform: uppercase; transition: all 0.2s ease;"
                                    onmouseover="this.style.background='#d32f2f'; this.style.color='#fff';"
                                    onmouseout="this.style.background='rgba(244, 67, 54, 0.1)'; this.style.color='#f44336';">
                                ⏹ DESACTIVAR SIM
                            </button>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            if (contenedorResultado) {
                contenedorResultado.innerHTML = `<span style="color: #ff4c4c; display: block; margin-top: 15px;">❌ Detalle del Error: <b>${error.message}</b></span>`;
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
            contenedorResultado.innerHTML = `<span style="color: #ffb74d; display:block; margin-top:15px;">⏳ Enviando orden de ${accionTexto} a Telcel Jasper... 📡</span>`;
        }

        try {
            const respuesta = await fetch(this.urls.principal, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    accion: "cambiar_estado_jasper",
                    iccid: iccidUnidad,
                    estado: nuevoEstado
                })
            });
            const data = await respuesta.json();

            if (data.error) throw new Error(data.error);

            alert(`✅ ¡Éxito! La línea ha sido cambiada a ${nuevoEstado}.`);
            this.consultarJasperLinea(iccidUnidad, containerId);
        } catch (error) {
            console.error("Error cambiando estado:", error);
            alert(`❌ Error real al cambiar estado:\n\n${error.message}`);
            if (contenedorResultado) {
                contenedorResultado.innerHTML = `<span style="color: #ff4c4c; display: block; margin-top: 15px;">❌ Detalle del Error: <b>${error.message}</b></span>`;
            }
        }
    }

    // =========================================================================
    // 6. DEVOLUCIÓN DE EQUIPO A STOCK
    // =========================================================================
    async devolverAStock() {
        const eq = this.equipoSeleccionado;
        if (!eq) return;

        if (!confirm(`📦 ¿Estás seguro de devolver el equipo con ID: ${eq.id} al Inventario de Stock?\n\nSu estado cambiará automáticamente a USADO y se registrará con la fecha de hoy.`)) {
            return;
        }

        try {
            const peticion = await fetch(this.urls.principal, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    accion: "devolver_salida_a_stock",
                    idEquipo: eq.id
                })
            });
            const respuesta = await peticion.json();

            if (respuesta.success) {
                alert(`✅ ¡Éxito! ${respuesta.mensaje}`);
                this.cerrarDetalles();
                this.iniciar();
                if (window.appStock) window.appStock.cargarDatos();
            } else {
                alert("❌ Error: " + respuesta.error);
            }
        } catch (error) {
            alert("❌ Falla de red al intentar devolver el equipo.");
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.appSoporte = new SoporteTecnico();
});
