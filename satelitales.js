// js/satelitales.js

class InventarioSatelital {
    constructor() {
        this.tbody = document.getElementById('tbody-satelitales');
        this.inventario = []; 
        this.sheetId = '1JpRyU-cFuGpmZpfuTil7FicbyFUrX3GS_nMUZLSUKKM';
        this.urlAppsScript = 'https://script.google.com/macros/s/AKfycbxua3f3WK8cOQVV8NGFHaRJ4D7omCK7CptzXtDprnTpooGY-fZxw7m5XoHQgQOAMa2V/exec';
        
        this.modoSeleccion = false;
        this.cargarDatos();
    }

    // --- LÓGICA DE SELECCIÓN ---
    toggleModoSeleccion() {
        this.modoSeleccion = !this.modoSeleccion;
        
        const btnActivar = document.getElementById('btn-activar-sat-seleccion');
        const btnCancelar = document.getElementById('btn-cancelar-sat-seleccion');
        const btnEnviar = document.getElementById('btn-enviar-sat-salidas');
        const btnAgregar = document.getElementById('btn-agregar-satelital');
        
        const thCheck = document.querySelector('th.col-check-sat');
        const tdChecks = document.querySelectorAll('td.col-check-sat');

        if (this.modoSeleccion) {
            if(btnActivar) btnActivar.classList.add('oculto');
            if(btnAgregar) btnAgregar.classList.add('oculto');
            if(btnCancelar) btnCancelar.classList.remove('oculto');
            if(btnEnviar) btnEnviar.classList.remove('oculto');
            if(thCheck) thCheck.classList.remove('oculto');
            tdChecks.forEach(td => td.classList.remove('oculto'));
        } else {
            if(btnActivar) btnActivar.classList.remove('oculto');
            if(btnAgregar) btnAgregar.classList.remove('oculto');
            if(btnCancelar) btnCancelar.classList.add('oculto');
            if(btnEnviar) btnEnviar.classList.add('oculto');
            if(thCheck) thCheck.classList.add('oculto');
            tdChecks.forEach(td => td.classList.add('oculto'));
            
            const checkAll = document.getElementById('check-all-sat');
            if (checkAll) checkAll.checked = false;
            this.toggleTodos({checked: false});
        }
    }

    toggleTodos(checkboxMaster) {
        const checkboxes = document.querySelectorAll('.check-item-sat');
        checkboxes.forEach(cb => cb.checked = checkboxMaster.checked);
    }

    async cargarDatos() {
        if (!this.tbody) return;
        this.tbody.innerHTML = '<tr><td colspan="13" style="text-align:center; padding: 40px; color:#ffb74d; font-size:1.2rem;">⏳ Conectando satélites y descargando inventario... 📡</td></tr>';
        
        const urlSatelitales = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('Satelitales')}`;
        
        try {
            const respuesta = await fetch(urlSatelitales);
            const texto = await respuesta.text();
            const json = JSON.parse(texto.substring(47).slice(0, -2));
            
            this.inventario = [];
            
            json.table.rows.forEach(row => {
                if (row && row.c) {
                    const val = (col) => row.c[col] ? (row.c[col].f || row.c[col].v) : '';
                    let equipo = {
                        esn: String(val(0)).replace(/\.0$/, '').trim(),
                        codigoAuth: val(1),
                        modelo: val(2),
                        cliente: val(3),
                        fechaAct: val(4),
                        fechaVen: val(5),
                        fechaBaja: val(6),
                        meses: val(7),
                        renovaciones: val(8),
                        estado: val(9),
                        firmware: val(10)
                    };
                    if (equipo.esn && equipo.esn !== 'null' && equipo.esn !== '') {
                        this.inventario.push(equipo);
                    }
                }
            });
            
            this.renderizarTabla(this.inventario);
        } catch (error) {
            console.error(error);
            this.tbody.innerHTML = `<tr><td colspan="13" style="text-align:center; color:#ff4c4c; padding: 20px;">❌ Error al descargar datos.</td></tr>`;
        }
    }

    renderizarTabla(datos) {
        if (!this.tbody) return;
        this.tbody.innerHTML = '';

        if (datos.length === 0) {
            this.tbody.innerHTML = `<tr><td colspan="13" style="text-align:center; padding: 30px; color:#777; font-size:1.1rem;">No se encontraron equipos satelitales.</td></tr>`;
            return;
        }

        const displayCheck = this.modoSeleccion ? '' : 'oculto';

        datos.forEach(eq => {
            let estadoMayus = String(eq.estado).toUpperCase();
            let claseBadge = 'badge-revision';
            if (estadoMayus.includes('ACTIVO') || estadoMayus.includes('NUEVO')) claseBadge = 'badge-disponible';
            if (estadoMayus.includes('SUSPENDIDO') || estadoMayus.includes('BAJA')) claseBadge = 'badge-asignado';

            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td class="col-check-sat ${displayCheck}" style="text-align: center;">
                    <input type="checkbox" class="stock-checkbox check-item-sat" value="${eq.esn}">
                </td>
                <td style="font-family: monospace; color: #ffb74d; font-weight: bold; font-size: 1rem;">${eq.esn}</td>
                <td style="font-family: monospace; color: #fff;">${eq.codigoAuth}</td>
                <td>${eq.modelo}</td>
                <td style="font-weight: bold;">${eq.cliente}</td>
                <td>${eq.fechaAct}</td>
                <td style="color: #ffb74d;">${eq.fechaVen}</td>
                <td>${eq.fechaBaja}</td>
                <td style="text-align: center;">${eq.meses}</td>
                <td style="text-align: center;">${eq.renovaciones}</td>
                <td><span class="satelitales-badge ${claseBadge}">${eq.estado}</span></td>
                <td>${eq.firmware}</td>
                <td style="text-align: center;">
                    <button class="btn-stock-accion" onclick="appSatelitales.abrirEdicion('${eq.esn}')">✏️ Editar</button>
                </td>
            `;
            this.tbody.appendChild(fila);
        });
    }

    filtrarTabla(texto) {
        const query = texto.toLowerCase().trim();
        const filtrados = this.inventario.filter(eq => Object.values(eq).some(valor => String(valor).toLowerCase().includes(query)));
        this.renderizarTabla(filtrados);
    }

    // --- ACCIÓN DE ENVIAR A SALIDAS ---
    async enviarSeleccionadosASalidas() {
        const checkboxes = document.querySelectorAll('.check-item-sat:checked');
        if (checkboxes.length === 0) return alert("⚠️ Selecciona al menos un equipo satelital.");
        
        const esnsSeleccionados = Array.from(checkboxes).map(cb => cb.value);
        if (!confirm(`📦 ¿Mover ${esnsSeleccionados.length} satelital(es) a la pestaña de Salidas?`)) return;

        const btn = document.getElementById('btn-enviar-sat-salidas');
        btn.innerText = "⏳ Moviendo..."; btn.disabled = true;

        try {
            const peticion = await fetch(this.urlAppsScript, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ accion: "mover_satelital_a_salidas", esns: esnsSeleccionados })
            });
            const respuesta = await peticion.json();

            if (respuesta.success) {
                alert(`✅ ¡Éxito! ${respuesta.mensaje}`);
                this.toggleModoSeleccion(); 
                this.cargarDatos(); 
                if (window.appSoporte) window.appSoporte.iniciar(); 
            } else {
                alert("❌ Error: " + respuesta.error);
            }
        } catch (error) {
            alert("❌ Falla de red al intentar conectar.");
        }
        btn.innerHTML = "📦 Enviar a Salidas"; btn.disabled = false;
    }

    // --- MODALES ---
    abrirAgregar() {
        if (document.getElementById('modal-satelital')) document.getElementById('modal-satelital').remove();

        const modalHTML = `
            <div id="modal-satelital" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; justify-content: center; align-items: center;">
                <div style="background: #1e1e1e; border: 1px solid #00e676; border-radius: 12px; padding: 25px; width: 600px; box-shadow: 0 10px 40px rgba(0,0,0,0.7); max-height: 90vh; overflow-y: auto;">
                    <h2 style="color: #00e676; margin-top: 0; margin-bottom: 5px;">➕ Agregar Satelital</h2>
                    <p style="color: #888; font-size: 0.85rem; margin-top: 0; margin-bottom: 20px;">Llene los datos básicos del equipo.</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">ESN (IMEI):</label><input type="text" id="add-sat-esn" placeholder="Requerido" style="width: 100%; padding: 8px; background: #111; border: 1px solid #00e676; color: #00e676; font-weight: bold; border-radius: 6px;"></div>
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Código Autenticación:</label><input type="text" id="add-sat-auth" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                        
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Modelo:</label><input type="text" id="add-sat-modelo" placeholder="Ej. SMARTONE C" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Estado:</label><input type="text" id="add-sat-estado" value="NUEVO" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                        
                        <div style="grid-column: span 2;"><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Cliente:</label><input type="text" id="add-sat-cliente" placeholder="Nombre o Sin Asignar" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; gap: 15px; margin-top: 25px;">
                        <button onclick="document.getElementById('modal-satelital').remove()" style="flex: 1; padding: 12px; background: #333; color: #fff; border: 1px solid #555; border-radius: 6px; cursor: pointer; font-weight:bold;">Cancelar</button>
                        <button id="btn-agregar-satelital-modal" onclick="appSatelitales.guardarNuevoEquipo()" style="flex: 1; padding: 12px; background: #00e676; color: #000; border: none; border-radius: 6px; cursor: pointer; font-weight:bold;">➕ Agregar a Inventario</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    async guardarNuevoEquipo() {
        const esnInput = document.getElementById('add-sat-esn').value.trim();
        if (!esnInput) return alert("⚠️ El ESN (IMEI) es obligatorio.");

        const btn = document.getElementById('btn-agregar-satelital-modal');
        btn.innerText = "Agregando... ⏳"; btn.disabled = true;
        try {
            const peticion = await fetch(this.urlAppsScript, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ 
                    accion: "agregar_satelital", 
                    esn: esnInput,
                    auth: document.getElementById('add-sat-auth').value,
                    modelo: document.getElementById('add-sat-modelo').value,
                    cliente: document.getElementById('add-sat-cliente').value,
                    estado: document.getElementById('add-sat-estado').value
                })
            });
            const respuesta = await peticion.json();
            if (respuesta.success) {
                document.getElementById('modal-satelital').remove();
                this.cargarDatos(); 
                alert("✅ Equipo Satelital agregado con éxito.");
            } else {
                alert("❌ Error: " + respuesta.error);
                btn.innerText = "➕ Agregar a Inventario"; btn.disabled = false;
            }
        } catch (error) {
            alert("❌ Falla de red al intentar conectar.");
            btn.innerText = "➕ Agregar a Inventario"; btn.disabled = false;
        }
    }

    abrirEdicion(esn) {
        const equipo = this.inventario.find(e => e.esn === esn);
        if (!equipo) return;
        
        if (document.getElementById('modal-satelital')) document.getElementById('modal-satelital').remove();

        const modalHTML = `
            <div id="modal-satelital" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; justify-content: center; align-items: center;">
                <div style="background: #1e1e1e; border: 1px solid #ffb74d; border-radius: 12px; padding: 25px; width: 600px; box-shadow: 0 10px 40px rgba(0,0,0,0.7); max-height: 90vh; overflow-y: auto;">
                    <h2 style="color: #ffb74d; margin-top: 0; margin-bottom: 5px;">Editar Satelital</h2>
                    <p style="color: #888; font-size: 0.9rem; margin-top: 0; margin-bottom: 20px;">ESN Original: <b style="color:#fff;">${equipo.esn}</b></p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">ESN (IMEI):</label><input type="text" id="sat-esn" value="${equipo.esn}" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #ffb74d; font-weight: bold; border-radius: 6px;"></div>
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Código Autenticación:</label><input type="text" id="sat-auth" value="${equipo.codigoAuth}" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                        
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Modelo:</label><input type="text" id="sat-modelo" value="${equipo.modelo}" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Estado:</label><input type="text" id="sat-estado" value="${equipo.estado}" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                        
                        <div style="grid-column: span 2;"><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Cliente:</label><input type="text" id="sat-cliente" value="${equipo.cliente}" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                        
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Fecha Activación:</label><input type="text" id="sat-fAct" value="${equipo.fechaAct}" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Fecha Vencimiento:</label><input type="text" id="sat-fVen" value="${equipo.fechaVen}" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #ffb74d; border-radius: 6px;"></div>
                        
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Fecha Baja:</label><input type="text" id="sat-fBaja" value="${equipo.fechaBaja}" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Meses Activo:</label><input type="text" id="sat-meses" value="${equipo.meses}" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                        
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Renovaciones (Plan):</label><input type="text" id="sat-renovaciones" value="${equipo.renovaciones}" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                        <div><label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Prog. / Firmware:</label><input type="text" id="sat-firmware" value="${equipo.firmware}" style="width: 100%; padding: 8px; background: #111; border: 1px solid #444; color: #fff; border-radius: 6px;"></div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; gap: 15px; margin-top: 25px;">
                        <button onclick="document.getElementById('modal-satelital').remove()" style="flex: 1; padding: 12px; background: #333; color: #fff; border: 1px solid #555; border-radius: 6px; cursor: pointer; font-weight:bold;">Cancelar</button>
                        <button id="btn-guardar-sat-edit" onclick="appSatelitales.guardarEdicion('${equipo.esn}')" style="flex: 1; padding: 12px; background: #ffb74d; color: #000; border: none; border-radius: 6px; cursor: pointer; font-weight:bold;">💾 Guardar Cambios</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    async guardarEdicion(esnOriginal) {
        const btn = document.getElementById('btn-guardar-sat-edit');
        btn.innerText = "Guardando... ⏳"; btn.disabled = true;
        try {
            const peticion = await fetch(this.urlAppsScript, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ 
                    accion: "editar_satelital", 
                    esnOriginal: esnOriginal,
                    nuevoEsn: document.getElementById('sat-esn').value,
                    nuevoAuth: document.getElementById('sat-auth').value,
                    nuevoModelo: document.getElementById('sat-modelo').value,
                    nuevoCliente: document.getElementById('sat-cliente').value,
                    nuevaFechaAct: document.getElementById('sat-fAct').value,
                    nuevaFechaVen: document.getElementById('sat-fVen').value,
                    nuevaFechaBaja: document.getElementById('sat-fBaja').value,
                    nuevosMeses: document.getElementById('sat-meses').value,
                    nuevasRenovaciones: document.getElementById('sat-renovaciones').value,
                    nuevoEstado: document.getElementById('sat-estado').value,
                    nuevoFirmware: document.getElementById('sat-firmware').value
                })
            });
            const respuesta = await peticion.json();
            if (respuesta.success) {
                document.getElementById('modal-satelital').remove();
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
}

document.addEventListener('DOMContentLoaded', () => { window.appSatelitales = new InventarioSatelital(); });
