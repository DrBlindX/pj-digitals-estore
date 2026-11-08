# NearBy Delivery (`client_delivery`)

Standalone Expo Router / React Native TypeScript app for delivery partners. It shares the customer app's NearBy logo, name, and light theme, uses Clerk sign-in, and connects delivery workflows to the API.

## Add to PJ

Copy this complete `client_delivery` folder beside `client`, `client_shop`, and `server` in the PJ repository. It is a separate Expo app, not a route inside the customer app.

## Run locally

Set `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in `client_delivery/.env.local`, then install dependencies and start Expo. For npm on Windows: `npm.cmd install` and `npm.cmd run web`.

## Delivery features

- Partner application and approval status.
- Assigned jobs, job details, status updates, and delivery history.
- Availability, profile editing, and current location updates.

Earnings, support, and payout services are not connected because their endpoints were not provided.
