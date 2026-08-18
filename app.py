from flask import Flask, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app) # <-- ¡ESTE ES EL PASE VIP PARA GITHUB!

URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbwQtH2kJfqcZePWE7mbj-Vq17voBp-wL0xoMfvhHCxriw_WfHnIXVnDUgUrHrOFfi8/exec"

def obtener_datos(nombre_hoja):
    try:
        respuesta = requests.get(f"{URL_APPS_SCRIPT}?hoja={nombre_hoja}")
        if respuesta.status_code == 200:
            return jsonify(respuesta.json())
        return jsonify({"error": f"No se pudo leer la hoja {nombre_hoja}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/')
def inicio():
    return "¡Servidor PU-K en línea! Rutas: /api/salidas, /api/lineas, /api/sensores"

@app.route('/api/salidas')
def salidas():
    return obtener_datos("salidas")

@app.route('/api/lineas')
def lineas():
    return obtener_datos("lineas nuevas")

@app.route('/api/sensores')
def sensores():
    return obtener_datos("sensroesFyTm")

if __name__ == '__main__':
    app.run(debug=True, use_reloader=False, port=5000)
