# Grilled Restaurant POS (سیستەمی فرۆشتنی چێشتخانەی برژاو)

A production-ready, mobile-first Point-of-Sale (POS) and daily operations management system built for grilled-food restaurants in Kurdish Sorani (`ckb`, RTL).

---

## 1. Overview & Core Capabilities

- **Primary Language & Direction**: Kurdish Sorani (`ckb`), Full RTL layout.
- **POS Operations**: Fast category filtering, product search, touch-friendly order customization (portions: نەفەر / نیو نەفەر / کیلۆ, cooking options: کەم ببرژێت / بێ پیاز / توند بێت / سەوزەی زیادە), cart management, integer IQD financial recalculation, and instant order creation.
- **Operational Expense Tracking**: Fast logging of business expenses with categories (گۆشت, سەوزە, نان, کرێ, کارمەند, گاز, کارەبا, ئاو, گواستنەوە, هی تر) and live daily totals.
- **Daily Financial Reporting**: Live calculation of Total Sales, Total Expenses, and Net Profit (قازانجی پاک) for the active Baghdad business day (`Asia/Baghdad`).
- **End-of-Day Register Closing (داخستنی سندوق)**: Immutable closing records locking daily sales, expenses, order counts, and cashier signature preventing duplicate closures.
- **Cloud Firestore Persistence & Security**: Strict rules requiring authenticated users, immutable historical records, and integer currency validation.
- **Network & Offline Awareness**: Real-time status detection with user notifications.

---

## 2. Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS (with `Vazirmatn` font and RTL utilities)
- **Backend & Database**: Cloud Firestore
- **Authentication**: Firebase Authentication (Cashier Quick Login & Email/Password)
- **Hosting**: Firebase Hosting (`dist/`)

---

## 3. Directory Structure

```
├── public/
├── src/
│   ├── components/
│   │   ├── auth/          # AuthView.tsx
│   │   ├── cart/          # CartPanel, CartItemRow, OrderSummary
│   │   ├── closing/       # DailyClosingCard, ClosingModal
│   │   ├── expenses/      # ExpenseForm, ExpenseList
│   │   ├── layout/        # AppShell, Header, PageHeader
│   │   ├── navigation/    # BottomNavigation, SidebarNavigation
│   │   ├── pos/           # CategoryTabs, ProductGrid, ProductCard, PortionSelector, CustomizationSelector, ProductModal
│   │   ├── reports/       # SummaryCard, DailyOrdersList
│   │   └── ui/            # Button, Badge, Card, Input, Select, Modal, ConfirmDialog, Toast, LoadingState, EmptyState, ErrorState, NetworkBanner
│   ├── contexts/          # AuthContext, CartContext, ToastContext
│   ├── data/              # products.ts
│   ├── hooks/             # useAuth, useCart, useDailyReport, useNetworkStatus, useToast
│   ├── pages/             # POSPage, ExpensesPage, ReportsPage
│   ├── services/          # firebase, auth.service, orders.service, expenses.service, closing.service
│   ├── types/             # product, order, expense, closing, user
│   ├── utils/             # currency, dates (Asia/Baghdad), calculations, validation
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
├── .firebaserc
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 4. Financial & Currency Rules

- All monetary calculations are performed in non-negative integer **Iraqi Dinar (IQD)**.
- Formatted as `4,000 د.ع`.
- Line totals and order totals are calculated and validated authoritatively in the business logic service (`calculateOrderTotal` and `calculateLineTotal`) before saving to Cloud Firestore.

---

## 5. Business Day & Timezone

- **Timezone**: `Asia/Baghdad` (UTC+3).
- **Business Day Range**: 00:00:00 to 23:59:59 in Baghdad time.
- All sales, expenses, and closing records use indexed `baghdadDate` (YYYY-MM-DD) and server timestamps.

---

## 6. Build & Deployment Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Firebase Hosting and Firestore
firebase deploy
```
