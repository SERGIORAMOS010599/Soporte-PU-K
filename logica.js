// Aquí va tu enlace de Render
const URL_API = "https://soporte-pu-k.onrender.com/api/salidas";

async function cargarEquipos() {
    const contenedor = document.getElementById('lista-salidas');
    
    // Mostramos un pequeño mensaje mientras descargamos los datos
    contenedor.innerHTML = '<p style="text-align:center; padding:20px; color:var(--color-naranja);">Cargando equipos desde la nube...</p>';

    try {
        // Vamos al servidor a traer los datos
        const respuesta = await fetch(URL_API);
        const datos = await respuesta.json();

        // Limpiamos el mensaje de carga
        contenedor.innerHTML = '';

        // Recorremos cada equipo que nos mandó el Excel
        datos.forEach(equipo => {
            // Creamos una tarjeta nueva
            const tarjeta = document.createElement('div');
            tarjeta.className = 'tarjeta-gps';
            
            // Ajuste dinámico de campos por si vienen en mayúsculas o minúsculas
            const idEquipo = equipo.ID || equipo.Imei || equipo.IMEI || 'N/A';
            const marca = equipo.Marca || equipo.MARCA || 'SIN MARCA';
            const modelo = equipo.Modelo || equipo.MODELO || 'N/A';
            const estado = equipo.Estado || equipo.ESTADO || 'PENDIENTE';

            tarjeta.innerHTML = `
                <div class="estado">${estado}</div>
                <h3 style="margin: 5px 0;">${marca}</h3>
                <p style="color: var(--color-gris); margin: 3px 0; font-size: 0.9em;">${modelo}</p>
                <p style="font-size: 0.8em; margin: 3px 0;">ID: ${idEquipo}</p>
            `;

            // Le damos la orden de que al hacer clic, actualice el panel de la derecha
            tarjeta.onclick = () => mostrarDetalles(equipo, idEquipo, marca, modelo);

            // Inyectamos la tarjeta en la pantalla
            contenedor.appendChild(tarjeta);
        });

    } catch (error) {
        contenedor.innerHTML = `<p style="color: #ff4c4c; padding:20px;">Error de conexión: ${error.message}</p>`;
    }
}

function mostrarDetalles(equipo, idEquipo, marca, modelo) {
    // Inyectamos la información del equipo seleccionado en el panel derecho
    document.getElementById('detalle-id').innerText = idEquipo;
    document.getElementById('detalle-marca').innerText = marca;
    document.getElementById('detalle-modelo').innerText = modelo;
    
    // Guardamos la línea (teléfono) de forma oculta en algún lado para usarla al enviar el SMS
    // Si tu Excel tiene una columna llamada "Linea" o "Telefono", la guardamos como atributo:
    document.getElementById('detalle-marca').setAttribute('data-linea', equipo.Linea || equipo.LINEA || '6620000000'); 
}


// ==========================================
// NUEVA LÓGICA DE BOTONES Y COMANDOS SMS
// ==========================================

function obtenerComando(marca, accion) {
    // Convertimos la marca a mayúsculas para no fallar
    marca = marca.toUpperCase();
    
    // 1. Diccionario para equipos SUNTECH
    if (marca.includes('SUNTECH')) {
        if (accion === 'apagar') return "SA200CMD;123456;02;Enable1"; // <-- Ejemplo a cambiar
        if (accion === 'encender') return "SA200CMD;123456;02;Disable1";
        if (accion === 'reiniciar') return "SA200CMD;123456;03";
    }
    
    // 2. Diccionario para equipos TELTONIKA
    else if (marca.includes('TELTONIKA')) {
        if (accion === 'apagar') return "  setdigout 1"; // Los espacios importan en Teltonika
        if (accion === 'encender') return "  setdigout 0";
        if (accion === 'reiniciar') return "  cpureset";
    }

    // 3. Diccionario para equipos JIMI IOT
    else if (marca.includes('JIMI')) {
        if (accion === 'apagar') return "RELAY,1#";
        if (accion === 'encender') return "RELAY,0#";
        if (accion === 'reiniciar') return "RESET#";
    }

    // Si la marca no está registrada
    return "COMANDO_NO_ENCONTRADO";
}

function enviarSMS(accion) {
    const marcaElemento = document.getElementById('detalle-marca');
    const marca = marcaElemento.innerText;
    const numeroLinea = marcaElemento.getAttribute('data-linea'); 
    
    if (marca === "---" || marca === "N/A") {
        alert("Primero selecciona un equipo de la lista.");
        return;
    }

    const comandoTexto = obtenerComando(marca, accion);
    
    if (comandoTexto === "COMANDO_NO_ENCONTRADO") {
        alert(`Aún no configuramos los comandos para la marca: ${marca}`);
        return;
    }

    // Armamos el enlace y lo abrimos
    const enlaceSMS = `sms:${numeroLinea}?body=${encodeURIComponent(comandoTexto)}`;
    window.open(enlaceSMS, '_self');
}

// Arrancamos el motor en cuanto carga la página
cargarEquipos();
