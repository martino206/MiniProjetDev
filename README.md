# 📖 Blog App — Plateforme de lecture inspirée de Medium

Une application full-stack complète avec React, Node.js/Express et MySQL.

---

## 🗂️ Structure du projet

```
/blog-app
  /client       → Frontend React + Tailwind CSS
  /server       → Backend Node.js + Express
  /database     → Schéma SQL complet
```

---

## ⚙️ Prérequis

- Node.js v18+
- MySQL 8.0+
- npm ou yarn

---

## 🚀 Installation et lancement

### 1. Base de données

```bash
# Connectez-vous à MySQL
mysql -u root -p

# Importez le schéma complet (crée la DB, les tables et les données de test)
source /chemin/vers/blog-app/database/schema.sql
```

---

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

#### Variables d'environnement (`server/.env`)

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=blogapp

JWT_SECRET=changez_cette_cle_secrete_en_production
JWT_EXPIRES_IN=7d

UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

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

## 🔐 Comptes de démonstration

| Rôle  | Email            | Mot de passe |
|-------|------------------|--------------|
| Admin | admin@blog.com   | Admin@123    |
| User  | john@blog.com    | Admin@123    |

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

## 📡 API Endpoints

### Auth
| Méthode | Route              | Description           |
|---------|--------------------|-----------------------|
| POST    | /api/auth/register | Inscription           |
| POST    | /api/auth/login    | Connexion             |
| GET     | /api/auth/me       | Profil courant (JWT)  |

### Articles
| Méthode | Route                      | Description                |
|---------|----------------------------|----------------------------|
| GET     | /api/articles              | Liste paginée (+ recherche)|
| GET     | /api/articles/:slug        | Article par slug           |
| POST    | /api/articles              | Créer un article           |
| PUT     | /api/articles/:id          | Modifier un article        |
| DELETE  | /api/articles/:id          | Supprimer un article       |
| POST    | /api/articles/:id/like     | Like / Unlike              |
| POST    | /api/articles/:id/bookmark | Bookmark / Unbookmark      |
| GET     | /api/articles/me/bookmarks | Mes favoris                |
| POST    | /api/articles/:id/comments | Ajouter un commentaire     |

### Users
| Méthode | Route                | Description              |
|---------|----------------------|--------------------------|
| GET     | /api/users/profile/:username | Profil public  |
| PUT     | /api/users/me        | Modifier mon profil      |
| POST    | /api/users/me/avatar | Changer l'avatar         |
| PUT     | /api/users/me/password | Changer le mot de passe|
| GET     | /api/users           | Liste (admin)            |

### Catégories
| Méthode | Route              | Description        |
|---------|--------------------|--------------------|
| GET     | /api/categories    | Toutes les catégo. |
| POST    | /api/categories    | Créer (admin)      |
| DELETE  | /api/categories/:id | Supprimer (admin) |
| GET     | /api/categories/stats | Stats (admin)  |

### Notifications
| Méthode | Route                       | Description         |
|---------|-----------------------------|---------------------|
| GET     | /api/notifications          | Mes notifications   |
| PUT     | /api/notifications/read-all | Tout marquer lu     |

---

## 🛠️ Stack technique

| Couche    | Technologie                             |
|-----------|-----------------------------------------|
| Frontend  | React 18, Tailwind CSS, Lucide React    |
| Routing   | React Router DOM v6                     |
| State     | Context API + hooks                     |
| HTTP      | Axios                                   |
| Backend   | Node.js, Express.js                     |
| Base de données | MySQL 8 (mysql2/promise)        |
| Auth      | JWT + bcrypt                            |
| Upload    | Multer                                  |
| Validation | express-validator                      |

---

## 📁 Architecture backend (MVC)

```
server/
├── config/
│   └── db.js              # Pool MySQL
├── controllers/
│   ├── authController.js
│   ├── articleController.js
│   ├── userController.js
│   ├── commentController.js
│   ├── categoryController.js
│   └── notificationController.js
├── middlewares/
│   ├── auth.js            # JWT middleware
│   ├── upload.js          # Multer config
│   └── errorHandler.js
├── routes/
│   ├── auth.js
│   ├── articles.js
│   ├── users.js
│   ├── categories.js
│   └── notifications.js
├── uploads/               # Fichiers uploadés
│   ├── avatars/
│   ├── covers/
│   └── content/
├── .env.example
├── index.js               # Point d'entrée
└── package.json
```

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
