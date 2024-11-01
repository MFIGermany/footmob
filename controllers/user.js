
import { UserModel } from '../models/user.js'

export class UserController {
    static userFootMob

    constructor () {
        this.userFootMob = new UserModel()
    }

    singin = (req, res) => {
        const data = {}
        data.success_msg = 'Probando mensaje'
        
        res.render('forum', { data: data })
    }
}