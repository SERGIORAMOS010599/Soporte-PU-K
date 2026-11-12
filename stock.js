// js/stock.js

class ControlInventario {
    constructor() {
        this.tbody = document.getElementById('tbody-stock');
        this.inventarioGlobal = []; 
        this.sheetId = '1JpRyU-cFuGpmZpfuTil7FicbyFUrX3GS_nMUZLSUKKM';
        this.urlAppsScript = 'https://script.google.com/macros/s/AKfycbxua3f3WK8cOQVV8NGFHaRJ4D7omCK7CptzXtDprnTpooGY-fZxw7m5XoHQgQOAMa2V/exec';
        
        this.modoSeleccion = false;
        this.sortCol = '';
        this.sortAsc = true;
        this.cargarDatos();
    }

    toggleModoSeleccion() {
        this.modoSeleccion = !this.modoSeleccion;
        const btnActivar = document.getElementById('btn-activar-seleccion');
        const btnCancelar = document.getElementById('btn-cancelar-seleccion');
        const btnEnviar = document.getElementById('btn-enviar-salidas');
        const btnEnviarSat = document.getElementById('btn-enviar-satelitales');
        const btnAgregar = document.getElementById('btn-agregar-equipo');
        const thCheck = document.querySelector('th.col-check');
        const tdChecks = document.querySelectorAll('td.col-check');

        if (this.modoSeleccion) {
            if(btnActivar) btnActivar.classList.add('oculto');
            if(btnAgregar) btnAgregar.classList.add('oculto');
            if(btnCancelar) btnCancelar.classList.remove('oculto');
            if(btnEnviar) btnEnviar.classList.remove('oculto');
            if(btnEnviarSat) btnEnviarSat.classList.remove('oculto'); 
            if (thCheck) thCheck.classList.remove('oculto');
            tdChecks.forEach(td => td.classList.remove('oculto'));
        } else {
            if(btnActivar) btnActivar.classList.remove('oculto');
            if(btnAgregar) btnAgregar.classList.remove('oculto');
            if(btnCancelar) btnCancelar.classList.add('oculto');
            if(btnEnviar) btnEnviar.classList.add('oculto');
            if(btnEnviarSat) btnEnviarSat.classList.add('oculto'); 
            if (thCheck) thCheck.classList.add('oculto');
            tdChecks.forEach(td => td.classList.add('oculto'));
            
            const checkAll = document.getElementById('check-all-stock');
            if (checkAll) checkAll.checked = false;
            this.toggleTodos({checked: false});
        }
    }

    toggleTodos(checkboxMaster) {
        const checkboxes = document.querySelectorAll('.check-item');
        checkboxes.forEach(cb => cb.checked = checkboxMaster.checked);
    }

    async enviarSeleccionadosASatelitales() {
        const checkboxes = document.querySelectorAll('.check-item:checked');
        if (checkboxes.length === 0) return alert("⚠️ Selecciona al menos un equipo satelital.");
        const imeisSeleccionados = Array.from(checkboxes).map(cb => cb.value);
        if (!confirm(`🛰️ ¿Mover ${imeisSeleccionados.length} equipo(s) a la pestaña Satelitales?`)) return;

        const btn = document.getElementById('btn-enviar-satelitales');
        btn.innerText = "⏳ Moviendo..."; btn.disabled = true;
        try {
            const peticion = await fetch(this.urlAppsScript, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ accion: "mover_a_satelitales", imeis: imeisSeleccionados })
            });
            const respuesta = await peticion.json();
            if (respuesta.success) {
                alert(`✅ ¡Éxito! ${respuesta.mensaje}`);
                this.toggleModoSeleccion(); 
                this.cargarDatos(); 
                if (window.appSatelitales) window.appSatelitales.cargarDatos(); 
            } else alert("❌ Error: " + respuesta.error);
        } catch (error) {
            alert("❌ Falla de red al intentar conectar.");
        }
        btn.innerHTML = "🛰️ Enviar a Satelitales"; btn.disabled = false;
    }

    async enviarSeleccionadosASalidas() {
        const checkboxes = document.querySelectorAll('.check-item:checked');
        if (checkboxes.length === 0) return alert("⚠️ Selecciona al menos un equipo.");
        const imeisSeleccionados = Array.from(checkboxes).map(cb => cb.value);
        if (!confirm(`📦 ¿Mover ${imeisSeleccionados.length} equipo(s) a Salidas?`)) return;

        const btn = document.getElementById('btn-enviar-salidas');
        btn.innerText = "⏳ Moviendo..."; btn.disabled = true;
        try {
            const peticion = await fetch(this.urlAppsScript, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ accion: "mover_a_salidas", imeis: imeisSeleccionados })
            });
            const respuesta = await peticion.json();
            if (respuesta.success) {
                alert(`✅ ¡Éxito! ${respuesta.mensaje}`);
                this.toggleModoSeleccion(); 
                this.cargarDatos(); 
                if (window.appSoporte) window.appSoporte.iniciar(); 
            } else alert("❌ Error: " + respuesta.error);
        } catch (error) {
            alert("❌ Falla de red al intentar conectar.");
        }
        btn.innerHTML = "📦 Enviar a Salidas"; btn.disabled = false;
    }

    async cargarDatos() {
        if (!this.tbody) return;
        this.tbody.innerHTML = '<tr><td colspan="14" style="text-align:center; padding: 40px; color:#ffb74d; font-size:1.2rem;">⏳ Conectando con Google Sheets y descargando inventario... 📡</td></tr>';
        
        const urlInventario = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('Stock')}`;
        
        try {
            const respuestaInv = await fetch(urlInventario);
            const textInv = await respuestaInv.text();
            const jsonInv = JSON.parse(textInv.substring(47).slice(0, -2));
            
            this.inventarioGlobal = [];
            jsonInv.table.rows.forEach((row) => {
                if (row && row.c) {
                    let equipo = {
                        fecha: row.c[0] ? (row.c[0].f || row.c[0].v) : '',
                        marca: row.c[1] ? row.c[1].v : 'S/M',
                        modelo: row.c[2] ? row.c[2].v : 'S/M',
                        id: row.c[3] ? row.c[3].v : 'S/N',
                        imei: row.c[4] ? String(row.c[4].v).replace(/\.0$/, '').trim() : 'S/N',
                        linea: row.c[5] ? String(row.c[5].v).replace(/\.0$/, '').trim() : '',
                        iccid: row.c[6] ? String(row.c[6].v).replace(/\.0$/, '').trim() : '',
                        compania: row.c[7] ? row.c[7].v : '',
                        estado: row.c[8] ? row.c[8].v : 'SIN ESTADO',
                        ubicacion: row.c[9] ? row.c[9].v : 'NO ASIGNADA',
                        tipoServicio: row.c[10] ? row.c[10].v : '',
                        foto: row.c[11] ? row.c[11].v : '',
                        comentario: row.c[12] ? row.c[12].v : ''
                    };
                    if (equipo.imei && equipo.imei !== 'S/N') this.inventarioGlobal.push(equipo);
                }
            });
            this.renderizarTabla(this.inventarioGlobal);
        } catch (error) {
            this.tbody.innerHTML = `<tr><td colspan="14" style="text-align:center; color:#ff4c4c; padding: 20px;">❌ Error al descargar datos.</td></tr>`;
        }
    }

    renderizarTabla(datos) {
        if (!this.tbody) return;
        this.tbody.innerHTML = '';
        const checkAll = document.getElementById('check-all-stock');
        if(checkAll) checkAll.checked = false;

        if (datos.length === 0) {
            this.tbody.innerHTML = `<tr><td colspan="14" style="text-align:center; padding: 30px; color:#777; font-size:1.1rem;">No se encontraron equipos.</td></tr>`;
            return;
        }

        const displayCheck = this.modoSeleccion ? '' : 'oculto';

        datos.forEach(equipo => {
            let estadoMayus = String(equipo.estado).toUpperCase();
            let claseBadge = 'badge-revision';
            if (estadoMayus.includes('NUEVO') || estadoMayus.includes('DISPONIBLE')) claseBadge = 'badge-disponible';
            if (estadoMayus.includes('ASIGNADO') || estadoMayus.includes('INSTALADO') || estadoMayus.includes('USADO')) claseBadge = 'badge-asignado';

            let htmlLinea = '';
            if (equipo.linea) htmlLinea += `<div style="color: #90caf9; font-size: 0.75rem;">📞 ${equipo.linea}</div>`;
            if (equipo.iccid) htmlLinea += `<div style="color: #ccc; font-size: 0.75rem;">💳 ${equipo.iccid}</div>`;
            if (!equipo.linea && !equipo.iccid) htmlLinea = '<span style="color:#555;">N/A</span>';
            
            let htmlFoto = equipo.foto && equipo.foto.includes('http') ? `<a href="${equipo.foto}" target="_blank" style="color:#ffb74d; text-decoration:none;">📷 Ver</a>` : '<span style="color:#555;">S/F</span>';

            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td class="col-check ${displayCheck}" style="text-align: center;">
                    <input type="checkbox" class="stock-checkbox check-item" value="${equipo.imei}">
                </td>
                <td style="color:#aaa;">${equipo.fecha}</td>
                <td><b style="color: #fff;">${equipo.marca}</b></td>
                <td>${equipo.modelo}</td>
                <td style="color:#aaa;">${equipo.id}</td>
                <td style="font-family: monospace; color: #ffb74d;">${equipo.imei}</td>
                <td style="font-family: monospace;">${htmlLinea}</td>
                <td>${equipo.compania}</td>
                <td><span class="stock-badge ${claseBadge}">${equipo.estado}</span></td>
                <td>${equipo.ubicacion}</td>
                <td>${equipo.tipoServicio}</td>
                <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;" title="${equipo.comentario}">${equipo.comentario}</td>
                <td>${htmlFoto}</td>
                <td style="text-align: center;">
                    <button class="btn-stock-accion" onclick="appStock.abrirEdicion('${equipo.imei}')">✏️ Editar</button>
                </td>
            `;
            this.tbody.appendChild(fila);
        });
    }

    filtrarTabla(texto) {
        const query = texto.toLowerCase().trim();
        const filtrados = this.inventarioGlobal.filter(eq => Object.values(eq).some(valor => String(valor).toLowerCase().includes(query)));
        this.renderizarTabla(filtrados);
    }

    async sincronizarConJasper(btnObj, inputIccidId, inputLineaId, inputCompaniaId) {
        const inputIccid = document.getElementById(inputIccidId).value.trim();
        if (!inputIccid || inputIccid === 'N/A') return alert("⚠️ Escribe un ICCID válido primero.");

        btnObj.innerText = "⏳ Sincronizando...";
        btnObj.disabled = true;

        try {
            const peticion = await fetch(this.urlAppsScript, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ accion: "consultar_jasper", iccid: inputIccid, imei: "N/A" })
            });
            const respuesta = await peticion.json();

            if (respuesta.success && respuesta.linea && respuesta.linea !== "Sin dato") {
                document.getElementById(inputLineaId).value = respuesta.linea;
                document.getElementById(inputCompaniaId).value = "TELCEL";
                alert("✅ ICCID Sincronizado con Jasper.");
            } else {
                alert("❌ No se encontró línea registrada para este ICCID en Jasper.");
            }
        } catch (error) {
            alert("❌ Falla de red al conectar con Jasper.");
        }
        btnObj.innerHTML = "🔄 Jasper";
        btnObj.disabled = false;
    }

    abrirEdicion(imei) {
        const equipo = this.inventarioGlobal.find(e => e.imei === imei);
        if (!equipo) return;
        if (document.getElementById('modal-stock')) document.getElementById('modal-stock').remove();

        const modalHTML = `
            <div id="modal-stock" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; justify-content: center; align-items: center;">
                <div style="background: #1e1e1e; border: 1px solid #ffb74d; border-radius: 12px; padding: 25px; width: 600px; box-shadow: 0 10px 40px rgba(0,0,0,0.7); max-height: 90vh; overflow-y: auto;">
                    <h2 style="color: #ffb74d; margin-top: 0; margin-bottom: 5px;">Editar Equipo</h2>
                    <p style="color: #888; font-size: 0.9rem; margin-top: 0; margin-bottom: 20px;">ID Sistema: <b style="color:#fff;">${equipo.id}</b></p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Marca:</label><input type="text" id="mod-marca" value="${equipo.marca}" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Modelo:</label><input type="text" id="mod-modelo" value="${equipo.modelo}" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                        
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">IMEI / SERIE:</label><input type="text" id="mod-imei" value="${equipo.imei}" style="width: 100%; padding: 8px; background: #111; border: 1px solid #ffb74d; color: #ffb74d; font-weight: bold; border-radius: 6px;"></div>
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Estado:</label><input type="text" id="mod-estado" value="${equipo.estado}" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                        
                        <div style="grid-column: span 2;">
                            <label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">ICCID Vinculado:</label>
                            <div style="display: flex; gap: 10px;">
                                <input type="text" id="mod-iccid" value="${equipo.iccid}" style="flex: 1; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;">
                                <button onclick="appStock.sincronizarConJasper(this, 'mod-iccid', 'mod-linea', 'mod-compania')" style="background: #00c853; color: #000; font-weight: bold; border: none; border-radius: 6px; padding: 0 15px; cursor: pointer; transition: 0.3s;">🔄 Jasper</button>
                            </div>
                        </div>

                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Línea (MSISDN):</label><input type="text" id="mod-linea" value="${equipo.linea}" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Compañía:</label><input type="text" id="mod-compania" value="${equipo.compania}" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                        
                        <div style="grid-column: span 2;"><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Ubicación / Unidad:</label><input type="text" id="mod-ubicacion" value="${equipo.ubicacion}" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                        <div style="grid-column: span 2;"><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Foto del Equipo (URL):</label><input type="text" id="mod-foto" value="${equipo.foto}" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                    </div>

                    <div style="margin-bottom: 25px;"><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Comentario:</label><textarea id="mod-comentario" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px; resize: vertical; min-height: 50px;">${equipo.comentario}</textarea></div>
                    
                    <div style="display: flex; justify-content: space-between; gap: 15px;">
                        <button onclick="document.getElementById('modal-stock').remove()" style="flex: 1; padding: 12px; background: #333; color: #fff; border: 1px solid #555; border-radius: 6px; cursor: pointer; font-weight:bold;">Cancelar</button>
                        <button id="btn-guardar-modal" onclick="appStock.guardarEdicion('${equipo.imei}')" style="flex: 1; padding: 12px; background: #ffb74d; color: #000; border: none; border-radius: 6px; cursor: pointer; font-weight:bold;">💾 Guardar Cambios</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    async guardarEdicion(imeiOriginal) {
        const btn = document.getElementById('btn-guardar-modal');
        btn.innerText = "Guardando... ⏳"; btn.disabled = true;
        try {
            const peticion = await fetch(this.urlAppsScript, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ 
                    accion: "editar_stock", 
                    imeiOriginal: imeiOriginal,
                    nuevoImei: document.getElementById('mod-imei').value,
                    nuevaMarca: document.getElementById('mod-marca').value,
                    nuevoModelo: document.getElementById('mod-modelo').value,
                    nuevaCompania: document.getElementById('mod-compania').value,
                    nuevaFoto: document.getElementById('mod-foto').value,
                    nuevoEstado: document.getElementById('mod-estado').value,
                    nuevaUbicacion: document.getElementById('mod-ubicacion').value,
                    nuevoIccid: document.getElementById('mod-iccid').value,
                    nuevaLinea: document.getElementById('mod-linea').value,
                    nuevoComentario: document.getElementById('mod-comentario').value
                })
            });
            const respuesta = await peticion.json();
            if (respuesta.success) {
                document.getElementById('modal-stock').remove();
                this.cargarDatos(); 
            } else {
                alert("❌ Error: " + respuesta.error);
                btn.innerText = "💾 Guardar Cambios"; btn.disabled = false;
            }
        } catch (error) {
            alert("❌ Falla de red al intentar conectar.");
            btn.innerText = "💾 Guardar Cambios"; btn.disabled = false;
        }
    }

    abrirAgregar() {
        if (document.getElementById('modal-stock')) document.getElementById('modal-stock').remove();

        const modalHTML = `
            <div id="modal-stock" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; justify-content: center; align-items: center;">
                <div style="background: #1e1e1e; border: 1px solid #00e676; border-radius: 12px; padding: 25px; width: 600px; box-shadow: 0 10px 40px rgba(0,0,0,0.7); max-height: 90vh; overflow-y: auto;">
                    <h2 style="color: #00e676; margin-top: 0; margin-bottom: 5px;">➕ Agregar Nuevo Equipo</h2>
                    <p style="color: #888; font-size: 0.85rem; margin-top: 0; margin-bottom: 20px;">Llene los datos para el inventario. La fecha de entrada se asignará automáticamente.</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">ID Equipo:</label><input type="text" id="add-id" placeholder="Ej. 12345" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">IMEI / SERIE:</label><input type="text" id="add-imei" placeholder="Requerido" style="width: 100%; padding: 8px; background: #111; border: 1px solid #00e676; color: #00e676; font-weight: bold; border-radius: 6px;"></div>
                        
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Marca:</label><input type="text" id="add-marca" placeholder="Ej. TELTONIKA" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Modelo:</label><input type="text" id="add-modelo" placeholder="Ej. FMB920" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                        
                        <div style="grid-column: span 2;">
                            <label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">ICCID Vinculado:</label>
                            <div style="display: flex; gap: 10px;">
                                <input type="text" id="add-iccid" placeholder="8952..." style="flex: 1; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;">
                                <button onclick="appStock.sincronizarConJasper(this, 'add-iccid', 'add-linea', 'add-compania')" style="background: #00c853; color: #000; font-weight: bold; border: none; border-radius: 6px; padding: 0 15px; cursor: pointer;">🔄 Jasper</button>
                            </div>
                        </div>

                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Línea (MSISDN):</label><input type="text" id="add-linea" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Compañía:</label><input type="text" id="add-compania" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                        
                        <div style="grid-column: span 2;"><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Foto del Equipo (URL):</label><input type="text" id="add-foto" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                    </div>

                    <div style="margin-bottom: 25px;"><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Comentario:</label><textarea id="add-comentario" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px; resize: vertical; min-height: 50px;"></textarea></div>
                    
                    <div style="display: flex; justify-content: space-between; gap: 15px;">
                        <button onclick="document.getElementById('modal-stock').remove()" style="flex: 1; padding: 12px; background: #333; color: #fff; border: 1px solid #555; border-radius: 6px; cursor: pointer; font-weight:bold;">Cancelar</button>
                        <button id="btn-guardar-modal" onclick="appStock.guardarNuevoEquipo()" style="flex: 1; padding: 12px; background: #00e676; color: #000; border: none; border-radius: 6px; cursor: pointer; font-weight:bold;">➕ Agregar a Inventario</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    async guardarNuevoEquipo() {
        const imeiInput = document.getElementById('add-imei').value.trim();
        if (!imeiInput) return alert("⚠️ El IMEI es obligatorio para agregar un equipo.");

        const btn = document.getElementById('btn-guardar-modal');
        btn.innerText = "Agregando... ⏳"; btn.disabled = true;
        try {
            const peticion = await fetch(this.urlAppsScript, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ 
                    accion: "agregar_stock", 
                    id: document.getElementById('add-id').value,
                    imei: imeiInput,
                    marca: document.getElementById('add-marca').value,
                    modelo: document.getElementById('add-modelo').value,
                    compania: document.getElementById('add-compania').value,
                    foto: document.getElementById('add-foto').value,
                    iccid: document.getElementById('add-iccid').value,
                    linea: document.getElementById('add-linea').value,
                    comentario: document.getElementById('add-comentario').value
                })
            });
            const respuesta = await peticion.json();
            if (respuesta.success) {
                document.getElementById('modal-stock').remove();
                this.cargarDatos(); 
                alert("✅ Equipo agregado con éxito.");
            } else {
                alert("❌ Error: " + respuesta.error);
                btn.innerText = "➕ Agregar a Inventario"; btn.disabled = false;
            }
        } catch (error) {
            alert("❌ Falla de red al intentar conectar.");
            btn.innerText = "➕ Agregar a Inventario"; btn.disabled = false;
        }
    }

    // ==========================================
    // ORDENAMIENTO DE COLUMNAS STOCK (A-Z, Z-A)
    // ==========================================
    ordenarTabla(columna, thElement) {
        if (this.sortCol === columna) {
            this.sortAsc = !this.sortAsc; 
        } else {
            this.sortCol = columna;
            this.sortAsc = true; 
        }

        document.querySelectorAll('#tabla-stock-id th').forEach(th => th.classList.remove('asc', 'desc'));
        if (thElement) thElement.classList.add(this.sortAsc ? 'asc' : 'desc');

        this.inventarioGlobal.sort((a, b) => {
            let valA = String(a[columna] || '').toLowerCase();
            let valB = String(b[columna] || '').toLowerCase();

            const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
            if (dateRegex.test(valA)) valA = valA.replace(dateRegex, '$3$2$1');
            if (dateRegex.test(valB)) valB = valB.replace(dateRegex, '$3$2$1');

            if (!isNaN(valA) && !isNaN(valB) && valA !== '' && valB !== '') {
                valA = parseFloat(valA); valB = parseFloat(valB);
            }

            if (valA < valB) return this.sortAsc ? -1 : 1;
            if (valA > valB) return this.sortAsc ? 1 : -1;
            return 0;
        });
        this.renderizarTabla(this.inventarioGlobal);
    }

    // ==========================================
    // FILTROS AVANZADOS STOCK
    // ==========================================
    abrirFiltrosAvanzados() {
        if (document.getElementById('modal-filtros-stock')) document.getElementById('modal-filtros-stock').remove();
        
        const marcas = [...new Set(this.inventarioGlobal.map(e => e.marca))].filter(c => c && c !== 'S/M').sort();
        const opcionesMarca = marcas.map(c => `<option value="${c}">${c}</option>`).join('');

        const modalHTML = `
            <div id="modal-filtros-stock" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; justify-content: center; align-items: center;">
                <div style="background: #1e1e1e; border: 1px solid #ffb74d; border-radius: 12px; padding: 25px; width: 500px; box-shadow: 0 10px 40px rgba(0,0,0,0.7); animation: fadeIn 0.2s;">
                    <h2 style="color: #ffb74d; margin-top: 0; margin-bottom: 5px;">🔎 Filtros Avanzados (Stock)</h2>
                    
                    <div style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 15px;">
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Marca:</label>
                            <select id="filtro-stock-marca" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;">
                                <option value="">-- Todas las Marcas --</option>
                                ${opcionesMarca}
                            </select></div>
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Estado:</label>
                            <select id="filtro-stock-estado" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;">
                                <option value="">-- Todos los Estados --</option>
                                <option value="NUEVO">NUEVO</option>
                                <option value="USADO">USADO</option>
                                <option value="DAÑADO">DAÑADO</option>
                                <option value="GARANTIA">GARANTIA</option>
                            </select></div>
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Ubicación (Ej. Oficina, Bunker):</label>
                            <input type="text" id="filtro-stock-ubi" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; gap: 15px; margin-top: 25px;">
                        <button onclick="appStock.limpiarFiltrosAvanzados()" style="flex: 1; padding: 12px; background: #333; color: #fff; border: 1px solid #555; border-radius: 6px; cursor: pointer; font-weight:bold;">Limpiar y Cerrar</button>
                        <button onclick="appStock.aplicarFiltrosAvanzados()" style="flex: 1; padding: 12px; background: #ffb74d; color: #000; border: none; border-radius: 6px; cursor: pointer; font-weight:bold;">Aplicar Filtros</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    aplicarFiltrosAvanzados() {
        const marcaFiltro = document.getElementById('filtro-stock-marca').value.toLowerCase();
        const estadoFiltro = document.getElementById('filtro-stock-estado').value.toLowerCase();
        const ubiFiltro = document.getElementById('filtro-stock-ubi').value.toLowerCase();
        
        let filtrados = this.inventarioGlobal.filter(eq => {
            let pasaMarca = marcaFiltro === "" || String(eq.marca).toLowerCase() === marcaFiltro;
            let pasaEstado = estadoFiltro === "" || String(eq.estado).toLowerCase() === estadoFiltro;
            let pasaUbi = ubiFiltro === "" || String(eq.ubicacion).toLowerCase().includes(ubiFiltro);
            return pasaMarca && pasaEstado && pasaUbi;
        });
        this.renderizarTabla(filtrados);
        document.getElementById('modal-filtros-stock').remove();
    }

    limpiarFiltrosAvanzados() {
        this.renderizarTabla(this.inventarioGlobal);
        document.getElementById('modal-filtros-stock').remove();
    }
}

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => { 
    window.appStock = new ControlInventario(); 
});
