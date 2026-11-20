// Keep web stylesheet imports typed on fresh checkouts before Expo generates its cache.
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}
declare module '*.css';
