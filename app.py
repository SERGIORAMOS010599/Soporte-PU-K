from flask import Flask, jsonify
import requests

app = Flask(__name__)

# Aquí pondremos la URL de tu Google Sheet más adelante
URL_APPS_SCRIPT = "TU_URL_AQUI"

@app.route('/')
def inicio():
    return "¡Servidor PU-K en línea! El motor de Python funciona perfecto."

if __name__ == '__main__':
    app.run(debug=True, port=5000)