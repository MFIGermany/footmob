import { FootMobModel } from '../models/footmob.js'

import list_leagues from '../leagues.json' assert { type: "json" }

export class FootMobController {
  static footMob

  constructor ({ url }) {    
    this.footMob = new FootMobModel({ url });
  }
  
  index = async (req, res) => {
    const { fecha, checks } = req.body

    this.footMob.setFunction('matches')

    this.footMob.getRequest(fecha)
      .then(data => {
        // console.log('Datos recibidos:', data);
        
        const leagues = {}
        const codes = ['ENG', 'ESP', 'ITA', 'GER', 'FRA']
        const favorites = ['Premier League', 'LaLiga', 'Serie A', 'Bundesliga', 'Ligue 1']
        const events = ['Champions League', 'Champions League Final Stage', 'Europa League', 'Europa League Final Stage']
        const flags = { 'ENG': 'eng.png', 'ESP': 'esp.png', 'ITA': 'ita.png', 'GER': 'ger.png', 'FRA': 'fra.png', 'INT': 'int.png' }
        
        // console.log(data.date)
        data.leagues.forEach(async (league) => { 
          //if ((league.parentLeagueName && events.includes(league.parentLeagueName)) || events.includes(league.name) || (favorites.includes(league.name) && codes.includes(league.ccode))) {
          if ((league.parentLeagueName && events.includes(league.parentLeagueName)) || events.includes(league.name) || (checks.includes(league.name) && codes.includes(league.ccode))) {
            let show = true
            if(events.includes(league.name)){
              let event_name = league.name
              show = false
              
              checks.forEach((check) => { 
                let find = event_name.includes(check)
                if(find){
                  //console.log(check)
                  show = true
                }
              })

              // console.log('--->' + show)
            }

            if(show){
              leagues[league.name] = { flag: flags[league.ccode], matches: [] };
              league.matches.forEach((match) => {
                leagues[league.name].matches.push({
                  home: match.home.name,
                  homeid: match.home.id,
                  scorehome: match.home.score,
                  away: match.away.name,
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
        console.error('Error:', error);
      });
    // res.json({'message': 'Bienvenido'})
  }

  leagues = async (req, res) => {
    const { lang } = req.params
    
    this.footMob.setLang(lang)

    return res.json({ result: list_leagues })
  }

  news = async (req, res) => {
    
    this.footMob.setFunction('trendingnews')

    this.footMob.getRequest()
      .then(data => {
        //console.log(data)
        return res.json({ result: data })
      })
      .catch(error => {
        console.error('Error:', error);
      }); 
  }

}
