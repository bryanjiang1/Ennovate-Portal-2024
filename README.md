# Ennovate Official Website

Official website of Ennovate, Enactus UBC

<div style="display: flex; align-items: center;">
  <img src="./public/logos/enactus-logo.webp" alt="Enactus Logo" style="width: 250px; margin-right: 25px;" />
  <img src="./public/logos/ubc-logo.webp" alt="Enactus Logo" style="width: 100px;" />
</div>

## Installation and Setup

Clone the project

```bash
  git clone https://github.com/briannval/ennovate-portal-2024.git
```

Go to the project directory

```bash
  cd ennovate-portal-2024
```

## Setup Environment Variables

Create a .env file in the root directory and add the following:

```bash
MONGO_URI
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
REDIS_URL

```

`REDIS_URL` is optional. Without it, resource routes read directly from MongoDB
and skip cache writes and invalidation.

## Deploy on Netlify

The repository's `netlify.toml` sets the build command to `npm run build` and the
publish directory to `.next` for the Netlify Next.js runtime.

Set the Firebase `NEXT_PUBLIC_FIREBASE_*` variables above in Netlify before
building; Next.js embeds these public settings into the browser bundle. Set
`MONGO_URI` for Functions so API routes can access the existing database. If
using Redis, set `REDIS_URL` for Functions as well. Keep database and cache
connection strings in Netlify's environment settings, out of source control.

After changing Firebase settings, trigger a new deploy so the browser bundle is
rebuilt with the correct values.

Firebase web configuration is public client configuration, including the Firebase
API key. `netlify.toml` excludes only these configuration variables (and the
legacy `appId`, `authDomain`, and `messagingSenderId` variable names) from Netlify's
environment-variable secret scanning. Scanning remains enabled for database
credentials, Redis URLs, service account keys, and other secrets.

References: [Firebase API keys](https://firebase.google.com/docs/projects/api-keys)
and [Netlify secret scanning configuration](https://docs.netlify.com/build/environment-variables/secrets-controller/#configure-secret-scanning).

## Run Locally

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run dev
```

## Run With Docker

Run docker container

```bash
  docker compose up --build
```

## Support

For support, email ennovateubc@gmail.com or brianvalentinoadhitya@gmail.com.
