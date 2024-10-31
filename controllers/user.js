
import { UserModel } from '../models/user.js'

export class UserController {
    static userFootMob

    constructor () {
        this.userFootMob = new UserModel()
    }

    singin = (req, res) => {
        const data = 'Ingresando a la app'

        res.render('forum', { data: data })
    }
}