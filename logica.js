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
            
            // Llenamos la tarjeta con los datos reales. 
            // NOTA: Ajusta 'Marca', 'Modelo' o 'ID' si en tu Excel los encabezados se llaman diferente
            tarjeta.innerHTML = `
                <div class="estado">PENDIENTE</div>
                <h3>${equipo.Marca || 'SIN MARCA'}</h3>
                <p style="color: var(--color-gris); font-size: 0.9em;">${equipo.Modelo || 'N/A'}</p>
                <p style="font-size: 0.8em;">ID: ${equipo.ID || equipo.Imei || 'N/A'}</p>
            `;

            // Le damos la orden de que al hacer clic, actualice el panel de la derecha
            tarjeta.onclick = () => mostrarDetalles(equipo);

            // Inyectamos la tarjeta en la pantalla
            contenedor.appendChild(tarjeta);
        });

    } catch (error) {
        contenedor.innerHTML = `<p style="color: #ff4c4c; padding:20px;">Error de conexión: ${error.message}</p>`;
    }
}

function mostrarDetalles(equipo) {
    // Inyectamos la información del equipo seleccionado en el panel derecho
    document.getElementById('detalle-id').innerText = equipo.ID || equipo.Imei || 'N/A';
    document.getElementById('detalle-marca').innerText = equipo.Marca || 'N/A';
    document.getElementById('detalle-modelo').innerText = equipo.Modelo || 'N/A';
}

// Arrancamos el motor en cuanto carga la página
cargarEquipos();
