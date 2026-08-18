from flask import Flask, jsonify
import requests

app = Flask(__name__)

URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbwQtH2kJfqcZePWE7mbj-Vq17voBp-wL0xoMfvhHCxriw_WfHnIXVnDUgUrHrOFfi8/exec"

def obtener_datos(nombre_hoja):
    try:
        # Le pegamos el parámetro '?hoja=' al final de la URL
        respuesta = requests.get(f"{URL_APPS_SCRIPT}?hoja={nombre_hoja}")
        if respuesta.status_code == 200:
            return jsonify(respuesta.json())
        return jsonify({"error": f"No se pudo leer la hoja {nombre_hoja}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/')
def inicio():
    return "¡Servidor PU-K en línea! Rutas: /api/salidas, /api/lineas, /api/sensores"

# Tubería 1: Salidas
@app.route('/api/salidas')
def salidas():
    return obtener_datos("salidas")

# Tubería 2: Líneas Nuevas
@app.route('/api/lineas')
def lineas():
    return obtener_datos("lineas nuevas")

# Tubería 3: Sensores
@app.route('/api/sensores')
def sensores():
    return obtener_datos("sensroesFyTm")

if __name__ == '__main__':
    app.run(debug=True, use_reloader=False, port=5000)
