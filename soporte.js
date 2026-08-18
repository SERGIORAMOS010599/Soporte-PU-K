class SoporteTecnico {
    constructor() {
        this.urlSalidas = "https://soporte-pu-k.onrender.com/api/salidas";
        this.urlLineas = "https://soporte-pu-k.onrender.com/api/lineas";
        this.lineasMapa = new Map();
        this.equipos = [];
    }

    async iniciar() {
        try {
            const [resS, resL] = await Promise.all([fetch(this.urlSalidas), fetch(this.urlLineas)]);
            this.equipos = await resS.json();
            const listaLineas = await resL.json();
            
            listaLineas.forEach(l => {
                const iccid = (l.ICCID || l.Iccid || '').toString().trim();
                if (iccid) this.lineasMapa.set(iccid, l.Linea || l.LINEA || 'SIN NÚMERO');
            });
            this.renderizar();
        } catch (e) {
            console.error("Error al iniciar:", e);
        }
    }

    renderizar() {
        const grid = document.getElementById('grid-salidas');
        grid.innerHTML = '';
        this.equipos.forEach(eq => {
            const e = {}; for(let k in eq) e[k.trim()] = (typeof eq[k]=='string')?eq[k].trim():eq[k];
            const div = document.createElement('div');
            div.className = 'tarjeta-gps';
            div.innerHTML = `
                <div class="tarjeta-unidad">${e.UNIDAD || 'SIN UNIDAD'}</div>
                <div class="tarjeta-cliente">${e.Cliente || 'SIN CLIENTE'} ${e.ID || ''}</div>
                <h2 class="tarjeta-marca">${e.Marca || 'SIN MARCA'}</h2>
                <div class="tarjeta-modelo">${e.Modelo || 'N/A'}</div>
                <div class="tarjeta-servicio">${e["Tipo de servicio"] || 'ESTANDAR'}</div>
            `;
            div.onclick = () => this.abrir(e);
            grid.appendChild(div);
        });
    }

    abrir(e) {
        const iccid = (e.ICCID || '').toString().trim();
        document.getElementById('det-titulo').innerText = `${e.Cliente || 'N/A'} (${e.ID || ''})`;
        document.getElementById('det-linea').innerText = this.lineasMapa.get(iccid) || 'NO ENCONTRADA';
        document.getElementById('det-marca').setAttribute('data-linea', this.lineasMapa.get(iccid) || '');
        document.getElementById('det-marca').innerText = e.Marca || 'N/A';
        document.getElementById('panel-detalles').classList.add('abierto');
    }

    cerrarDetalles() {
        document.getElementById('panel-detalles').classList.remove('abierto');
    }
}

const appSoporte = new SoporteTecnico();
document.addEventListener('DOMContentLoaded', () => appSoporte.iniciar());
