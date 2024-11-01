
//import { UserModel } from '../models/user.js'

import request from 'request'

export class PaypalController {
    static paypal

    constructor () {
        
    }

    createPayment = (req, res) => {
        const CLIENT = 'AYZ-00wqpvaRHSD-elMNEDTeSjNbacIBidhT3kzhIYn_l4pbcni_cIvz-lit6ZMRThMlt17nnno_7OIO'
        const SECRET = 'EO0P4rGn2MeqNjaiD7qDghZ4VhiyARgqvZewX7zzT1dEitpnYe-gnts2pfTj6ImIxHKs_iY2BHf9kLFx'
        const PAYPAL_API = 'https://api-m.sandbox.paypal.com' //htps://api-m.paypal.com
        const auth = {user: CLIENT, pass: SECRET}

        const url = 'https://www.paypal.com/donate/?hosted_button_id=3THN79EWQHK2E'

        const body = {
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: '150'
                }
            }],
            application_context: {
                brand_name: `Fooball-Live`,
                landing_page: 'NO_PREFERENCE',
                user_action: 'PAY_NOW',
                return_url: `http://localhost:3001/footlive/execute-payment`,
                cancel_url: `http://localhost:3001/footlive/cancel-payment`
            }
        }

        request.post(`${PAYPAL_API}/v2/checkout/orders`, {
            auth,
            body,
            json: true
        }, (err, response) => {
            res.json({ data: response.body })
        })
    }
}