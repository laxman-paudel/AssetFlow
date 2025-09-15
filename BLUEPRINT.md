# AssetFlow Application: High-Level Blueprint

This document provides a high-level architectural overview of the AssetFlow application. It is intended to give developers a quick and comprehensive understanding of the project's structure, data flow, and core principles.

---

### 1. Core Philosophy & Architecture

- **Technology:** Next.js (App Router), React, Tailwind CSS, ShadCN UI.
- **Client-Side First:** The application is a **Progressive Web App (PWA)** that runs entirely in the user's browser. There is **no backend server or database**.
- **Data Persistence:** All user data (accounts, transactions, settings) is stored exclusively in the browser's **`localStorage`**. This ensures 100% user privacy and offline capability.
- **State Management:** A centralized React Context, **`AppProvider`**, serves as the single source of truth for all application data. It manages loading, saving, and providing data to all other components.

---

### 2. Data Flow

The data flow is unidirectional and straightforward:

1.  **App Start:** `AppProvider` attempts to load data from `localStorage`.
2.  **In-Memory State:** Data is held in React state within the `AppProvider`.
3.  **Component Consumption:** Components throughout the app use the `useAssetFlow()` hook to access data and action functions (e.g., `addTransaction`).
4.  **User Actions:** When a user performs an action (e.g., adds an expense), the component calls an action function from the provider.
5.  **State Update:** The `AppProvider` updates its internal state with the new data.
6.  **Automatic Persistence:** A `useEffect` hook in `AppProvider` detects the state change and automatically writes the updated state back to `localStorage`.

```
[Browser localStorage] <--> [AppProvider (React Context)] --> [React Components (UI)]
        ^                                                            |
        |-----------------------(User Actions)-----------------------|
```

---

### 3. Application Structure (File Layout)

The application is organized into several key directories:

-   **/src/app/**: Contains the core routing and page components.
    -   `/(main)/`: A route group for all pages that share the main application layout.
        -   `layout.tsx`: The main layout with the header and bottom navigation.
        -   `page.tsx`: The **Dashboard** page.
        -   `/statement/page.tsx`: The **Statements** page.
        -   `/assets/page.tsx`: The **Accounts** page.
        -   `/settings/page.tsx`: The **Settings** page.
    -   `layout.tsx`: The root layout, responsible for setting up the HTML shell, fonts, and theme providers.

-   **/src/components/app/**: Contains application-specific, high-level components.
    -   `AppProvider.tsx`: The central state management provider.
    -   `BottomNav.tsx` & `HeaderNav.tsx`: Navigation components.
    -   `*Dialog.tsx` (e.g., `TransactionDialog`, `AccountDialog`): Modal components for creating and editing data.

-   **/src/components/ui/**: Contains the reusable, low-level UI components from ShadCN (e.g., `Button`, `Card`, `Dialog`).

-   **/src/lib/**: Contains shared utilities and type definitions.
    -   `types.ts`: Defines the core data structures (`Account`, `Transaction`).
    -   `utils.ts`: Contains utility functions like `cn` for class names.

---

### 4. Core User Flows

#### 4.1. First-Time Onboarding

1.  **Detect New User:** `AppProvider` finds no currency in `localStorage`.
2.  **Show Welcome Dialog:** The `CurrencySetupDialog` is displayed as a modal overlay.
3.  **Select Currency:** User selects a primary currency.
4.  **Initialize App:** `AppProvider` saves the currency, creates default accounts, and redirects the user to the Dashboard.

#### 4.2. Main Actions (Income/Expense)

1.  **Trigger:** User clicks "Income" or "Expense" on the Dashboard.
2.  **Open Dialog:** The `TransactionDialog` opens, configured for the correct type.
3.  **Submit Form:** User fills in the amount, account, and remarks.
4.  **Call Provider:** The dialog calls `addTransaction` from `AppProvider`.
5.  **Update State:** `AppProvider` adds the new transaction and updates the relevant account's balance. The UI automatically re-renders with the new data.

#### 4.3. Data Reset

1.  **Trigger:** User clicks "Reset App" in Settings and confirms in the alert dialog.
2.  **Clear Data:** The `resetApplication` function in `AppProvider` clears all app-related keys from `localStorage`.
3.  **Redirect & Restart:** It then forces a navigation to the root URL (`/`).
4.  **Onboarding Triggered:** Upon reload, the `AppProvider` finds no data and automatically initiates the "First-Time Onboarding" flow.
