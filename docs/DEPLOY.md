# Deploiement de Cellium sur un VPS Debian

Ce guide explique comment deployer Cellium sur un VPS Debian avec Docker.

---

## Pre-requis

- Un VPS sous **Debian 11 ou 12**
- Un acces **root** ou un utilisateur avec `sudo`
- Un nom de domaine (optionnel, mais recommande pour HTTPS)

---

## 1. Installer Docker sur Debian

Connectez-vous en SSH a votre VPS :

```bash
ssh root@VOTRE_IP
```

Installez Docker et Docker Compose :

```bash
# Mettre a jour le systeme
apt update && apt upgrade -y

# Installer les dependances
apt install -y ca-certificates curl gnupg

# Ajouter la cle GPG officielle de Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Ajouter le depot Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installer Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verifier l'installation
docker --version
docker compose version
```

---

## 2. Transferer le projet sur le VPS

### Option A : Avec Git (recommande)

Si votre projet est sur un depot Git :

```bash
cd /opt
git clone https://VOTRE_DEPOT.git cellium
cd cellium
```

### Option B : Avec SCP

Depuis votre machine locale :

```bash
scp -r /chemin/vers/Cellium root@VOTRE_IP:/opt/cellium
```

---

## 3. Configurer l'environnement

Creez un fichier `.env` a la racine du projet :

```bash
cd /opt/cellium
nano .env
```

Contenu du fichier `.env` :

```env
# OBLIGATOIRE : Changez cette valeur par une chaine aleatoire longue
JWT_SECRET=votre-secret-jwt-tres-long-et-aleatoire

# Port expose (80 par defaut)
PORT=80
```

Pour generer un secret JWT aleatoire :

```bash
openssl rand -hex 32
```

---

## 4. Lancer l'application

```bash
cd /opt/cellium
docker compose up -d --build
```

Cela va :
1. Construire l'image du backend (Python + Gunicorn)
2. Construire l'image du frontend (Node build + Nginx)
3. Demarrer les deux conteneurs

Verifiez que tout tourne :

```bash
docker compose ps
```

Vous devriez voir les deux services `backend` et `frontend` en statut `running`.

L'application est maintenant accessible sur `http://VOTRE_IP`.

---

## 5. Commandes utiles

```bash
# Voir les logs en temps reel
docker compose logs -f

# Voir les logs du backend uniquement
docker compose logs -f backend

# Redemarrer les services
docker compose restart

# Arreter les services
docker compose down

# Reconstruire apres une mise a jour du code
docker compose up -d --build

# Voir l'espace utilise par les volumes
docker volume ls
```

---

## 6. Mettre a jour l'application

```bash
cd /opt/cellium

# Recuperer les dernieres modifications
git pull

# Reconstruire et relancer
docker compose up -d --build
```

---

## 7. Sauvegardes

Les donnees (base SQLite + fichiers spreadsheet) sont stockees dans un volume Docker nomme `cellium_cellium-data`.

### Faire une sauvegarde

```bash
# Creer un dossier de backup
mkdir -p /opt/backups

# Sauvegarder le volume
docker run --rm \
  -v cellium_cellium-data:/data \
  -v /opt/backups:/backup \
  alpine tar czf /backup/cellium-backup-$(date +%Y%m%d).tar.gz -C /data .
```

### Restaurer une sauvegarde

```bash
docker compose down

docker run --rm \
  -v cellium_cellium-data:/data \
  -v /opt/backups:/backup \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/cellium-backup-XXXXXXXX.tar.gz -C /data"

docker compose up -d
```

---

## 8. HTTPS avec un reverse proxy (optionnel mais recommande)

Si vous avez un nom de domaine, utilisez Nginx + Certbot sur le VPS pour le HTTPS.

### Installer Nginx et Certbot

```bash
apt install -y nginx certbot python3-certbot-nginx
```

### Configurer Nginx comme reverse proxy

Creez le fichier `/etc/nginx/sites-available/cellium` :

```nginx
server {
    server_name votre-domaine.com;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 180s;
    }
}
```

Activez le site et obtenez le certificat SSL :

```bash
ln -s /etc/nginx/sites-available/cellium /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Obtenir le certificat SSL
certbot --nginx -d votre-domaine.com
```

Dans ce cas, changez le port dans `.env` pour eviter le conflit :

```env
PORT=3000
```

Et adaptez le `proxy_pass` dans la config Nginx :

```nginx
proxy_pass http://127.0.0.1:3000;
```

Puis relancez :

```bash
docker compose up -d
systemctl reload nginx
```

---

## 9. Pare-feu

Configurez le pare-feu pour n'ouvrir que les ports necessaires :

```bash
apt install -y ufw

ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## Architecture du deploiement

```
Internet
    |
    v
[Nginx VPS (HTTPS)] (optionnel)
    |
    v port 80 (ou 3000)
[Docker: frontend (Nginx)]
    |
    | /api/* -> proxy
    v
[Docker: backend (Gunicorn + Flask)]
    |
    v
[Volume Docker: /data]
  ├── cellium.db (SQLite)
  └── sessions/
      ├── {uuid1}/spreadsheet.json
      └── {uuid2}/spreadsheet.json
```

---

## Notes importantes

- **Agent IA** : L'integration Claude Code CLI ne fonctionne pas en Docker (elle necessite une installation locale de Claude Code). L'editeur de spreadsheet et toutes les autres fonctionnalites marchent normalement.
- **JWT_SECRET** : Ne laissez JAMAIS la valeur par defaut en production. Utilisez `openssl rand -hex 32` pour generer un vrai secret.
- **Sauvegardes** : Mettez en place un cron pour les sauvegardes automatiques.
