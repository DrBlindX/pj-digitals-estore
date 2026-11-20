# Shared logo

All four apps use `shared/assets/nearby-logo.png` for their logo and configured app/browser icons. `index.ts` exports the image for screens and loading animations.

The image is copied exactly from the user-provided file. App names are unchanged.

Restart Expo after changing app.json. Installed app launcher icons and native splash screens need a new app build. Browsers may cache the favicon.
