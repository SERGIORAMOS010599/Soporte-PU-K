class SoporteTecnico {
    constructor() {
        this.urlSalidas = "https://soporte-pu-k.onrender.com/api/salidas";
        this.urlLineas = "https://soporte-pu-k.onrender.com/api/lineas";
        this.lineasMapa = new Map();
        this.equipos = [];
    }

    async iniciar() {
        // Carga rápida: Primero las líneas (son pocas) y luego los equipos
        this.cargarLineas(); 
        await this.cargarEquipos();
    }

    async cargarLineas() {
        const res = await fetch(this.urlLineas);
        const listaLineas = await res.json();
        listaLineas.forEach(l => {
            const iccid = (l.ICCID || l.Iccid || '').toString().trim();
            if (iccid) this.lineasMapa.set(iccid, l.Linea || l.LINEA || 'SIN NÚMERO');
        });
    }

    async cargarEquipos() {
        const res = await fetch(this.urlSalidas);
        this.equipos = await res.json();
        this.renderizarCuadricula();
    }

    renderizarCuadricula() {
        const contenedor = document.getElementById('grid-salidas');
        contenedor.innerHTML = '';
        
        // Renderizado por lotes (esto evita que la página se congele)
        let i = 0;
        const renderBatch = () => {
            const fragment = document.createDocumentFragment();
            const end = Math.min(i + 20, this.equipos.length);
            
            for (; i < end; i++) {
                const equipoRaw = this.equipos[i];
                const equipo = {};
                for (let key in equipoRaw) { equipo[key.trim()] = (typeof equipoRaw[key] === 'string') ? equipoRaw[key].trim() : equipoRaw[key]; }
                
                const tarjeta = document.createElement('div');
                tarjeta.className = 'tarjeta-gps';
                // ... (tu lógica de innerHTML de tarjeta aquí)
                tarjeta.onclick = () => this.mostrarDetalles(equipo, equipo.ID, equipo.Marca, equipo.Modelo, equipo.Estado, equipo.Cliente, equipo.ICCID);
                fragment.appendChild(tarjeta);
            }
            contenedor.appendChild(fragment);
            if (i < this.equipos.length) requestAnimationFrame(renderBatch);
        };
        renderBatch();
    }

    // El despliegue ahora es más fluido al separar los estilos del DOM
    mostrarDetalles(equipo, id, marca, modelo, estado, cliente, iccidSalida) {
        const panel = document.getElementById('panel-detalles');
        
        // Actualizamos datos
        document.getElementById('det-titulo').innerText = `${cliente || 'N/A'} (${id || 'N/A'})`;
        document.getElementById('det-linea').innerText = this.lineasMapa.get((iccidSalida||'').toString().trim()) || 'NO ENCONTRADA';
        // ... (resto de tus campos)
        
        // La clase 'abierto' ahora solo maneja la transición CSS
        panel.classList.add('abierto');
    }
}

    cerrarDetalles() {
        document.getElementById('panel-detalles').classList.remove('abierto');
    }

    obtenerComando(marca, accion) {
        marca = marca.toUpperCase();
        if (marca.includes('SUNTECH')) {
            if (accion === 'apagar') return "SA200CMD;123456;02;Enable1";
            if (accion === 'encender') return "SA200CMD;123456;02;Disable1";
            if (accion === 'reiniciar') return "SA200CMD;123456;03";
        }
        return "COMANDO_NO_ENCONTRADO";
    }

    enviarSMS(accion) {
        const numeroLinea = document.getElementById('det-marca').getAttribute('data-linea');
        const marca = document.getElementById('det-marca').innerText;
        const comando = this.obtenerComando(marca, accion);
        
        if (comando === "COMANDO_NO_ENCONTRADO") return alert("Marca no soportada");
        
        const separador = /iPad|iPhone|iPod/.test(navigator.userAgent) ? '&' : '?';
        window.open(`sms:${numeroLinea}${separador}body=${encodeURIComponent(comando)}`, '_self');
    }
}

const appSoporte = new SoporteTecnico();
document.addEventListener('DOMContentLoaded', () => appSoporte.iniciar());
