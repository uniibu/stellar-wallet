#!/usr/bin/env bash

set -e

if [[ $EUID -ne 0 ]]; then
   echo "This script must be ran as root or sudo" 1>&2
   exit 1
fi

die () {
  ret=$?
  print "%s\n" "$@" >&2
  exit "$ret"
}

echo "Installing Stellar Docker"

mkdir -p $HOME/.stellar/logs

echo "Initial Stellar Configuration"

read -p 'notify url(this url will be called when a deposit arrives): ' notify


[[ -z "$notify" ]] && die "Error: notify url is required. exiting..."

echo "Creating Stellar configuration at $HOME/.stellar/xlm.env"

cat >$HOME/.stellar/xlm.env <<EOL
NODE_ENV=production
NOTIFY_URL=$notify
PORT=8877
EOL

cat >$HOME/.stellar/db.json <<'EOL'
{
  "ledger": 0
}
EOL

echo Installing Stellar Container

docker volume create --name=stellar-data
docker pull unibtc/stellar:latest
docker run -v stellar-data:/usr/src/app --name=stellar-node -d \
      -p 8877:8877 \
      -v $HOME/.stellar/xlm.env:/usr/src/app/.env \
      -v $HOME/.stellar/db.json:/usr/src/app/src/db/db.json \
      -v $HOME/.stellar/logs:/usr/src/app/logs \
      unibtc/stellar:1.0.6

cat >/usr/bin/stellar-cli <<'EOL'
#!/usr/bin/env bash
docker exec -it stellar-node /bin/bash -c "stellar-cli $*"
EOL

cat >/usr/bin/stellar-update <<'EOL'
#!/usr/bin/env bash
if [[ $EUID -ne 0 ]]; then
   echo "This script must be ran as root or sudo" 1>&2
   exit 1
fi
echo "Updating stellar..."
sudo docker stop stellar-node
sudo docker rm stellar-node
sudo rm -rf ~/docker/volumes/stellar-data
sudo docker volume rm stellar-data
sudo docker pull unibtc/stellar:latest
docker run -v stellar-data:/usr/src/app --name=stellar-node -d \
      -p 8877:8877 \
      -v $HOME/.stellar/xlm.env:/usr/src/app/.env \
      -v $HOME/.stellar/db.json:/usr/src/app/src/db/db.json \
      -v $HOME/.stellar/logs:/usr/src/app/logs \
      unibtc/stellar:latest
EOL

cat >/usr/bin/stellar-rm <<'EOL'
#!/usr/bin/env bash
if [[ $EUID -ne 0 ]]; then
   echo "This script must be ran as root or sudo" 1>&2
   exit 1
fi
echo "WARNING! This will delete ALL stellar installation and files"
echo "Make sure your wallet seeds and phrase are safely backed up, there is no way to recover it!"
function uninstall() {
  sudo docker stop stellar-node
  sudo docker rm stellar-node
  sudo rm -rf ~/docker/volumes/stellar-data ~/.stellar /usr/bin/stellar-cli
  sudo docker volume rm stellar-data
  echo "Successfully removed"
  sudo rm -- "$0"
}
read -p "Continue (Y)?" choice
case "$choice" in
  y|Y ) uninstall;;
  * ) exit;;
esac
EOL

chmod +x /usr/bin/stellar-rm
chmod +x /usr/bin/stellar-cli
chmod +x /usr/bin/stellar-update
echo
echo "==========================="
echo "==========================="
echo "Installation Complete"
echo
echo "RUN 'docker logs stellar-node' to view your Withdraw Callback Url and Wallet Address"