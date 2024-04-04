import fetch from 'node-fetch'

export class FootMobModel {
  constructor({ url }) {
    this.requestOptions = {
      method: 'GET', // Método de solicitud (GET en este caso)
      headers: {
        'Content-Type': 'application/json', // Tipo de contenido de la solicitud
      },
    };

    this.url = url;
  }

  async getRequest(fecha) {
    try {
      // console.log(fecha)
      const url = this.url + '&date=' + fecha
      // Hacer la solicitud HTTP
      const response = await fetch(url, this.requestOptions);

      // Verificar si la respuesta fue exitosa
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Convertir la respuesta a JSON
      const data = await response.json();

      return data;
    } catch (error) {
      // Manejar errores de la solicitud
      console.error('Error en la solicitud:', error);
      throw error;
    }
  }
}