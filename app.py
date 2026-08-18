from flask import Flask, jsonify
import requests

app = Flask(__name__)

# Aquí pegas la URL exacta que te dio Google Apps Script
URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbwQtH2kJfqcZePWE7mbj-Vq17voBp-wL0xoMfvhHCxriw_WfHnIXVnDUgUrHrOFfi8/exec"

@app.route('/')
def inicio():
    return "¡Servidor PU-K en línea! Ve a /api/stock para ver los datos."

@app.route('/api/stock')
def obtener_stock():
    try:
        # Python consulta la API de tu Google Sheet
        respuesta = requests.get(URL_APPS_SCRIPT)
        
        if respuesta.status_code == 200:
            datos = respuesta.json()
            return jsonify(datos)
        else:
            return jsonify({"error": "No se pudo conectar con la base de datos"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, use_reloader=False, port=5000)
