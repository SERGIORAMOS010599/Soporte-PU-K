// js/stock.js

class ControlInventario {
    constructor() {
        this.tbody = document.getElementById('tbody-stock');
        this.inputBuscador = document.getElementById('buscador-stock');
        this.inventarioGlobal = []; 
        this.sheetId = '1JpRyU-cFuGpmZpfuTil7FicbyFUrX3GS_nMUZLSUKKM';
        this.urlAppsScript = 'https://script.google.com/macros/s/AKfycbxua3f3WK8cOQVV8NGFHaRJ4D7omCK7CptzXtDprnTpooGY-fZxw7m5XoHQgQOAMa2V/exec';

        this.inicializarEventos();
        this.cargarDatos();
    }

    inicializarEventos() {
        if (this.inputBuscador) {
            this.inputBuscador.addEventListener('input', (e) => this.filtrarTabla(e.target.value));
        }
    }

    async cargarDatos() {
        if (!this.tbody) return;
        this.tbody.innerHTML = '<tr><td colspan="14" style="text-align:center; padding: 30px; color:#ffb74d;">⏳ Conectando con Google Sheets y descargando inventario... 📡</td></tr>';
        
        const urlInventario = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('Stock')}`;
        
        try {
            const respuestaInv = await fetch(urlInventario);
            const textInv = await respuestaInv.text();
            const jsonInv = JSON.parse(textInv.substring(47).slice(0, -2));
            
            this.inventarioGlobal = [];
            
            jsonInv.table.rows.forEach((row, rowIndex) => {
                if (row && row.c) {
                    // Mapeo basado en tu lista: FECHA(0) MARCA(1) MODELO(2) ID(3) IMEI(4) LINEA(5) ICCID(6) COMPAÑIA(7) ESTADO(8) UBICACION(9) TIPO(10) FOTO(11) COMENTARIO(12)
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
                    
                    if (equipo.imei && equipo.imei !== 'S/N') {
                        this.inventarioGlobal.push(equipo);
                    }
                }
            });
            
            this.renderizarTabla(this.inventarioGlobal);
        } catch (error) {
            console.error("Error al cargar Stock:", error);
            this.tbody.innerHTML = `<tr><td colspan="14" style="text-align:center; color:#ff4c4c; padding: 20px;">❌ Error al descargar datos. Asegúrate de que la pestaña se llame "Stock".</td></tr>`;
        }
    }

    renderizarTabla(datos) {
        if (!this.tbody) return;
        this.tbody.innerHTML = '';
        
        // Reset check-all
        const checkAll = document.getElementById('check-all-stock');
        if(checkAll) checkAll.checked = false;

        if (datos.length === 0) {
            this.tbody.innerHTML = `<tr><td colspan="14" style="text-align:center; padding: 20px; color:#777;">No se encontraron equipos.</td></tr>`;
            return;
        }

        datos.forEach(equipo => {
            let estadoMayus = String(equipo.estado).toUpperCase();
            let claseBadge = 'badge-revision';
            if (estadoMayus.includes('NUEVO') || estadoMayus.includes('DISPONIBLE')) claseBadge = 'badge-disponible';
            if (estadoMayus.includes('ASIGNADO') || estadoMayus.includes('INSTALADO')) claseBadge = 'badge-asignado';

            let htmlLinea = '';
            if (equipo.linea) htmlLinea += `<div style="color: #90caf9; font-size: 0.75rem;">📞 ${equipo.linea}</div>`;
            if (equipo.iccid) htmlLinea += `<div style="color: #ccc; font-size: 0.75rem;">💳 ${equipo.iccid}</div>`;
            if (!equipo.linea && !equipo.iccid) htmlLinea = '<span style="color:#555;">N/A</span>';
            
            let htmlFoto = equipo.foto && equipo.foto.includes('http') ? `<a href="${equipo.foto}" target="_blank" style="color:#ffb74d;">📷 Ver</a>` : '<span style="color:#555;">S/F</span>';

            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td style="text-align: center;">
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
                <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${equipo.comentario}">${equipo.comentario}</td>
                <td>${htmlFoto}</td>
                <td>
                    <button class="btn-stock-accion" onclick="appStock.abrirEdicion('${equipo.imei}')">✏️ Editar</button>
                </td>
            `;
            this.tbody.appendChild(fila);
        });
    }

    filtrarTabla(texto) {
        const query = texto.toLowerCase().trim();
        const filtrados = this.inventarioGlobal.filter(eq => {
            return Object.values(eq).some(valor => String(valor).toLowerCase().includes(query));
        });
        this.renderizarTabla(filtrados);
    }

    toggleTodos(checkboxMaster) {
        const checkboxes = document.querySelectorAll('.check-item');
        checkboxes.forEach(cb => cb.checked = checkboxMaster.checked);
    }

    async enviarSeleccionadosASalidas() {
        const checkboxes = document.querySelectorAll('.check-item:checked');
        if (checkboxes.length === 0) return alert("⚠️ Selecciona al menos un equipo marcando su casilla.");
        
        const imeisSeleccionados = Array.from(checkboxes).map(cb => cb.value);
        
        if (!confirm(`📦 ¿Estás seguro de mover ${imeisSeleccionados.length} equipo(s) de Stock a Salidas? Esto los borrará de esta tabla y los pasará a Soporte Técnico.`)) {
            return;
        }

        const btn = document.getElementById('btn-enviar-salidas');
        btn.innerText = "⏳ Moviendo...";
        btn.disabled = true;

        try {
            const peticion = await fetch(this.urlAppsScript, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ 
                    accion: "mover_a_salidas", 
                    imeis: imeisSeleccionados
                })
            });
            const respuesta = await peticion.json();

            if (respuesta.success) {
                alert(`✅ ¡Éxito! ${respuesta.mensaje}`);
                this.cargarDatos(); // Recargar la tabla
                // Refrescar el inventario de Soporte para que aparezcan
                if (window.appSoporte) window.appSoporte.iniciar(); 
            } else {
                alert("❌ Error: " + respuesta.error);
            }
        } catch (error) {
            console.error(error);
            alert("❌ Falla de red al intentar conectar con el servidor.");
        }
        
        btn.innerText = "📦 Enviar a Salidas";
        btn.disabled = false;
    }

    abrirEdicion(imei) {
        const equipo = this.inventarioGlobal.find(e => e.imei === imei);
        if (!equipo) return;

        const modalAnterior = document.getElementById('modal-stock-edit');
        if (modalAnterior) modalAnterior.remove();

        const modalHTML = `
            <div id="modal-stock-edit" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; justify-content: center; align-items: center;">
                <div style="background: #1e1e1e; border: 1px solid #ffb74d; border-radius: 8px; padding: 25px; width: 450px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <h2 style="color: #ffb74d; margin-top: 0; margin-bottom: 5px;">Editar Equipo</h2>
                    <p style="color: #888; font-size: 0.85rem; margin-top: 0; margin-bottom: 20px;">IMEI: <b style="color:#fff;">${equipo.imei}</b> (${equipo.marca} ${equipo.modelo})</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div>
                            <label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Estado:</label>
                            <input type="text" id="edit-stock-estado" value="${equipo.estado}" style="width: 100%; padding: 10px; background: #111; border: 1px solid #444; color: #fff; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Línea (MSISDN):</label>
                            <input type="text" id="edit-stock-linea" value="${equipo.linea}" style="width: 100%; padding: 10px; background: #111; border: 1px solid #444; color: #fff; border-radius: 4px;">
                        </div>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Ubicación / Unidad:</label>
                        <input type="text" id="edit-stock-ubicacion" value="${equipo.ubicacion}" style="width: 100%; padding: 10px; background: #111; border: 1px solid #444; color: #fff; border-radius: 4px;">
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">ICCID Vinculado:</label>
                        <input type="text" id="edit-stock-iccid" value="${equipo.iccid}" style="width: 100%; padding: 10px; background: #111; border: 1px solid #444; color: #fff; border-radius: 4px;">
                    </div>

                    <div style="margin-bottom: 25px;">
                        <label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 5px;">Comentario:</label>
                        <textarea id="edit-stock-comentario" style="width: 100%; padding: 10px; background: #111; border: 1px solid #444; color: #fff; border-radius: 4px; resize: vertical; min-height: 60px;">${equipo.comentario}</textarea>
                    </div>

                    <div style="display: flex; justify-content: space-between; gap: 10px;">
                        <button onclick="document.getElementById('modal-stock-edit').remove()" style="flex: 1; padding: 10px; background: #333; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Cancelar</button>
                        <button id="btn-guardar-stock" onclick="appStock.guardarEdicion('${equipo.imei}')" style="flex: 1; padding: 10px; background: #ffb74d; color: #000; font-weight: bold; border: none; border-radius: 4px; cursor: pointer;">💾 Guardar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    async guardarEdicion(imei) {
        const btn = document.getElementById('btn-guardar-stock');
        btn.innerText = "Guardando... ⏳"; btn.disabled = true;

        try {
            const peticion = await fetch(this.urlAppsScript, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ 
                    accion: "editar_stock", 
                    imei: imei,
                    nuevoEstado: document.getElementById('edit-stock-estado').value,
                    nuevaUbicacion: document.getElementById('edit-stock-ubicacion').value,
                    nuevoIccid: document.getElementById('edit-stock-iccid').value,
                    nuevaLinea: document.getElementById('edit-stock-linea').value,
                    nuevoComentario: document.getElementById('edit-stock-comentario').value
                })
            });
            const respuesta = await peticion.json();

            if (respuesta.success) {
                document.getElementById('modal-stock-edit').remove();
                this.cargarDatos(); 
            } else {
                alert("❌ Error: " + respuesta.error);
                btn.innerText = "💾 Guardar"; btn.disabled = false;
            }
        } catch (error) {
            alert("❌ Falla de red al intentar conectar.");
            btn.innerText = "💾 Guardar"; btn.disabled = false;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => { window.appStock = new ControlInventario(); });
