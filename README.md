# Sunday School Library App

A React Native mobile application that lets church members check Sunday School books in and out of a church collection.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Folder Structure](#folder-structure)
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
- Role-based access (admin, librarian, viewer)

---

## Folder Structure

```
SundaySchoolLibraryApp/
├── App.tsx                  # Root component with navigation setup
├── index.js                 # React Native entry point
├── app.json                 # App metadata
├── package.json
├── tsconfig.json
├── babel.config.js
├── metro.config.js
└── src/
    ├── screens/             # Top-level screen components
    │   ├── HomeScreen.tsx
    │   ├── BooksScreen.tsx
    │   └── CheckoutScreen.tsx
    ├── components/          # Reusable UI components
    │   └── BookCard.tsx
    ├── services/            # Business logic / data access layer
    │   ├── BookService.ts
    │   └── CheckoutService.ts
    ├── models/              # TypeScript interfaces / data models
    │   ├── Book.ts
    │   └── CheckoutRecord.ts
    ├── auth/                # Authentication helpers
    │   └── AuthService.ts
    └── data/                # Static / seed data
        └── sampleBooks.ts
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
# or
yarn test
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

