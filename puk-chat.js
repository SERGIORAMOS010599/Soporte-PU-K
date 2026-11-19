// js/puk-chat.js

class ChatFlotantePUK {
    constructor() {
        this.urlAppsScript = 'https://script.google.com/macros/s/AKfycbxua3f3WK8cOQVV8NGFHaRJ4D7omCK7CptzXtDprnTpooGY-fZxw7m5XoHQgQOAMa2V/exec';
        this.adjuntosPUK = [];
        this.inicializarDragAndDrop();
    }

    inicializarDragAndDrop() {
        const panel = document.getElementById('puk-panel-chat');
        if (!panel) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evento => {
            panel.addEventListener(evento, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        panel.addEventListener('dragover', () => {
            panel.style.outline = '2px dashed #ffb74d';
            panel.style.outlineOffset = '-4px';
        });

        panel.addEventListener('dragleave', (e) => {
            // Evita parpadeos al pasar sobre elementos internos del chat
            if (!panel.contains(e.relatedTarget)) {
                panel.style.outline = '';
            }
        });

        panel.addEventListener('drop', (e) => {
            panel.style.outline = '';
            const archivos = Array.from(e.dataTransfer.files);
            if (archivos.length > 0) {
                this.procesarArchivos(archivos);
            }
        });
    }

    seleccionarAdjuntosPUK(input) {
        const archivos = Array.from(input.files);
        if (archivos.length > 0) {
            this.procesarArchivos(archivos);
        }
    }

    procesarArchivos(archivos) {
        const preview = document.getElementById('puk-adjuntos-preview');
        const texto = document.getElementById('puk-adjuntos-texto');

        archivos.forEach(archivo => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64Puro = e.target.result.split(',')[1];
                this.adjuntosPUK.push({
                    nombre: archivo.name,
                    tipo: archivo.type || 'application/pdf',
                    base64: base64Puro
                });
                if (preview && texto) {
                    texto.innerText = `📎 ${this.adjuntosPUK.length} archivo(s): ${this.adjuntosPUK.map(a => a.nombre).join(', ')}`;
                    preview.style.display = 'flex';
                }
            };
            reader.readAsDataURL(archivo);
        });
    }

    limpiarAdjuntosPUK() {
        this.adjuntosPUK = [];
        const input = document.getElementById('puk-archivo-input');
        const preview = document.getElementById('puk-adjuntos-preview');
        if (input) input.value = '';
        if (preview) preview.style.display = 'none';
    }

    async enviarMensajeChat() {
        const input = document.getElementById('puk-input-chat');
        if (!input) return;

        const mensajeUsuario = input.value.trim();
        if (!mensajeUsuario) return;

        // Capturamos y limpiamos adjuntos solo cuando sí hay mensaje
        const adjuntosAEnviar = [...this.adjuntosPUK];
        this.limpiarAdjuntosPUK();

        // Mostrar mensaje del usuario (y los nombres de archivos si adjuntó)
        let burbujaUsuario = mensajeUsuario;
        if (adjuntosAEnviar.length > 0) {
            const nombres = adjuntosAEnviar.map(a => a.nombre).join(', ');
            burbujaUsuario += `<div style="font-size: 0.75rem; color: #ffb74d; margin-top: 4px;">📎 ${nombres}</div>`;
        }
        this.agregarBurbujaChat(burbujaUsuario, 'puk-usuario');
        input.value = '';

        const textoEspera = adjuntosAEnviar.length > 0
            ? 'Procesando solicitud y adjuntando facturas... 🐕'
            : 'Olfateando el manual y revisando el equipo... 🐕';
        const idPensando = this.agregarBurbujaChat(textoEspera, 'puk-ia');

        // Solo inyectamos contexto de Mapon si NO es una solicitud de correo a proveedor
        const msgLower = mensajeUsuario.toLowerCase();
        const esCorreoProveedor = msgLower.includes('telcel') || msgLower.includes('syscom');
        let contextoOculto = "";

        if (!esCorreoProveedor && window.equipoEnPantallaMapon) {
            const eq = window.equipoEnPantallaMapon;
            const marca = eq['Device model'] || 'Desconocido';
            const estado = eq['Online status'] || 'Desconocido';
            const ultimoReporte = eq['Last data received'] || 'Desconocido';
            const imei = eq['IMEI'] || 'Desconocido';

            contextoOculto = `
                NOTA INTERNA PARA LA IA: El técnico está viendo actualmente un equipo en el dashboard de Mapon. 
                Aquí están los datos técnicos de ese equipo:
                - Marca/Modelo: ${marca}
                - Estado actual en Mapon: ${estado}
                - Último reporte: ${ultimoReporte}
                - IMEI: ${imei}
                
                Guía rápida de estados de Mapon para tu análisis:
                - NODATA (NOGPS): El equipo tiene energía pero no recibe señal de satélite (GPS). Sugiere revisar la ubicación del vehículo (si está bajo techo), la posición de la antena o problemas con el módulo GPS.
                - NODATA (INSTALL): Es un equipo nuevo que aún no ha reportado por primera vez o la instalación quedó inconclusa.
                - NODATA (NOPOWER): El equipo perdió la alimentación eléctrica principal (batería desconectada, fusible fundido o cables cortados).
                - OK: Funcionando correctamente.
                - OK (NOGPS): Reporta datos pero sin posición válida.
                
                Si la pregunta del técnico ("${mensajeUsuario}") es sobre fallas, usa estos datos y la guía de estados para darle un diagnóstico preciso, sugiriendo comandos o revisiones físicas necesarias para ese modelo específico (${marca}). No menciones que leíste esta "Nota Interna", actúa como si lo supieras por contexto.
            `;
        }

        const mensajeFinalParaIA = contextoOculto
            ? contextoOculto + "\n\nPregunta del técnico: " + mensajeUsuario
            : mensajeUsuario;

        try {
            const peticion = await fetch(this.urlAppsScript, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    mensaje: mensajeFinalParaIA,
                    adjuntos: adjuntosAEnviar
                })
            });
            const respuesta = await peticion.json();

            const burbujaPensando = document.getElementById(idPensando);
            if (burbujaPensando) burbujaPensando.remove();

            if (respuesta.success) {
                let textoHTML = respuesta.respuesta
                    .replace(/\n/g, '<br>')
                    .replace(/\*\*(.*?)\*\*/g, '<b style="color:#ffb74d;">$1</b>');

                this.agregarBurbujaChat(textoHTML, 'puk-ia');
            } else {
                this.agregarBurbujaChat("¡Grrr! Hubo un error al pensar: " + respuesta.error, 'puk-ia');
            }
        } catch (error) {
            const burbujaPensando = document.getElementById(idPensando);
            if (burbujaPensando) burbujaPensando.remove();
            this.agregarBurbujaChat("¡Grrr! No pude conectarme con mi cerebro en la nube.", 'puk-ia');
            console.error(error);
        }
    }

    agregarBurbujaChat(texto, clase) {
        const contenedor = document.getElementById('puk-mensajes');
        const div = document.createElement('div');
        div.className = `puk-mensaje ${clase}`;
        div.innerHTML = texto;

        const idUnico = 'msg-' + Date.now();
        div.id = idUnico;

        contenedor.appendChild(div);
        contenedor.scrollTop = contenedor.scrollHeight;

        return idUnico;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.appPukChat = new ChatFlotantePUK();
});
