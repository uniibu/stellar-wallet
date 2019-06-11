# stellar-wallet
A simple stellar wallet with notifications


### Auto Installer:
`sudo bash -c "$(curl -L https://git.io/fjgEm)"`

Check Logs to view your withdrawal url

```docker logs stellar```

Check log files at `$HOME/.stellar/logs`

Manual setup:
```
docker run -v stellar-data:/usr/src/app --name=stellar-node -d \
      -p 8899:8899 \
      -v $HOME/.stellar/xlm.env:/usr/src/app/.env \
      -v $HOME/.stellar/db.json:/usr/src/app/src/db/db.json \
      -v $HOME/.stellar/logs:/usr/src/app/logs \
      unibtc/stellar:latest
```