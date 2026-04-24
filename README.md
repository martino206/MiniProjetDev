# 📖 Blog App — Plateforme de lecture inspirée de Medium

Une application full-stack complète avec React, Node.js/Express et MySQL.

---

## 🗂️ Structure du projet

```
/blog-app
  /client       → Frontend React + Tailwind CSS
  /server       → Backend Node.js + Express
  /database     → Schéma SQL complet
``

## ⚙️ Prérequis

- Node.js v18+
- MySQL 8.0+
- npm ou yarn

## 🚀 Installation et lancement

### 1. Base de données
# Connectez-vous à MySQL
mysql -u root -p

### 2. Backend (serveur)

```bash
cd blog-app/server

# Installer les dépendances
npm install

# Créer le fichier de configuration
cp .env.example .env

# Éditer .env avec vos paramètres MySQL
nano .env

# Lancer en développement
npm run dev

# Lancer en production
npm start
```

Le serveur sera disponible sur **http://localhost:5000**
CLIENT_URL=http://localhost:3000
```

---

### 3. Frontend (client)

```bash
cd blog-app/client

# Installer les dépendances
npm install

# Lancer en développement
npm start

# Build production
npm run build
```

Le client sera disponible sur **http://localhost:3000**

---

## ✨ Fonctionnalités

### 🌐 Public
- Navigation et lecture des articles
- Recherche par mot-clé
- Filtrage par catégorie
- Pagination
- Profils publics des auteurs
- Mode sombre / clair

### 👤 Utilisateur connecté
- Inscription & connexion (JWT)
- Modification du profil (nom, bio)
- Upload d'avatar (PC, téléphone, tablette)
- Créer / modifier / supprimer des articles
- Upload d'image de couverture
- Like et unlike des articles
- Sauvegarder des articles (bookmarks)
- Commenter et répondre aux commentaires
- Notifications en temps réel (like, commentaire)
- Dashboard personnel

### 🛡️ Administrateur
- Dashboard admin complet
- Gestion des utilisateurs (activer/désactiver/supprimer)
- Gestion des articles (voir/supprimer)
- Gestion des catégories (créer/supprimer)
- Statistiques globales

---


---

## 🔒 Sécurité

- Mots de passe hashés avec bcrypt (salt 10)
- Authentification JWT avec expiration
- Validation des entrées avec express-validator
- Contraintes SQL (clés étrangères, UNIQUE)
- Protection des routes admin
- Filtrage des types MIME pour les uploads
- Limite de taille des fichiers (5MB)
- CORS configuré

---

## 📱 Responsive

L'interface est entièrement responsive :
- Mobile (< 640px)
- Tablette (640px - 1024px)
- Desktop (> 1024px)

---

## 🌙 Dark Mode

Le dark mode est géré automatiquement selon la préférence système et peut être basculé via l'icône dans la navbar. Le choix est persisté dans `localStorage`.
