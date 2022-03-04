# nazwapl-ssl
Update SSL certificate for admin.nazwa.pl

##1. clone project
`git clone https://github.com/charlie-cheetah/nazwapl-ssl.git`

##2. download acme.sh

`curl https://get.acme.sh | sh -s email=my@example.com`

##3. change acme.sh script to Let'sEncrypt
`./acme.sh/acme.sh --set-default-ca --server letsencrypt`

##4. make renew.sh executable
`chmod +x nazwapl-ssl/renew.sh`

##5. edit renew.sh
`nano nazwapl-ssl/renew.sh`
- update domain, local path

##6. edit index.js
`nano nazwapl-ssl/index.js`
- update login, password and domain

##7. run
`nazwapl-ssl/npm install`

##8. set CRON job to
~/nazwapl-ssl/renew.sh