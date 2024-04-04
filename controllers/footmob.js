import { FootMobModel } from '../models/footmob.js'

export class FootMobController {
  static footMob

  constructor ({ url }) {
    this.footMob = new FootMobModel({ url });
  }
  
  index = async (req, res) => {
    const { fecha } = req.body
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
          let x = 0;
          if ((league.parentLeagueName && events.includes(league.parentLeagueName)) || events.includes(league.name) || (favorites.includes(league.name) && codes.includes(league.ccode))) {
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
              x++
            })
          }
        })
        
        return res.json({ result: leagues })
      })
      .catch(error => {
        console.error('Error:', error);
      });
    // res.json({'message': 'Bienvenido'})
  }

}
