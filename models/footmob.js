import fetch from 'node-fetch'

export class FootMobModel {
  static function
  static timezone
  static ccode
  static lang

  constructor({ url }) {
    this.requestOptions = {
      method: 'GET', // Método de solicitud (GET en este caso)
      headers: {
        'Content-Type': 'application/json', // Tipo de contenido de la solicitud
      },
    };

    this.url = url

    // Por defecto el idioma español
    this.lang = 'es'

    this.setFunction('mylocation')

    this.getRequest().then(location => {
      this.timezone = location.timezone
      this.ccode = location.ccode3
    })
  }

  setFunction = async (func) => {
    this.function = func
  }

  setLang = async (lg) => {
    this.lang = lg
  }

  getRequest = async (fecha='') => {
    try {
      // console.log(fecha)
      const url = this.url + this.function + '?ccode3=' + this.ccode + '&lang=' + this.lang + ((fecha) ? '&timezone=' + this.timezone + '&date=' + fecha : '')
      console.log(url)
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