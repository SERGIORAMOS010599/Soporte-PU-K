class SoporteTecnico {
    constructor() {
        this.urlSalidas = "https://soporte-pu-k.onrender.com/api/salidas";
        this.urlLineas = "https://soporte-pu-k.onrender.com/api/lineas";
        this.lineasMapa = new Map();
        this.equipos = [];
    }

    async iniciar() {
        await this.cargarDatos();
    }

    async cargarDatos() {
        const contenedor = document.getElementById('grid-salidas');
        
        try {
            const [resSalidas, resLineas] = await Promise.all([
                fetch(this.urlSalidas),
                fetch(this.urlLineas)
            ]);

            this.equipos = await resSalidas.json();
            const listaLineas = await resLineas.json();

            // Indexar líneas para velocidad instantánea
            listaLineas.forEach(l => {
                const iccid = (l.ICCID || l.Iccid || '').toString().trim();
                if (iccid) this.lineasMapa.set(iccid, l.Linea || l.LINEA || 'SIN NÚMERO');
            });

            this.renderizarCuadricula();
        } catch (error) {
            contenedor.innerHTML = `<p style="color: #ff4c4c;">Error de conexión: ${error.message}</p>`;
        }
    }

    renderizarCuadricula() {
        const contenedor = document.getElementById('grid-salidas');
        contenedor.innerHTML = '';

        this.equipos.forEach(equipoRaw => {
            // Limpieza de datos
            const equipo = {};
            for (let key in equipoRaw) { equipo[key.trim()] = (typeof equipoRaw[key] === 'string') ? equipoRaw[key].trim() : equipoRaw[key]; }
            
            const tarjeta = document.createElement('div');
            tarjeta.className = 'tarjeta-gps';
            
            const unidad = equipo.UNIDAD || 'SIN UNIDAD';
            const cliente = equipo.Cliente || 'SIN CLIENTE';
            const marca = equipo.Marca || 'SIN MARCA';
            const modelo = equipo.Modelo || 'N/A';
            const tipoServicio = equipo["Tipo de servicio"] || 'ESTANDAR';
            const idEquipo = equipo.ID || 'N/A';

            tarjeta.innerHTML = `
                <div class="tarjeta-unidad">${unidad}</div>
                <div class="tarjeta-cliente">${cliente} ${idEquipo}</div>
                <h2 class="tarjeta-marca">${marca}</h2>
                <div class="tarjeta-modelo">${modelo}</div>
                <div class="tarjeta-servicio">${tipoServicio}</div>
                <div class="tarjeta-acciones">
                    <div class="accion-btn rojo">APAGAR MOTOR <span class="circulo"></span></div>
                    <div class="accion-btn verde">ENCENDER MOTOR <span class="circulo"></span></div>
                    <div class="accion-iconos"><span>🖥️</span><span>❯</span></div>
                </div>
            `;

            tarjeta.onclick = () => this.mostrarDetalles(equipo, idEquipo, marca, modelo, equipo.Estado, cliente, equipo.ICCID);
            contenedor.appendChild(tarjeta);
        });
    }

    mostrarDetalles(equipo, id, marca, modelo, estado, cliente, iccidSalida) {
        const iccid = iccidSalida ? iccidSalida.toString().trim() : '';
        const numeroLinea = this.lineasMapa.get(iccid) || 'NO ENCONTRADA';

        document.getElementById('det-titulo').innerText = `${cliente} (${id})`;
        document.getElementById('det-id').innerText = id;
        document.getElementById('det-linea').innerText = numeroLinea;
        document.getElementById('det-iccid').innerText = iccidSalida || 'N/A';
        document.getElementById('det-imei').innerText = equipo.IMEI || id;
        document.getElementById('det-marca').innerText = marca;
        document.getElementById('det-modelo').innerText = modelo;
        document.getElementById('det-cliente').innerText = cliente;
        document.getElementById('det-estado').innerText = estado || 'PENDIENTE';

        document.getElementById('det-marca').setAttribute('data-linea', numeroLinea);
        document.getElementById('panel-detalles').classList.add('abierto');
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
