class SoporteTecnico {
    constructor() {
        this.container = document.getElementById('grid-salidas');
        this.sheetId = '1JpRyU-cFuGpmZpfuTil7FicbyFUrX3GS_nMUZLSUKKM'; 
        this.equipos = [];
        this.equipoSeleccionado = null; 
        this.busquedaActual = localStorage.getItem('busquedaGlobal') || ''; 
        this.iniciar();
    }

    async iniciar() {
        if (!this.container) return;
        this.container.innerHTML = '<p style="text-align:center; color: #ffb74d; padding: 20px;">Conectando con Google Sheets...</p>';
        const url = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('Salidas')}`;

        try {
            const respuesta = await fetch(url);
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
            this.container.innerHTML = '<p style="text-align:center; color:#ff4c4c;">Error al cargar datos.</p>';
        }
    } 

    // --- FUNCIONES DEL BUSCADOR ---
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
        // Le agregamos una clase al body para que "empuje" el contenido
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

        document.getElementById('det-marca').setAttribute('data-linea', eq.linea);
    }

    cerrarDetalles() { 
        // Quitamos la clase para que el contenido vuelva a ocupar toda la pantalla
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

    cerrarDetalles() { document.getElementById('panel-detalles').classList.remove('abierto'); }
    
    // --- LÓGICA DE BOTONES SMS ---
    enviarSMS(accion, eqIdDesdeTarjeta) {
        let eq = null;
        if (eqIdDesdeTarjeta) {
            eq = this.equipos.find(e => e.id.toString() === eqIdDesdeTarjeta.toString());
        } else {
            eq = this.equipoSeleccionado;
        }

        if (!eq) {
            alert("Selecciona un equipo primero.");
            return;
        }

        const numero = eq.linea;
        if (!numero || numero === 'SIN NÚMERO') {
            alert("No hay un número de línea vinculado para enviar comandos a este equipo.");
            return;
        }

        const marca = eq.marca ? eq.marca.toUpperCase().trim() : '';
        const modelo = eq.modelo ? eq.modelo.toUpperCase().trim() : '';
        const id = eq.id;
        let comando = "";

        switch (accion) {
            case 'apagar':
                if (modelo.startsWith("ST6")) comando = `ST600CMD;${id};02;Enable1`;
                else if (modelo.startsWith("ST30") || modelo.startsWith("ST34")) comando = `ST300CMD;${id};02;Enable1`;
                else if (modelo.startsWith("ST2")) comando = `SA200CMD;${id};02;Enable1`;
                else if (modelo.startsWith("ST3300") || modelo.startsWith("ST3340") || modelo.startsWith("ST43") || modelo.startsWith("ST82")) comando = `CMD;${id};04;01`;
                else if (marca === "TELTONIKA") comando = "  setdigout 1 0";
                else if (marca === "RUPTELA") comando = " setio 0,2";
                else if (marca === "CONCOX" || marca === "JIMI") comando = "RELAY,1#";
                break;
                
            case 'encender':
                if (modelo.startsWith("ST6")) comando = `ST600CMD;${id};02;Disable1`;
                else if (modelo.startsWith("ST30") || modelo.startsWith("ST34")) comando = `ST300CMD;${id};02;Disable1`;
                else if (modelo.startsWith("ST2")) comando = `SA200CMD;${id};02;Disable1`;
                else if (modelo.startsWith("ST330") || modelo.startsWith("ST3340") || modelo.startsWith("ST43") || modelo.startsWith("ST82")) comando = `CMD;${id};04;02`;
                else if (marca === "TELTONIKA") comando = "  setdigout 0 0";
                else if (marca === "RUPTELA") comando = " setio 1,2";
                else if (marca === "CONCOX" || marca === "JIMI") comando = "RELAY,0#";
                break;

            case 'borrar':
                if (modelo.startsWith("ST6")) comando = `ST600CMD;${id};02;EraseAll`;
                else if (modelo.startsWith("ST30") || modelo.startsWith("ST34")) comando = `ST300CMD;${id};02;EraseAll`;
                else if (modelo.startsWith("ST2")) comando = `SA200CMD;${id};02;EraseAll`;
                else if (modelo.startsWith("ST3300") || modelo.startsWith("ST3340") || modelo.startsWith("ST43")) comando = `CMD;${id};05;02`;
                else if (marca === "RUPTELA") comando = " delrecords";
                else if (marca === "TELTONIKA") comando = "  deleterecords";
                break;

            case 'formatear':
                if (modelo.startsWith("ST6")) comando = `ST600CMD;${id};02;Reset`;
                else if (modelo.startsWith("ST30") || modelo.startsWith("ST34")) comando = `ST300CMD;${id};02;Reset`;
                else if (modelo.startsWith("ST2")) comando = `SA200CMD;${id};02;Reset`;
                else if (modelo.startsWith("ST33") || modelo.startsWith("ST43")) comando = `CMD;${id};03;02`;
                break;

            case 'reiniciar':
                if (modelo.startsWith("ST6")) comando = `ST600CMD;${id};02;Reboot`;
                else if (modelo.startsWith("ST30") || modelo.startsWith("ST34")) comando = `ST300CMD;${id};02;Reboot`;
                else if (modelo.startsWith("ST2")) comando = `SA200CMD;${id};02;Reboot`;
                else if (modelo.startsWith("ST33") || modelo.startsWith("ST43") || modelo.startsWith("ST82")) comando = `CMD;${id};03;03`;
                else if (marca === "TELTONIKA") comando = "  cpureset";
                else if (marca === "RUPTELA") comando = " reset";
                else if (marca === "CONCOX" || marca === "JIMI") comando = "RESET#";
                else if (marca === "CALAMP") comando = "!r3,70,0";
                break;

            case 'configuracion':
                if (modelo.startsWith("ST6")) comando = `ST600CMD;${id};02;PresetA`;
                else if (modelo.startsWith("ST30") || modelo.startsWith("ST34")) comando = `ST300CMD;${id};02;PresetA`;
                else if (modelo.startsWith("ST2")) comando = `SA200CMD;${id};02;PresetA`;
                else if (modelo.startsWith("ST3300") || modelo.startsWith("ST3340") || modelo.startsWith("ST43") || modelo.startsWith("ST82")) comando = `CMD;${id};03;05`;
                else if (marca === "TELTONIKA") comando = "  getparam 2001:;2002:;2003:;2004:;2005:;2006:;1004:";
                else if (marca === "RUPTELA" || marca === "REPTELA") comando = " getapn";
                else if (marca === "CONCOX" || marca === "JIMI") comando = "GPRSSET#";
                break;
        }

        if (!comando) {
            alert(`No hay un comando SMS configurado para esta acción en la marca ${marca} o modelo ${modelo}.`);
            return;
        }

        window.open(`sms:${numero}?body=${encodeURIComponent(comando)}`, '_self');
    }

    abrirModalComandos() {
        if (!this.equipoSeleccionado) return;
        document.getElementById('cmd-marca').value = this.equipoSeleccionado.marca;
        document.getElementById('cmd-modelo').value = this.equipoSeleccionado.modelo;
        document.getElementById('cmd-id').value = this.equipoSeleccionado.id;
        document.getElementById('cmd-tipo').value = "";
        document.getElementById('cmd-seccion-dinamica').style.display = "none";
        document.getElementById('modal-comandos').style.display = 'flex';
    }

    cerrarModalComandos() { document.getElementById('modal-comandos').style.display = 'none'; }

    cambiarTipoComando() {
        const seleccion = document.getElementById('cmd-tipo').value;
        const seccionDinamica = document.getElementById('cmd-seccion-dinamica');
        if (seleccion !== "") {
            seccionDinamica.style.display = "block";
            document.getElementById('cmd-trama').value = ""; 
        } else {
            seccionDinamica.style.display = "none";
        }
    }

    procesarComando() {
        const marca = document.getElementById('cmd-marca').value;
        const modelo = document.getElementById('cmd-modelo').value;
        const id = document.getElementById('cmd-id').value;
        const tipo = document.getElementById('cmd-tipo').value;
        const trama = document.getElementById('cmd-trama').value;

        const cajaResultado = document.getElementById('cmd-resultado');

        if (trama.trim() === '') {
            cajaResultado.innerHTML = 'ESPERANDO TRAMA...';
            return;
        }

        const comandoGenerado = GeneradorComandos.obtenerComando(tipo, marca, modelo, id, trama);

        if (comandoGenerado.includes("Escribe") || comandoGenerado.includes("CODIGO") || comandoGenerado.includes("Ingresa") || comandoGenerado.includes("NO SOPORTADO")) {
            cajaResultado.innerHTML = `<span style="color: #ffb74d; font-size: 0.85rem;">${comandoGenerado}</span>`;
        } else {
            const numeroLinea = this.equipoSeleccionado.linea;
            let smsLink = "#";
            if (numeroLinea && numeroLinea !== 'SIN NÚMERO') {
                smsLink = `sms:${numeroLinea}?body=${encodeURIComponent(comandoGenerado)}`;
            }
            
            cajaResultado.innerHTML = `
                <a href="${smsLink}" style="color: #6db6ff; text-decoration: none; word-break: break-all;" title="Haz clic para enviar SMS">${comandoGenerado}</a> 
                <span class="icono-copiar" style="cursor:pointer; margin-left: 10px; font-size: 1.2rem;" onclick="navigator.clipboard.writeText('${comandoGenerado}'); alert('¡Comando Copiado!');">📋</span>
            `;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => { window.appSoporte = new SoporteTecnico(); });
