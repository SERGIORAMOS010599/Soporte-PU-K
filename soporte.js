class SoporteTecnico {
    constructor() {
        this.urlSalidas = "https://soporte-pu-k.onrender.com/api/salidas";
        this.urlLineas = "https://soporte-pu-k.onrender.com/api/lineas";
        this.lineasMapa = new Map();
        this.equipos = [];
    }

    async iniciar() {
        try {
            const resS = await fetch(this.urlSalidas);
            this.equipos = await resS.json();
            
            try {
                const resL = await fetch(this.urlLineas);
                const listaLineas = await resL.json();
                listaLineas.forEach(l => {
                    const iccid = (l.ICCID || l.Iccid || '').toString().trim();
                    if (iccid) this.lineasMapa.set(iccid, l.Linea || l.LINEA || 'SIN NÚMERO');
                });
            } catch (e) { console.warn("Líneas no cargadas"); }

            this.renderizar();
        } catch (e) {
            console.error(e);
        }
    }

    renderizar() {
        const grid = document.getElementById('grid-salidas');
        if (!grid) return;
        grid.innerHTML = '';
        
        this.equipos.forEach(eq => {
            const e = {}; 
            for(let k in eq) e[k.trim()] = (typeof eq[k]=='string')?eq[k].trim():eq[k];
            
            // Usamos "Estado del Servicio" (con espacios) como me indicaste
            const estadoServicio = e["Estado del Servicio"] || 'PENDIENTE';
            
            const div = document.createElement('div');
            div.className = 'tarjeta-gps';
            div.innerHTML = `
                <div class="tarjeta-unidad">${e.UNIDAD || 'SIN UNIDAD'}</div>
                <div class="tarjeta-cliente">${e.Cliente || ''} ${e.ID || ''}</div>
                <h2 class="tarjeta-marca">${e.Marca || 'N/A'}</h2>
                <div class="tarjeta-modelo">${e.Modelo || 'N/A'}</div>
                <div class="tarjeta-servicio">${estadoServicio}</div>
                <div class="tarjeta-acciones">
                    <div class="accion-btn rojo" onclick="event.stopPropagation(); appSoporte.enviarSMS('apagar')">APAGAR <span class="circulo"></span></div>
                    <div class="accion-btn verde" onclick="event.stopPropagation(); appSoporte.enviarSMS('encender')">ENCENDER <span class="circulo"></span></div>
                </div>
            `;
            div.onclick = () => this.abrir(e);
            grid.appendChild(div);
        });
    }

    abrir(e) {
        const panel = document.getElementById('panel-detalles');
        const equipo = {}; 
        for(let k in e) equipo[k.trim()] = (typeof e[k]=='string')?e[k].trim():e[k];

        const iccid = (equipo.ICCID || '').toString().trim();
        const numeroLinea = this.lineasMapa.get(iccid) || 'NO ENCONTRADA';

        document.getElementById('det-titulo').innerText = `${equipo.Cliente || 'SIN CLIENTE'} (${equipo.ID || ''})`;
        document.getElementById('det-id').innerText = equipo.ID || 'N/A';
        document.getElementById('det-linea').innerText = numeroLinea;
        document.getElementById('det-iccid').innerText = iccid || 'N/A';
        document.getElementById('det-imei').innerText = equipo.IMEI || equipo.Imei || 'N/A';
        document.getElementById('det-marca').innerText = equipo.Marca || 'N/A';
        document.getElementById('det-modelo').innerText = equipo.Modelo || 'N/A';
        document.getElementById('det-cliente').innerText = equipo.Cliente || 'N/A';
        
        // CORRECCIÓN AQUÍ: Apuntamos a la columna correcta
        document.getElementById('det-servicio').innerText = equipo["Estado del Servicio"] || 'PENDIENTE';

        document.getElementById('det-marca').setAttribute('data-linea', numeroLinea);
        panel.classList.add('abierto');
    }

    cerrarDetalles() {
        document.getElementById('panel-detalles').classList.remove('abierto');
    }

    enviarSMS(accion) {
        const numero = document.getElementById('det-marca').getAttribute('data-linea');
        const comando = (accion === 'apagar') ? "SA200CMD;123456;02;Enable1" : "SA200CMD;123456;02;Disable1";
        window.open(`sms:${numero}?body=${encodeURIComponent(comando)}`, '_self');
    }
}

const appSoporte = new SoporteTecnico();
document.addEventListener('DOMContentLoaded', () => appSoporte.iniciar());
