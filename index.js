import axios from 'axios';
import {wrapper} from 'axios-cookiejar-support';
import {CookieJar} from 'tough-cookie';
import * as cheerio from 'cheerio';
import fs from 'fs';

const jar = new CookieJar();
const client = wrapper(axios.create({jar}));

const username = 'server111111';
const password = 'pass';
const domain = 'example.com';
const cert_path = `.acme.sh/${domain}/`

const cert = fs.readFileSync(cert_path + domain + '.cer','utf8');
const key = fs.readFileSync(cert_path + domain + '.key','utf8');

(async function () {
    try {
        console.log('Getting _csrf_token from login screen')
        const token = await client.get('https://admin.nazwa.pl/', {

        }).then(({data, config}) => {
            console.log('Success!')
            const $ = cheerio.load(data); // Initialize cheerio
            return $('input[name^=_csrf_token]').attr('value');
        })
        .catch(error => {
            console.error('Error getting _csrf_token token ' + error)
        })

        console.log('_csrf_token: ' + token)

        const loginParams = new URLSearchParams()
        loginParams.append('username', username);
        loginParams.append('password', password);
        loginParams.append('_csrf_token', token);

        console.log('Login to admin panel')
        await client.post(
            'https://admin.nazwa.pl/',
            loginParams,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        )
        .then(() => {
            console.log('Logged in')
        })
        .catch(error => {
            throw 'Login failed, did you put the right credentials? ' + error
        })

        console.log('Find domain add/update url');
        const certPath = await client.get(
            'https://admin.nazwa.pl/ssl/list'
        )
            .then(({data}) => {
                const $ = cheerio.load(data); // Initialize cheerio
                const items = $('.col.py-md-1').toArray();
                for(let i = 0; i < items.length; i++){
                    const el = items[i];
                    const rowString = $(el).html()
                    console.log('Checking: ' + rowString.trim())
                    if (rowString.trim() === domain) {
                        console.log('Match!')
                        return $(el).next().next().find('a').attr('href')
                    } else {
                        console.log('Not this one')
                    }

                }
                console.log('Not found, add a new one')
                return '/ssl/add'
            })
            .catch(error => {
                throw 'Getting domains failed ' + error
            })

        const fullUrl = 'https://admin.nazwa.pl' + certPath
        console.log('Getting form token on ' + fullUrl)

        const ssl_token = await client.get(fullUrl).then(({data}) => {
            const $ = cheerio.load(data); // Initialize cheerio
            const token = $('#add_ssl_form__token').attr('value');
            console.log('Success! ' + token)
            return token
        })
        .catch(error => {
            console.error('Error getting form token ' + error)
        })

        const certParams = new URLSearchParams()
        certParams.append('add_ssl_form[_token]', ssl_token);
        certParams.append('add_ssl_form[certificate]', cert);
        certParams.append('add_ssl_form[privateKey]', key);

        console.log('Sending new certificate')
        await client.post(fullUrl,
            certParams,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        )
        .then(({data}) => {
            const $ = cheerio.load(data); // Initialize cheerio
            const errorMessage = $('.flash-message.error');
            if (errorMessage && errorMessage.length) {
                console.log('Error!' + errorMessage.html())
            }
            const successMessage = $('.flash-message.success');
            if (successMessage && successMessage.length) {
                console.log('Success!' + successMessage.html())
            }
        })
        .catch(error => {
            throw 'Change failed' + error
        })

    } catch (e) {
        console.error(e)
    }
})()
