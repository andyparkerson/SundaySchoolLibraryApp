# Sunday School Library App

A React Native mobile application that lets church members check Sunday School books in and out of a church collection.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Folder Structure](#folder-structure)
- [Backend — Firebase](#backend--firebase)
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
├── App.tsx                    # Root component — wraps tree with AuthProvider
├── index.js                   # React Native entry point
├── app.json / babel.config.js / metro.config.js / tsconfig.json
├── firebase.json              # Firebase project config (points at firestore.rules)
├── firestore.rules            # Firestore RBAC security rules
├── firestore.indexes.json     # Composite index definitions
└── src/
    ├── config/
    │   └── firebase.ts        # Firebase app init — exports firebaseAuth + firestore
    ├── screens/               # HomeScreen, BooksScreen, CheckoutScreen
    ├── components/            # BookCard
    ├── services/
    │   ├── BookService.ts         # In-memory service (original)
    │   ├── CheckoutService.ts     # In-memory service (original)
    │   ├── FirebaseAuthService.ts # Email/password auth + Firestore user profile
    │   ├── FirebaseBookService.ts # Firestore CRUD + real-time onSnapshot listener
    │   └── FirebaseCheckoutService.ts # Checkout/return + real-time listener
    ├── auth/
    │   ├── AuthService.ts     # Simple in-memory auth (original)
    │   └── AuthContext.tsx    # React context powered by FirebaseAuthService
    ├── models/                # Book, CheckoutRecord, User, Copy (with validation)
    └── data/
        └── sampleBooks.ts
```

---

## Backend — Firebase

The app uses **Firebase** (Firestore + Firebase Authentication) as its backend.

| Capability | Detail |
|---|---|
| Authentication | Firebase Auth — email/password, persistent sessions, automatic token refresh |
| Database | Cloud Firestore (NoSQL document model) |
| Real-time updates | `onSnapshot` listeners — true server push, no polling required |
| Role-based access | Firestore Security Rules (`firestore.rules`) — enforced at the database layer |
| React Native SDK | `firebase` npm package — no native module linking required |

### How it works

- **`FirebaseAuthService`** — `registerUser` creates a Firebase Auth account and writes a `UserProfile` document (name, email, role) to `users/{uid}` in Firestore. `loginUser` / `logoutUser` wrap the standard Firebase Auth methods.
- **`FirebaseBookService`** — all book reads and writes go through Firestore. `subscribeToBooks` opens an `onSnapshot` listener that pushes updates to the UI in real time whenever any book document changes.
- **`FirebaseCheckoutService`** — checkout and return operations write to a `checkouts` collection. `subscribeToUserCheckouts` streams a user's checkout history live.
- **`AuthContext`** — `<AuthProvider>` (wrapping `App.tsx`) subscribes to Firebase Auth state on mount, fetches the matching Firestore profile, and exposes `{ firebaseUser, userProfile, loading }` to every screen via `useAuth()`.
- **`firestore.rules`** — role-based rules enforced server-side:
  - All authenticated users can read books.
  - Only Librarians can write/delete books.
  - Users can read and create their own checkouts; Librarians have full access.
  - Checkout records can never be deleted (audit trail).

### Firebase project setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a new project.
2. Enable **Authentication → Sign-in method → Email/Password**.
3. Enable **Firestore Database** and choose a region. Start in **production mode**.
4. In **Project Settings → General → Your apps**, add a Web app and copy the SDK config snippet.
5. Open `src/config/firebase.ts` and replace the `REPLACE_WITH_*` placeholder values with your project's credentials (or set the corresponding `FIREBASE_*` environment variables).
6. Install the Firebase CLI and deploy the security rules and indexes:

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add          # select your project
   firebase deploy --only firestore:rules,firestore:indexes
   ```

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

4. **Configure Firebase** — see [Firebase project setup](#firebase-project-setup) above.

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
npm test
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

