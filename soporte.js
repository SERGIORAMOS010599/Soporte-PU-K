class SoporteTecnico {
    constructor() {
        this.urlSalidas = "https://soporte-pu-k.onrender.com/api/salidas";
        this.urlLineas = "https://soporte-pu-k.onrender.com/api/lineas";
        this.lineasMapa = new Map(); // <--- ¡AQUÍ ESTÁ LA VELOCIDAD!
        this.equipos = [];
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

            // INDEXAR LÍNEAS: Convertimos la lista en un mapa de búsqueda instantánea
            listaLineas.forEach(l => {
                const iccid = (l.ICCID || l.Iccid || '').toString().trim();
                if (iccid) this.lineasMapa.set(iccid, l.Linea || l.LINEA || 'SIN NÚMERO');
            });

            this.renderizarCuadricula();
        } catch (error) {
            contenedor.innerHTML = `<p style="color: #ff4c4c;">Error: ${error.message}</p>`;
        }
    }

    mostrarDetalles(equipo, id, marca, modelo, estado, cliente, iccidSalida) {
        // BÚSQUEDA INSTANTÁNEA: Ya no recorremos toda la lista, solo consultamos el mapa
        const numeroLinea = this.lineasMapa.get(iccidSalida.toString().trim()) || 'NO ENCONTRADA';

        // Llenamos datos... (resto igual)
        document.getElementById('det-titulo').innerText = `${cliente} (${id})`;
        document.getElementById('det-linea').innerText = numeroLinea;
        // ... (restos de campos)
        
        // ANIMACIÓN FLUIDA: Usamos 'requestAnimationFrame' para que la apertura sea instantánea
        requestAnimationFrame(() => {
            document.getElementById('panel-detalles').classList.add('abierto');
        });
    }
}

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
