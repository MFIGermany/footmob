
import { UserModel } from '../models/user.js'
import dotenv from 'dotenv'

dotenv.config({ path: './.env' })

export class UserController {
    static userFootMob

    constructor () {
        this.userFootMob = new UserModel()
    }

    isNextDayOrLater = (targetDateString) => {
        // Obtener la fecha actual y la fecha objetivo
        const today = new Date()
        const targetDate = new Date(targetDateString)
      
        // Resetear las horas para comparar solo el año, mes y día
        today.setHours(0, 0, 0, 0)
        targetDate.setHours(0, 0, 0, 0)
      
        // Comparar si la fecha actual es igual o mayor a la fecha objetivo
        return today > targetDate
    }

    sumarSatoshis = (a, b) => {
        // Convertir los montos a satoshis (enteros)
        const satoshisA = Math.round(a * 1e12);
        const satoshisB = Math.round(b * 1e12);
      
        // Realizar la suma
        const totalSatoshis = satoshisA + satoshisB;
      
        // Convertir de vuelta a Monero
        return totalSatoshis / 1e12;
    }

    formatDateForMySQL = (date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0") // Meses comienzan desde 0
        const day = String(date.getDate()).padStart(2, "0")
        const hours = String(date.getHours()).padStart(2, "0")
        const minutes = String(date.getMinutes()).padStart(2, "0")
        const seconds = String(date.getSeconds()).padStart(2, "0")
      
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    }

    singin = async (req, res) => {
        const profile = req.user

        const googleId = profile.id
        const name = profile.displayName
        const email = profile.emails[0].value

        try {
            // Verifica si el usuario ya existe
            let user = await this.userFootMob.getUserById(googleId);
            //console.log(user)
            if (!user) {
                // Si no existe, crea uno nuevo
                this.userFootMob.createUser(googleId, name, email);
            }

            if(user){
                // Comparar fechas
                if(!user.login_day || this.isNextDayOrLater(user.login_day)){
                    const monto = 0.00000100
                    const resultado = this.sumarSatoshis(user.balance, monto)

                    user.balance = resultado.toFixed(8)

                    console.log(user)

                    this.userFootMob.updateBalance(user.id, user.balance)

                    const today = new Date()
                    const fechaMySQL = this.formatDateForMySQL(today)

                    this.userFootMob.updateFechaLogin(user.id, fechaMySQL)
                }

                req.session.user = { id: profile.id, name: profile.displayName, balance: user.balance }
            }
            else
                req.session.user = { id: profile.id, name: profile.displayName, balance: '0.00000100' }

            console.log(req.session.user)

            res.redirect('/footlive')
        } catch (error) {
            throw new Error('Error al manejar el inicio de sesión con Google: ' + error.message)
        }
    }

    recaptcha = async (req, res) => {
        const { token } = req.body
      
        // Datos a enviar a la API de Google reCAPTCHA
        const params = new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token,
        }).toString()
      
        // Configurar la petición HTTPS
        const options = {
          hostname: 'www.google.com',
          path: `/recaptcha/api/siteverify?${params}`,
          method: 'POST',
        }
      
        const request = https.request(options, (response) => {
          let data = ''
      
          // Recibir datos en fragmentos
          response.on('data', (chunk) => {
            data += chunk;
          })
      
          // Procesar los datos recibidos
          response.on('end', () => {
            const result = JSON.parse(data);
      
            if (result.success) {
              return res.json({ success: true, message: 'reCAPTCHA validado correctamente' })
            } else {
              return res.status(400).json({ success: false, message: 'Fallo en reCAPTCHA' })
            }
          })
        })
      
        // Manejar errores en la petición
        request.on('error', (error) => {
          console.error('Error al verificar el reCAPTCHA:', error)
          return res.status(500).json({ success: false, message: 'Error en el servidor' })
        })
      
        request.end()
    }
}