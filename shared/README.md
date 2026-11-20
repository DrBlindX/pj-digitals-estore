# NearBy shared library

Used by Customer, Shop, Delivery and Admin.

- `apiConfig.ts`: the single authoritative API address. All four apps currently use https://api.nbyme.com. Change it here and rebuild/restart the apps; per-app EXPO_PUBLIC_API_URL is no longer used by the request handler.
- `api.ts`: authenticated-call transport, HTTP errors, request cancellation and timeouts. Callers supply Clerk tokens; the library never stores credentials.
- `support.ts`: feedback/problem validation, submission and report history through /api/support.
- `theme/`, `brand/`, `assets/`: existing shared styling and brand assets.
- `metro.cjs`: allows each app to resolve the shared library with its own dependencies.

App-specific screens, Clerk providers and role checks remain in their apps. No server code lives here.

- `mobile.ts`: shared Android back/exit policy and phone logo sizing. Each app supplies its own React Native/Expo adapter to keep dependency resolution consistent.
- `android-build.cjs`: shared release code/resource shrinking settings, applied via app config plugins.
