import { FootMobModel } from '../models/footmob.js'
// import { MatchModel } from '../models/match.js'

import list_leagues from '../leagues.json' assert { type: "json" }

export class FootMobController {
  static footMob

  constructor ({ url }) {    
    this.footMob = new FootMobModel({ url })
  }

  isString = (input) => {
    return typeof input === 'string'
  }

  features = (req, res) => {
    const data = {}
    data.transfer = process.env.TRANSFER !== undefined ? Number(process.env.TRANSFER) : 1

    return res.json({ result: data })
  }

  getCountry = (name) => {
    if(this.footMob.getLang() === 'es'){
      let countries = {
        'Germany': 'Alemania',
        'Scotland': 'Escocia',
        'Hungary': 'Hungría',
        'Switzerland': 'Suiza',
        'Sweden': 'Suecia',
        'Spain': 'España',
        'Norway': 'Noruega',
        'Croatia': 'Croacia',
        'Italy': 'Italia',
        'Slovenia': 'Eslovenia',
        'Poland': 'Polonia',
        'Denmark': 'Dinamarca',
        'England': 'Inglaterra',
        'Netherlands': 'Países Bajos',
        'France': 'Francia',
        'Romania': 'Rumania',
        'Ukraine': 'Ucrania',
        'Belgium': 'Bélgica',
        'Slovakia': 'Eslovaquia',
        'Luxembourg': 'Luxemburgo',
        'Turkiye': 'Turquía',      
        'Czechia': 'Chequia',
        'Belarus': 'Bielorrusia',
        'Russia': 'Rusia',
        'Cyprus': 'Chipre',
        'Moldova': 'Moldavia',
        'Latvia': 'Letonia',
        'Lithuania': 'Lituania',
        'Faroe Islands': 'Islas Feroe',
        'Northern Ireland': 'Irlanda del Norte',
        'Bosnia and Herzegovina': 'Bosnia y Herzegovina',
        'North Macedonia': 'Macedonia del Norte',
        'Kazakhstan': 'Kazajistán',
        'Azerbaijan': 'Azerbaiyán',
        'USA': 'Estados Unidos',
        'Ireland': 'Irlanda',
        'Finland': 'Finlandia',
        'Iceland': 'Islandia',
        'Greece': 'Grecia',
        'Wales': 'Gales'
      };

      if(countries[name])
        name = countries[name]
      else
        name = name.split('/').map(country => countries[country] || country).join('/')
    }

    return name
  }
  
  index = async (req, res) => {
    let checks_ids = []
    let { fecha, checks } = req.body

    console.log(checks)
    if (this.isString(checks))
      checks = checks.split(',')

    checks.forEach((name) => { 
      console.log(name)
      let league = this.footMob.getAll({name})
      console.log(league)
      if(league.length)
        checks_ids.push(league[0].id)
    })    

    this.footMob.setFunction('matches')

    this.footMob.getRequest(fecha)
      .then(data => {
        // console.log('Datos recibidos:', data)
        
        const leagues = {}
        const codes = ['ENG', 'ESP', 'ITA', 'GER', 'FRA', 'INT', 'BRA', 'CHI', 'ARG']
        const favorites = ['Premier League', 'LaLiga', 'Serie A', 'Bundesliga', 'Ligue 1']
        const flags = { 'ENG': 'eng.png', 'ESP': 'esp.png', 'ITA': 'ita.png', 'GER': 'ger.png', 'FRA': 'fra.png', 'INT': 'int.png', 'BRA': 'bra.png', 'CHI': 'chi.png', 'ARG': 'arg.png' }
        const events = ['Champions League', 'Champions League Final Stage', 'Europa League', 'Europa League Final Stage', 'Copa America', 'Copa Libertadores']
        
        // console.log(data.date)
        data.leagues.forEach(async (league) => {                    
          if ((league.parentLeagueName && events.includes(league.parentLeagueName)) || events.includes(league.name) || (checks_ids.includes(league.primaryId) && codes.includes(league.ccode))) {
            let show = true
            if(events.includes(league.name)){              
              let event_name = league.name
              show = false              

              checks.forEach((check) => { 
                let find = event_name.includes(check)
                if(find){
                  show = true
                }
              })
            }
            else if(events.includes(league.parentLeagueName)){
              let event_name = league.parentLeagueName
              show = false
              
              checks.forEach((check) => { 
                let find = event_name.includes(check)
                if(find){
                  show = true
                }
              })
            }

            if(show){
              leagues[league.name] = { flag: flags[league.ccode], matches: [] }
              league.matches.forEach((match) => {
                leagues[league.name].matches.push({
                  home: this.getCountry(match.home.name),
                  homeid: match.home.id,
                  scorehome: match.home.score,
                  away: this.getCountry(match.away.name),
                  awayid: match.away.id,
                  scoreaway: match.away.score,
                  started: match.status.started,
                  finished: match.status.finished,
                  reason: match.status.reason ? match.status.reason.short : undefined,
                  time: match.status.liveTime ? match.status.liveTime.short : undefined,
                  score: match.status.scoreStr ? match.status.scoreStr : undefined,
                  start: match.status.startTimeStr ? match.status.startTimeStr : match.status.utcTime
                })
              })
            }
          }
        })
        
        return res.json({ result: leagues })
      })
      .catch(error => {
        console.error('Error:', error)
      })
    // res.json({'message': 'Bienvenido'})
  }

  view = async (req, res) => {
    const base_url = "https://www.fotmob.com/"
    let { url } = req.body
    const data = {}

    if(url){
      if (!url.includes('http:') && !url.includes('https:')) {
        url = base_url + url
      }

      try {
          const response = await this.footMob.getRequestPage(url)
          data.url = response
      } catch (error) {
          console.error('Error:', error)
      }
    } else {
        try {
            this.footMob.setFunction('trendingnews')

            const resp = await this.footMob.getRequest()
            data.urls = []

            let count = 0
            for (const news of resp) {
                let url = news.page.url

                if (!url.includes('http:') && !url.includes('https:')) {
                    url = base_url + url
                }

                try {
                    const response = await this.footMob.getRequestPage(url)
                    data.urls.push(response)
                    //console.log(response)
                    if(!count)
                      data.url = response
                    count++
                } catch (error) {
                    console.error('Error:', error)
                }
            }
        } catch (error) {
            console.error('Error:', error)
        }
    }

    res.render('view', { data: data })
  }

  getDateToday = (hoursToAddOrSubtract = 0) => {
    // Obtener la fecha actual
    var today = new Date();

    // Sumar o restar horas
    today.setHours(today.getHours() - hoursToAddOrSubtract);

    // Obtener el año, mes y día
    var ano = today.getFullYear();
    var mes = ('0' + (today.getMonth() + 1)).slice(-2); // Agregar 1 ya que los meses van de 0 a 11
    var dia = ('0' + today.getDate()).slice(-2);

    // Formatear la fecha en "Y-m-d"
    var todayFormat = ano + '-' + mes + '-' + dia;

    return todayFormat;
  }

  convertToDate = (event) => {
    let hora = event.attributes.diary_hour
    let [hour, minute, second] = hora.split(':')
    return new Date(0, 0, 0, hour, minute, second)
  }

  matches = async (req, res) => {
    const base_urlTR = "https://www.tarjetarojaenvivo.nl/"
    const base_urlPE = "https://futbollibretv.pe/"
    const base_url = "https://www.elitegoltv.org/"
    const data = {}

    try {
      data.matches = []
      //data.matchesTR = []
      data.matchesPE = []
      const matches_today = []

      const response = await this.footMob.getMatches(base_url + 'home.php')
      
      // Obtener todos los elementos li dentro del ul
      const menuItems = response.querySelectorAll('ul.menu > li')
      
      // Iterar sobre los elementos li e imprimir su contenido
      // let index = 0
      for (var item of menuItems) {
        const match = []
        
        match.country = item.className
        // Obtener el nombre del partido
        const linkText = item.querySelector('a').textContent.trim()
        // Eliminar el texto de la hora del nombre del partido
        if(item.querySelector('span.t')){
          match.name = linkText.replace(item.querySelector('span.t').textContent.trim(), '')
          match.time = item.querySelector('span.t').textContent.trim()
          
          //matches_today.push(match.name)

          /*
          let name = match.name
          
          const match_today = MatchModel.getAll({ name })
          const today = this.getDateToday()

          if(match_today.length > 0 && match_today[0].date !== today){
            //retornar vacio
            data.matches = []
            break
          }
          else if (match_today.length == 0 && index == 0){
            const input = []
            input.name = name
            input.date = today

            MatchModel.deleteAll()

            const newmatch = MatchModel.create({ input: input })
            console.log(newmatch)
          }
          else{
            console.log(match_today)
            console.log('longitud:' + match_today.length)
          }*/
          
          match.channels = []
          // Obtener los canales de transmisión del partido
          const subItems = item.querySelectorAll('ul li.subitem1')
          subItems.forEach(subItem => {
            const channel = []
            // Obtener la URL del canal de transmisión
            let url_chanel = subItem.querySelector('a').getAttribute('href')

            if (!url_chanel.includes('http') && !url_chanel.includes('https')) {
              url_chanel = base_url + url_chanel
            }

            channel.url = url_chanel
            // Obtener el nombre del canal de transmisión
            channel.name = subItem.querySelector('a').textContent.trim()
            // Agregar el canal al arreglo de canales del partido
            match.channels.push(channel)
          })

          data.matches.push(match)
          // index++
        }
      }

      if(data.matches.length == 0){
        const responseTR = await this.footMob.getMatches(base_urlTR)
        
        // Obtener todos los elementos li dentro del ul
        const menuItemsTR = responseTR.querySelectorAll('ul.menu > li')
        
        // Iterar sobre los elementos li e imprimir su contenido
        // let index = 0
        for (var item of menuItemsTR) {
          const match = []
          
          match.country = item.className
          // Obtener el nombre del partido
          const linkText = item.querySelector('a').textContent.trim()
          // Eliminar el texto de la hora del nombre del partido
          if(item.querySelector('span.t')){
            match.name = linkText.replace(item.querySelector('span.t').textContent.trim(), '')
            match.time = item.querySelector('span.t').textContent.trim()
            
            match.channels = []
            // Obtener los canales de transmisión del partido
            const subItems = item.querySelectorAll('ul li.subitem1')
            subItems.forEach(subItem => {
              const channel = []
              // Obtener la URL del canal de transmisión
              let url_chanel = subItem.querySelector('a').getAttribute('href')

              if (!url_chanel.includes('http') && !url_chanel.includes('https')) {
                url_chanel = base_url + url_chanel
              }

              channel.url = url_chanel
              // Obtener el nombre del canal de transmisión
              channel.name = subItem.querySelector('a').textContent.trim()
              // Agregar el canal al arreglo de canales del partido
              match.channels.push(channel)
            })

            data.matches.push(match)
          }
        }
      }

      try {
        const url_pe = 'https://futbollibretv.pe/agenda.json'
        const url_img = 'https://img.futbollibretv.pe'
        /*
        const url_pe = 'https://futbollibrehd.pe/agenda.json'
        const url_img = 'https://img.futbollibrehd.pe'
        */

        const resp_pe = await this.footMob.getRequestPageJson(url_pe)

        //console.log(resp_pe)
        let find = 0
        if(resp_pe && resp_pe.data){
          resp_pe.data.sort((a, b) => {
            let dateA = this.convertToDate(a)
            let dateB = this.convertToDate(b)
            return dateA - dateB
          })
          
          resp_pe.data.forEach(async (item) => {
            const match = []
            
            match.name = item.attributes.diary_description.replace('vs.', 'vs')
            match.time = item.attributes.diary_hour.split(':').slice(0, 2).join(':')
            match.flag = url_img + item.attributes.country.data.attributes.image.data.attributes.url

            //if(matches_today.includes(match.name))
              //find = 1

            match.channels = []

            item.attributes.embeds.data.forEach(subItem => {
              const channel = []

              let url_chanel = subItem.attributes.embed_iframe

              if (url_chanel && url_chanel.includes('embed')) {
                channel.name = subItem.attributes.embed_name
                channel.url = base_urlPE + url_chanel
                match.channels.push(channel)
              }
            })

            data.matchesPE.push(match)
          })
        }
      }
      catch (error) {
        // Manejo del error
        console.error('An error occurred');
      }

      //if(!find)
        //data.matches = []
      
      res.render('index', { data: data })
    } catch (error) {
        console.error('Error:', error)
    }
  }

  transfers = async (req, res) => {
    const url = 'https://www.fotmob.com/api/transfers'

    const resp = await this.footMob.getRequestPageJson(url)

    return res.json({ result: resp })
  }

  leagues = async (req, res) => {
    const { lang } = req.params
    
    this.footMob.setLang(lang)

    return res.json({ result: list_leagues })
  }

  trendingnews = async (req, res) => {
    const data = {}
    res.render('news', { data: data })
  }

  extension = async (req, res) => {
    const data = {}
    res.render('extension', { data: data })
  }

  news = async (req, res) => {
    const { lang } = req.params
    
    this.footMob.setLang(lang)
      this.footMob.setFunction('trendingnews')

    this.footMob.getRequest()
      .then(data => {
        if(data.length)
          return res.json({ result: data })
        else{
          console.log('entre')
          this.footMob.setFunction('worldnews')

          this.footMob.getRequest()
            .then(data => {
                return res.json({ result: data })
            })
            .catch(error => {
              console.error('Error:', error)
            })
        }
      })
      .catch(error => {
        console.error('Error:', error)
      })
    }
}
