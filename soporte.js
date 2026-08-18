class SoporteTecnico {
    constructor() {
        this.urlSalidas = "https://soporte-pu-k.onrender.com/api/salidas";
        this.urlLineas = "https://soporte-pu-k.onrender.com/api/lineas";
        this.inventarioLineas = [];
        this.equipos = [];
    }

    // Método principal para arrancar la app
    async iniciar() {
        await this.cargarDatos();
    }

    // Método para descargar ambas bases de datos
    async cargarDatos() {
        const contenedor = document.getElementById('grid-salidas');
        contenedor.innerHTML = '<p style="color:var(--color-naranja); grid-column: 1 / -1;">Descargando bases de datos de inventario...</p>';

        try {
            const [resSalidas, resLineas] = await Promise.all([
                fetch(this.urlSalidas),
                fetch(this.urlLineas)
            ]);

            this.equipos = await resSalidas.json();
            this.inventarioLineas = await resLineas.json();

            this.renderizarCuadricula();
        } catch (error) {
            contenedor.innerHTML = `<p style="color: #ff4c4c; grid-column: 1 / -1;">Error de conexión: ${error.message}</p>`;
        }
    }

    // Método para pintar las tarjetas en pantalla
// Método para pintar las tarjetas en pantalla
   // Método para pintar las tarjetas en pantalla
    renderizarCuadricula() {
        const contenedor = document.getElementById('grid-salidas');
        contenedor.innerHTML = '';

        this.equipos.forEach(equipo => {
            const tarjeta = document.createElement('div');
            tarjeta.className = 'tarjeta-gps';
            
            // BUSCAMOS LOS DATOS USANDO 'ID' COMO REFERENCIA PRINCIPAL
            // Si tu Excel tiene espacios, usamos estas funciones para limpiar
            const obtenerDato = (nombres) => {
                for (let nombre of nombres) {
                    if (equipo[nombre] !== undefined && equipo[nombre] !== null) return equipo[nombre];
                }
                return 'N/A';
            };

            const idEquipo = equipo.ID || equipo.Id || equipo.id || 'SIN ID';
            
            // Usamos una lista de posibles nombres para cada campo
            const unidad = obtenerDato(["UNIDAD", "Unidad", "unidad", " MARCA/MODELO DE LA UNIDAD"]);
            const cliente = obtenerDato(["Cliente", "CLIENTE", "cliente"]);
            const marca = obtenerDato(["Marca", "MARCA", "marca"]);
            const modelo = obtenerDato(["Modelo", "MODELO", "modelo"]);
            const tipoServicio = obtenerDato(["Tipo de servicio", "Tipo de Servicio", "TIPO DE SERVICIO"]);
            
            const estado = equipo.Estado || equipo.ESTADO || 'PENDIENTE';
            const iccid = equipo.ICCID || equipo.Iccid || equipo.iccid || 'N/A';

            // Inyectamos el HTML
            tarjeta.innerHTML = `
                <div class="tarjeta-unidad">${unidad}</div>
                <div class="tarjeta-cliente">${cliente} ${idEquipo}</div>
                
                <h2 class="tarjeta-marca">${marca}</h2>
                <div class="tarjeta-modelo">${modelo}</div>
                
                <div class="tarjeta-servicio">${tipoServicio}</div>
                
                <div class="tarjeta-acciones">
                    <div class="accion-btn rojo">APAGAR MOTOR <span class="circulo"></span></div>
                    <div class="accion-btn verde">ENCENDER MOTOR <span class="circulo"></span></div>
                    <div class="accion-iconos">
                        <span>🖥️</span>
                        <span>❯</span>
                    </div>
                </div>
            `;

            tarjeta.onclick = () => this.mostrarDetalles(equipo, idEquipo, marca, modelo, estado, cliente, iccid);
            contenedor.appendChild(tarjeta);
        });
    }

    // Método para cruzar datos y abrir el panel derecho
    mostrarDetalles(equipo, id, marca, modelo, estado, cliente, iccidSalida) {
        const lineaEncontrada = this.inventarioLineas.find(l => {
            const iccidTabla = (l.ICCID || l.Iccid || '').toString().trim();
            return iccidTabla === iccidSalida.toString().trim() && iccidTabla !== '';
        });

        const numeroLinea = lineaEncontrada ? (lineaEncontrada.Linea || lineaEncontrada.LINEA || 'SIN NÚMERO') : 'NO ENCONTRADA';

        document.getElementById('det-titulo').innerText = `${cliente} (${id})`;
        document.getElementById('det-id').innerText = id;
        document.getElementById('det-linea').innerText = numeroLinea;
        document.getElementById('det-iccid').innerText = iccidSalida;
        document.getElementById('det-imei').innerText = equipo.IMEI || equipo.Imei || id;
        document.getElementById('det-marca').innerText = marca;
        document.getElementById('det-modelo').innerText = modelo;
        document.getElementById('det-cliente').innerText = cliente;
        document.getElementById('det-estado').innerText = estado;

        document.getElementById('det-marca').setAttribute('data-linea', numeroLinea);
        document.getElementById('panel-detalles').classList.add('abierto');
    }

    // Método para cerrar el panel
    cerrarDetalles() {
        document.getElementById('panel-detalles').classList.remove('abierto');
    }

    // Diccionario de comandos internos
    obtenerComando(marca, accion) {
        marca = marca.toUpperCase();
        if (marca.includes('SUNTECH')) {
            if (accion === 'apagar') return "SA200CMD;123456;02;Enable1";
            if (accion === 'encender') return "SA200CMD;123456;02;Disable1";
            if (accion === 'reiniciar') return "SA200CMD;123456;03";
        } else if (marca.includes('TELTONIKA')) {
            if (accion === 'apagar') return "  setdigout 1";
            if (accion === 'encender') return "  setdigout 0";
            if (accion === 'reiniciar') return "  cpureset";
        }
        return "COMANDO_NO_ENCONTRADO";
    }

    // Método para ensamblar y enviar el SMS
    enviarSMS(accion) {
        const marcaElemento = document.getElementById('det-marca');
        const marca = marcaElemento.innerText;
        const numeroLinea = marcaElemento.getAttribute('data-linea'); 
        
        if (numeroLinea === 'NO ENCONTRADA' || numeroLinea === 'SIN NÚMERO') {
            alert("No se puede enviar el comando porque no se encontró el número de línea vinculado a este ICCID.");
            return;
        }

        const comandoTexto = this.obtenerComando(marca, accion);
        if (comandoTexto === "COMANDO_NO_ENCONTRADO") {
            alert(`Aún no configuramos los comandos para la marca: ${marca}`);
            return;
        }

        const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const separador = esIOS ? '&' : '?';
        const enlaceSMS = `sms:${numeroLinea}${separador}body=${encodeURIComponent(comandoTexto)}`;
        window.open(enlaceSMS, '_self');
    }
}

// Instanciamos el objeto y lo exponemos globalmente para que el HTML lo pueda usar
const appSoporte = new SoporteTecnico();
document.addEventListener('DOMContentLoaded', () => appSoporte.iniciar());
