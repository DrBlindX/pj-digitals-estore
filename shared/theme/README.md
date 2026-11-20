# NearBy shared theme

All four apps read this folder directly. Do not copy the palettes into an app.

- `palettes.ts`: main light/dark colors, gradients, text, borders and surfaces.
- `tokens.ts`: common typography families, spacing, loading-screen sizes/timing and banner/promotion colors.
- `adapters.ts`: compatibility names used by the shop, delivery and customer template screens.
- `index.ts`: public exports.

Change `palettes.ts` to change the main theme across customer, shop, delivery and admin. Each app keeps its existing theme switch and screen layouts. Product photography and individual category/status illustrations are not theme palettes.

Each app's `metro.config.js` watches `shared/` through `shared/metro.cjs`. After this configuration change, restart each development server with `pnpm expo start --clear`. Future theme edits are picked up by Metro normally.

Run and deploy from the complete repository: the app folder and its sibling `shared/` folder must both be available. No root workspace install, extra runtime dependency, or backend change is required.
