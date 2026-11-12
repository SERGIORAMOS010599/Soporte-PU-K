// js/satelitales.js

class InventarioSatelital {
    constructor() {
        this.tbody = document.getElementById('tbody-satelitales');
        this.inventario = []; 
        this.sheetId = '1JpRyU-cFuGpmZpfuTil7FicbyFUrX3GS_nMUZLSUKKM';
        // NOTA: Para editar en el futuro, usaremos la misma URL de Apps Script
        this.urlAppsScript = 'https://script.google.com/macros/s/AKfycbxua3f3WK8cOQVV8NGFHaRJ4D7omCK7CptzXtDprnTpooGY-fZxw7m5XoHQgQOAMa2V/exec';
        
        this.cargarDatos();
    }

    async cargarDatos() {
        if (!this.tbody) return;
        this.tbody.innerHTML = '<tr><td colspan="12" style="text-align:center; padding: 40px; color:#90caf9; font-size:1.2rem;">⏳ Conectando satélites y descargando inventario... 📡</td></tr>';
        
        const urlSatelitales = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('Satelitales')}`;
        
        try {
            const respuesta = await fetch(urlSatelitales);
            const texto = await respuesta.text();
            const json = JSON.parse(texto.substring(47).slice(0, -2));
            
            this.inventario = [];
            
            // Mapeo: ESN(0), Autenticacion(1), Modelo(2), Cliente(3), FechaAct(4), Vencimiento(5), FechaBaja(6), Meses(7), Renovaciones(8), Estado(9), Prog/Firmware(10)
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
            this.tbody.innerHTML = `<tr><td colspan="12" style="text-align:center; color:#ff4c4c; padding: 20px;">❌ Error al descargar datos. Asegúrate de que la pestaña en Sheets se llame "Satelitales".</td></tr>`;
        }
    }

    renderizarTabla(datos) {
        if (!this.tbody) return;
        this.tbody.innerHTML = '';

        if (datos.length === 0) {
            this.tbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding: 30px; color:#777; font-size:1.1rem;">No se encontraron equipos satelitales.</td></tr>`;
            return;
        }

        datos.forEach(eq => {
            let estadoMayus = String(eq.estado).toUpperCase();
            let claseBadge = 'badge-revision'; // Gris/Naranja por defecto
            if (estadoMayus.includes('ACTIVO') || estadoMayus.includes('NUEVO')) claseBadge = 'badge-disponible';
            if (estadoMayus.includes('SUSPENDIDO') || estadoMayus.includes('BAJA')) claseBadge = 'badge-asignado';

            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td style="font-family: monospace; color: #90caf9; font-weight: bold; font-size: 1rem;">${eq.esn}</td>
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
                    <button class="btn-stock-accion" onclick="alert('Módulo de edición satelital en construcción')">✏️ Editar</button>
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
}

document.addEventListener('DOMContentLoaded', () => { window.appSatelitales = new InventarioSatelital(); });
