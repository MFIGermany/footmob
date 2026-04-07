import { FootMobModel } from '../models/footmob.js'
import { UserModel } from '../models/user.js'
// import { MatchModel } from '../models/match.js'
//import list_leagues from '../leagues.json' assert { type: "json" }

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const leaguesPath = path.join(__dirname, '../leagues.json');
const list_leagues = JSON.parse(fs.readFileSync(leaguesPath, 'utf-8'));


export class FootMobController {
  static userFootMob
  static footMob

  constructor ({ url }) {
    this.footMob = new FootMobModel({ url })
    this.userFootMob = new UserModel()
  }

  isString = (input) => {
    return typeof input === 'string'
  }

  features = (req, res) => {
    const data = {}
    data.transfer = process.env.TRANSFER !== undefined ? Number(process.env.TRANSFER) : 1

    return res.json({ result: data })
  }

  normalizeTeamName(value = '') {
    return String(value)
      .trim()
      .toLowerCase()
  }

  reverseCountryMap = (name) => {
    if(this.footMob.getLang() === 'es'){
      let countries = {
        'Alemania': 'Germany',
        'Escocia': 'Scotland',
        'Hungría': 'Hungary',
        'Suiza': 'Switzerland',
        'Suecia': 'Sweden',
        'España': 'Spain',
        'Noruega': 'Norway',
        'Croacia': 'Croatia',
        'Italia': 'Italy',
        'Eslovenia': 'Slovenia',
        'Polonia': 'Poland',
        'Dinamarca': 'Denmark',
        'Inglaterra': 'England',
        'Países Bajos': 'Netherlands',
        'Francia': 'France',
        'Rumania': 'Romania',
        'Ucrania': 'Ukraine',
        'Bélgica': 'Belgium',
        'Eslovaquia': 'Slovakia',
        'Luxemburgo': 'Luxembourg',
        'Turquía': 'Turkiye',
        'Chequia': 'Czechia',
        'Bielorrusia': 'Belarus',
        'Rusia': 'Russia',
        'Chipre': 'Cyprus',
        'Moldavia': 'Moldova',
        'Letonia': 'Latvia',
        'Lituania': 'Lithuania',
        'Islas Feroe': 'Faroe Islands',
        'Irlanda del Norte': 'Northern Ireland',
        'Bosnia y Herzegovina': 'Bosnia and Herzegovina',
        'Macedonia del Norte': 'North Macedonia',
        'Kazajistán': 'Kazakhstan',
        'Azerbaiyán': 'Azerbaijan',
        'Estados Unidos': 'USA',
        'Irlanda': 'Ireland',
        'Finlandia': 'Finland',
        'Islandia': 'Iceland',
        'Grecia': 'Greece',
        'Gales': 'Wales'
      };

      if(countries[name])
        name = countries[name]
      else
        name = name.split('/').map(country => countries[country] || country).join('/')
    }

    return name
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

  isMore5mAgo = (date) => {
    const now = new Date() // Fecha y hora actual
    const past = new Date(date) // Fecha pasada para comparar
    const differenceInMilliseconds = now - past // Diferencia en milisegundos
  
    // Cinco minutos en milisegundos: 5 * 60 * 1000
    return differenceInMilliseconds > 5 * 60 * 1000
  }

  getTodayYmd = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}${month}${day}`;
  }

  liveFavorites = async (req, res) => {
    try {
      const fecha = this.getTodayYmd()
      const rawTeams = String(req.query.teams || '').trim()

      if (!rawTeams) {
        return res.status(400).json({
          ok: false,
          error: 'teams requerido'
        })
      }

      const teams = rawTeams
        .split(',')
        .map(team => this.reverseCountryMap(team))
        .map(team => this.normalizeTeamName(team))
        .filter(Boolean)

      if (!teams.length) {
        return res.status(400).json({
          ok: false,
          error: 'No se recibieron equipos válidos'
        })
      }

      this.footMob.setFunction('data/matches')

      const data = await this.footMob.getRequest(fecha)
      const liveMatches = []

      const leagues = Array.isArray(data?.leagues) ? data.leagues : []

      leagues.forEach((league) => {
        const matches = Array.isArray(league?.matches) ? league.matches : []

        matches.forEach((match) => {
          const homeName = match?.home?.name || ''
          const awayName = match?.away?.name || ''

          const normalizedHome = this.normalizeTeamName(homeName)
          const normalizedAway = this.normalizeTeamName(awayName)

          const isFavoriteMatch =
            teams.includes(normalizedHome) ||
            teams.includes(normalizedAway)

          const isLive =
            Boolean(match?.status?.started) &&
            !Boolean(match?.status?.finished) &&
            !Boolean(match?.status?.cancelled)

          if (!isFavoriteMatch || !isLive) {
            return
          }

          liveMatches.push({
            key: `${normalizedHome}__${normalizedAway}__${match?.status?.utcTime || match?.timeTS || ''}`,
            matchId: match?.id || null,
            leagueId: match?.leagueId || null,
            leagueName: league?.name || '',
            home: this.getCountry(homeName),
            away: this.getCountry(awayName),
            homeId: match?.home?.id || null,
            awayId: match?.away?.id || null,
            scorehome: Number(match?.home?.score || 0),
            scoreaway: Number(match?.away?.score || 0),
            scoreStr: match?.status?.scoreStr || `${Number(match?.home?.score || 0)} - ${Number(match?.away?.score || 0)}`,
            time: match?.status?.reason?.short || '',
            utcTime: match?.status?.utcTime || null,
            start: match?.status?.utcTime || null,
            timeTS: match?.timeTS || null,
            started: Boolean(match?.status?.started),
            finished: Boolean(match?.status?.finished),
            cancelled: Boolean(match?.status?.cancelled)
          })
        })
      })

      return res.json({
        ok: true,
        matches: liveMatches
      })
    } catch (error) {
      console.error('Error en /favorites/live:', error)
      return res.status(500).json({
        ok: false,
        error: 'No se pudieron obtener los partidos en vivo'
      })
    }
  }
  
  index = async (req, res) => {
    let checks_ids = []
    let { fecha, checks } = req.body

    //console.log(checks)
    if (this.isString(checks))
      checks = checks.split(',')

    //console.log(checks)
    checks.forEach((name) => { 
      //console.log(name)
      let league = this.footMob.getAll({name})
      //console.log(league)
      if(league.length)
        checks_ids.push(league[0].id)
    })

    this.footMob.setFunction('data/matches')

    this.footMob.getRequest(fecha)
      .then(data => {
        //console.log('Datos recibidos:', data)
        
        const leagues = {}
        const interns = ['UEFA Nations League', 'World Cup Qualification']
        const codes = ['ENG', 'ESP', 'ITA', 'GER', 'FRA', 'INT', 'BRA', 'CHI', 'ARG', 'USA']
        const favorites = ['Premier League', 'LaLiga', 'Serie A', 'Bundesliga', 'Ligue 1']
        const flags = { 'ENG': 'eng.png', 'ESP': 'esp.png', 'ITA': 'ita.png', 'GER': 'ger.png', 'FRA': 'fra.png', 'INT': 'int.png', 'BRA': 'bra.png', 'CHI': 'chi.png', 'ARG': 'arg.png', 'USA': 'usa.png' }
        const events = ['Champions League', 'Champions League Final Stage', 'Europa League', 'Europa League Final Stage', 'Copa America', 'Copa Libertadores']
        
        if(data){
          data.leagues.forEach(async (league) => {
            if(league.primaryId == 130)
              console.log(league.matches)
            let find_event = false
            league.name = (league.name == 'Serie A' && league.primaryId == 268) ? league.name + ' ' : league.name
            interns.forEach((event) =>{
              if(league.name.includes(event) && !league.name.includes('AFC') && !league.name.includes('OFC')){
                find_event = true
              }
            })
            if ((league.parentLeagueName && events.includes(league.parentLeagueName)) || events.includes(league.name) || (checks_ids.includes(league.primaryId) && codes.includes(league.ccode)) || find_event) {
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
                //console.log(league.matches)
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
        }
        //console.log(leagues)
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
    //console.log(event)
    let hora = event.attributes.diary_hour
    if(hora) {
      let [hour, minute, second] = hora.split(':')
      return new Date(0, 0, 0, hour, minute, second)
    }
    else
      return false
  }

  matches = async (req, res) => {
    const data = {}
    
    res.render('index', { data: data })
  }

  transfers = async (req, res) => {
    const url = 'https://www.fotmob.com/api/data/transfers'

    const resp = await this.footMob.getRequestPageJson(url, 1)

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

  politica = async (req, res) => {
    const data = {}
    res.render('politica', { data: data })
  }

  monero = async (req, res) => {
    const data = {}
    res.render('monero', { data: data })
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

  contribution = async (req, res) => {
    const data = {}

    const CLIENT = 'AYZ-00wqpvaRHSD-elMNEDTeSjNbacIBidhT3kzhIYn_l4pbcni_cIvz-lit6ZMRThMlt17nnno_7OIO'
    const SECRET = 'EO0P4rGn2MeqNjaiD7qDghZ4VhiyARgqvZewX7zzT1dEitpnYe-gnts2pfTj6ImIxHKs_iY2BHf9kLFx'
    const PAYPAL_API = 'https://api-m.sandbox.paypal.com' //htps://api-m.paypal.com
    const auth = {user: CLIENT, pass: SECRET}

    const url = 'https://www.paypal.com/donate/?hosted_button_id=3THN79EWQHK2E'

    /*
    try {
      const response = await axios.get(url)
      data.content_paypal = response.data
      
      res.render('contribution', { data: data })
    } catch (error) {
        console.error('Error al cargar la página externa:', error);
        res.render('pagina', { content: 'No se pudo cargar el contenido' });
    }*/
    res.render('contribution', { data: data })
  }
}
