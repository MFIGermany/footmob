import { readJSON } from '../utils.js'
import fetch from 'node-fetch'
import { JSDOM } from 'jsdom'
import dotenv from 'dotenv'

dotenv.config({ path: './.env' })

const leagues = await readJSON('./leagues.json')

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
        'x-fm-req': process.env.XFMREQ
      },
    }

    this.requestOptionsPage = {
      method: 'GET', // Método de solicitud (GET en este caso)
      headers: {
        'Content-Type': 'application/json'
      },
    }

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

  getLang = () => {
    return this.lang
  }

  getAll = ({ name }) => {
    if (name) {
      return leagues.filter(
        league => league.name.toLowerCase() === name.toLowerCase()
      )
    }

    return leagues
  }
  /*
  checkSite = (url) => {
    console.log(url)
    const client = url.startsWith('https') ? https : http
  
    const req = client.get(url, (res) => {
      console.log(`Status Code: ${res.statusCode}`)
      if (res.statusCode == 200) {
        return true
      } else {
        return false
      }
    })
  
    req.on('error', (err) => {
      return false
    })
  }*/

  getRequest = async (fecha='') => {
    try {
      // console.log(fecha)
      const url = this.url + this.function + '?ccode3=' + this.ccode + '&lang=' + this.lang + ((fecha) ? '&timezone=' + this.timezone + '&date=' + fecha : '')
      //console.log(url)
      // Hacer la solicitud HTTP
      const response = await fetch(url, this.requestOptions)

      // Verificar si la respuesta fue exitosa
      if (!response.ok) {
        console.log(url)
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      // Convertir la respuesta a JSON
      const data = await response.json()

      return data
    } catch (error) {
      // Manejar errores de la solicitud
      console.error('Error en la solicitud:', error)
      throw error
    }
  }

  getRequestPage = async (url) => {
    try {
      console.log(url)
      // Hacer la solicitud HTTP
      const response = await fetch(url)

      // Verificar si la respuesta fue exitosa
      if (!response.ok) {
        throw new Error('Error al obtener la página')
      }

      // Leer el contenido HTML de la respuesta
      const html = await response.text()

      // Crear un objeto DOM simulado con jsdom
      const dom = new JSDOM(html)

      // Obtener el documento y el objeto window del DOM
      const document = dom.window.document

      // Buscar el elemento meta con el atributo name="canonicalUrl"
      const linkElement  = document.querySelector('link[rel="canonical"]')

      if (linkElement) {
        const href = linkElement.getAttribute('href')
        return href
      } else {
          throw new Error('No se encontró la URL en la página')
      }
    } catch (error) {
      // Manejar errores de la solicitud
      console.error('Error en la solicitud:', error)
      throw error
    }
  }

  getRequestPageJson = async (url, opt=0) => {
    try {
      // Hacer la solicitud HTTP
      console.log(url)
      const response = await fetch(url, (opt) ? this.requestOptions : this.requestOptionsPage)

      // Verificar si la respuesta fue exitosa
      if (!response.ok) {
        throw new Error('Error al obtener la página')
      }

      return response.json()
    } catch (error) {
      // Manejar errores de la solicitud
      throw new Error('Error en la solicitud: '. error)
    }
  }

  getMatches = async (url) => {
    try {
      //let url = "https://www.elitegoltv.org/home.php"
      // Hacer la solicitud HTTP
      const response = await fetch(url)

      // Verificar si la respuesta fue exitosa
      if (!response.ok) {
        return false
        //throw new Error('Error al obtener la página')
      }

      // Leer el contenido HTML de la respuesta
      const html = await response.text()

      // Crear un objeto DOM simulado con jsdom
      const dom = new JSDOM(html)

      // Obtener el documento y el objeto window del DOM
      const document = dom.window.document

      // Buscar el elemento meta con el atributo name="canonicalUrl"
      const menu = document.querySelector('ul.menu')

      if (menu) {
        return menu          
      } else {
          console.log('No se encontró ningún elemento <ul> con la clase "menu"')
      }
    } catch (error) {
      // Manejar errores de la solicitud
      console.error('Error en la solicitud:', error)
      throw error
    }
  }
  
  str_replace = async (search, replace, str) => {
    return str.replace(new RegExp(search, 'g'), replace)
  }
  
  getShortUrl = async (longUrl) => {
    const apiToken = 'bae820bb5d932c409f82abd67'

    if(!longUrl.includes('http') && !longUrl.includes('https')){
      const base_url = await this.str_replace('api/', '', this.url)
      longUrl = base_url + this.lang + longUrl
    }

    const apiUrl = `https://api.cuty.io/quick?token=${apiToken}&url=${encodeURIComponent(longUrl)}&alias=CustomAlias`

    try {
        // Hacer la solicitud HTTP
        const response = await fetch(apiUrl, this.requestOptions)

        // Verificar si la respuesta fue exitosa
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        // Convertir la respuesta a JSON
        const data = await response.json()

        if(data.success === true) {
          return data.short_url
        }
        else{
          console.log(data.message)
          return longUrl
        }
    } catch (error) {
      // Manejar errores de la solicitud
      console.error('Error en la solicitud:', error)
      throw error
    }
  }

}