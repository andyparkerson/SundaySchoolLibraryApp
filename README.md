# Sunday School Library App

A React Native mobile application that lets church members check Sunday School books in and out of a church collection.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Folder Structure](#folder-structure)
- [Backend Options](#backend-options)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Running the App](#running-the-app)
- [Project Navigation](#project-navigation)
- [Contributing](#contributing)

---

## Project Overview

The **Sunday School Library App** helps church communities manage a small lending library of Sunday School books.  Key features include:

- Browse the book catalogue
- Check books in and out
- Track borrower information and return dates
- Role-based access (Librarian, Instructor, GeneralUser)

---

## Folder Structure

```
SundaySchoolLibraryApp/
├── App.tsx                        # Root component — wraps tree with AuthProvider
├── index.js                       # React Native entry point
├── app.json / babel.config.js / metro.config.js / tsconfig.json
├── firebase.json                  # Firebase project config (points at firestore.rules)
├── firestore.rules                # Firestore RBAC security rules
├── firestore.indexes.json         # Composite index definitions
├── api/                           # Azure Functions REST API (Azure SQL backend)
│   ├── host.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── local.settings.json.example
│   └── src/
│       ├── db/
│       │   ├── database.ts        # mssql connection pool
│       │   └── schema.sql         # Azure SQL DDL
│       ├── middleware/
│       │   └── validateToken.ts   # JWT verify / sign helpers
│       ├── models/
│       │   └── userRole.ts
│       └── functions/
│           ├── auth.ts            # POST /api/auth/register|login  GET /api/auth/me
│           ├── books.ts           # CRUD /api/books[/{isbn}]
│           └── checkouts.ts       # /api/checkouts  /api/checkouts/{id}/return
└── src/
    ├── config/
    │   ├── firebase.ts            # Firebase app init (Firestore + Auth instances)
    │   └── azureApi.ts            # Azure Functions base URL
    ├── screens/                   # HomeScreen, BooksScreen, CheckoutScreen
    ├── components/                # BookCard
    ├── services/
    │   ├── BookService.ts         # In-memory (original)
    │   ├── CheckoutService.ts     # In-memory (original)
    │   ├── FirebaseAuthService.ts # Firebase email/password auth + Firestore profile
    │   ├── FirebaseBookService.ts # Firestore CRUD + real-time onSnapshot
    │   ├── FirebaseCheckoutService.ts
    │   ├── AzureAuthService.ts    # JWT auth via Azure Functions REST API
    │   ├── AzureBookService.ts    # REST book CRUD + polling subscription
    │   └── AzureCheckoutService.ts
    ├── auth/
    │   ├── AuthService.ts         # Simple in-memory auth (original)
    │   └── AuthContext.tsx        # React context backed by FirebaseAuthService
    ├── models/                    # Book, CheckoutRecord, User, Copy (with validation)
    └── data/
        └── sampleBooks.ts
```

---

## Backend Options

Two backend implementations are provided. Choose the one that best fits your infrastructure.

### Option A — Firebase (Firestore + Firebase Authentication) ✅ Recommended for React Native

| Capability | Detail |
|---|---|
| Authentication | Firebase Auth — email/password, persistent sessions, token refresh |
| Database | Cloud Firestore (NoSQL, document model) |
| Real-time updates | `onSnapshot` listeners — true push, no polling |
| Role-based access | Firestore Security Rules (`firestore.rules`) |
| React Native SDK | `firebase` npm package — no native module linking required |
| Hosting | N/A — React Native builds to iOS/Android directly |

**Why Firebase for React Native?** The `firebase` JS SDK runs in React Native without any native module linking. `onSnapshot` gives true real-time push updates. Role-based rules live in `firestore.rules` and are enforced at the database layer.

#### Firebase setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Authentication → Sign-in method → Email/Password**.
3. Enable **Firestore Database** in production mode.
4. Copy the SDK config snippet into `src/config/firebase.ts` (or set the environment variables listed there).
5. Deploy security rules: `firebase deploy --only firestore:rules,firestore:indexes`.

---

### Option B — Azure Functions + Azure SQL

> **Note on "Azure Static Web Apps":** Azure Static Web Apps (SWA) is a hosting service for static *web* frontends. A React Native app builds to iOS/Android binaries — it is not hosted on SWA. What *is* applicable from the Azure SWA stack is the **Azure Functions HTTP API** (the `api/` folder follows SWA conventions and can be deployed as a standalone Function App). The React Native app calls those HTTP endpoints directly.

| Capability | Detail |
|---|---|
| Authentication | Custom JWT (bcrypt + jsonwebtoken) in Azure Functions |
| Database | Azure SQL Database (relational / SQL Server) |
| Real-time updates | Polling via `subscribeToBooks` / `subscribeToCheckouts` |
| Role-based access | Enforced in each Function handler (reads JWT role claim) |
| React Native SDK | Plain `fetch` — no native dependencies |
| Hosting | Azure Functions (Consumption or Premium plan) |

**When to choose Azure SQL:** If your organisation already runs on Azure, prefers a relational data model with foreign keys and SQL queries, or needs to query book inventory from other systems (Power BI, Logic Apps, etc.), Azure SQL + Azure Functions is a solid choice. The trade-off is that real-time updates use polling rather than a push connection (add [Azure SignalR Service](https://azure.microsoft.com/en-us/products/signalr-service) if sub-second latency is needed).

#### Azure Functions setup

1. Create an **Azure SQL Database** and run `api/src/db/schema.sql`.
2. Create an **Azure Function App** (Node 20, consumption plan).
3. Copy `api/local.settings.json.example` → `api/local.settings.json` and fill in your SQL credentials and a strong `JWT_SECRET`.
4. Deploy the Function App:

   ```bash
   cd api
   npm run build
   func azure functionapp publish <YOUR_FUNCTION_APP_NAME>
   ```

5. In `src/config/azureApi.ts`, set `AZURE_API_BASE_URL` to your Function App URL (`https://<app>.azurewebsites.net/api`).

#### REST API reference

| Method | Path | Auth required | Role |
|--------|------|---------------|------|
| POST | `/api/auth/register` | No | — |
| POST | `/api/auth/login` | No | — |
| GET | `/api/auth/me` | Bearer JWT | any |
| GET | `/api/books` | Bearer JWT | any |
| GET | `/api/books/{isbn}` | Bearer JWT | any |
| POST | `/api/books` | Bearer JWT | Librarian |
| PUT | `/api/books/{isbn}` | Bearer JWT | Librarian |
| DELETE | `/api/books/{isbn}` | Bearer JWT | Librarian |
| GET | `/api/checkouts` | Bearer JWT | Librarian/Instructor: all; else own |
| POST | `/api/checkouts` | Bearer JWT | any |
| PUT | `/api/checkouts/{id}/return` | Bearer JWT | Librarian or owner |

---

### Comparison summary

| | Firebase | Azure Functions + SQL |
|---|---|---|
| Real-time push | ✅ | ⚠️ Polling (add SignalR for push) |
| Relational queries | ❌ NoSQL | ✅ Full SQL |
| React Native friction | Low | Low (`fetch` only) |
| Auth complexity | Low | Medium (JWT self-managed) |
| Open source | ❌ | ✅ Functions runtime is open source |
| Vendor | Google | Microsoft |
| Free tier | Generous | Limited |

---

## Prerequisites

Before you begin, make sure the following tools are installed:

| Tool | Version | Link |
|------|---------|------|
| Node.js | ≥ 18 | https://nodejs.org |
| npm or Yarn | latest | https://yarnpkg.com |
| React Native CLI | latest | `npm install -g react-native-cli` |
| Xcode (iOS) | ≥ 14 | Mac App Store |
| Android Studio (Android) | latest | https://developer.android.com/studio |
| CocoaPods (iOS) | latest | `brew install cocoapods` |

Follow the official [React Native Environment Setup](https://reactnative.dev/docs/environment-setup) guide for detailed platform-specific instructions.

---

## Setup Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/andyparkerson/SundaySchoolLibraryApp.git
   cd SundaySchoolLibraryApp
   ```

2. **Install JavaScript dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Install iOS native dependencies** *(macOS only)*

   ```bash
   cd ios && pod install && cd ..
   ```

4. **Configure your chosen backend** — see [Backend Options](#backend-options) above.

---

## Running the App

### Start the Metro bundler

```bash
npm start
# or
yarn start
```

### iOS Simulator *(macOS only)*

```bash
npm run ios
# or
yarn ios
```

### Android Emulator

Make sure an Android emulator is running (or a device is connected), then:

```bash
npm run android
# or
yarn android
```

### Run Tests

```bash
# React Native app tests
npm test

# Azure Functions API tests
cd api && npm test
```

---

## Project Navigation

The app uses **React Navigation** with a **Bottom Tab Navigator** containing three tabs:

| Tab | Screen | Description |
|-----|--------|-------------|
| Home | `HomeScreen` | Welcome screen with app overview |
| Books | `BooksScreen` | Browsable list of the book catalogue |
| Checkout | `CheckoutScreen` | Manage book checkouts and returns |

Navigation is defined in `App.tsx` using `@react-navigation/bottom-tabs`.

---

## Contributing

1. Fork the repository and create a feature branch.
2. Follow the existing folder structure and TypeScript conventions.
3. Open a pull request with a clear description of your changes.

