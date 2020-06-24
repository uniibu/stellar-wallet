#!/usr/bin/env bash

set -e

if [[ $EUID -ne 0 ]]; then
   echo "This script must be ran as root or sudo" 1>&2
   exit 1
fi

rm -rf /usr/bin/stellar-update

cat >/usr/bin/stellar-update <<'EOL'
#!/usr/bin/env bash
if [[ $EUID -ne 0 ]]; then
   echo "This script must be ran as root or sudo" 1>&2
   exit 1
fi

VERSION="${1:-latest}"
shift

echo "Updating stellar..."
docker stop stellar-node || true
docker wait stellar-node || true
docker pull unibtc/stellar:$VERSION
sudo docker rm stellar-node || true
echo "Running new stellar-node container"

docker run -v stellar-data:/usr/src/app --name=stellar-node -d \
      -p 8877:8877 \
      -v $HOME/.stellar/xlm.env:/usr/src/app/.env \
      -v $HOME/.stellar/db.json:/usr/src/app/src/db/db.json \
      -v $HOME/.stellar/logs:/usr/src/app/logs \
      unibtc/stellar:$VERSION $@

echo "Stellar successfully updated and started"
echo ""
EOL

chmod +x /usr/bin/stellar-update