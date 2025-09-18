// Font utility classes for consistent typography across the application

export const fonts = {
  // Neue Metana - Primary brand font (semibold)
  brand: 'font-neue-metana font-semibold',
  heading: 'font-neue-metana font-semibold',
  
  // BL Melody - Default UI font (now using normal as global default)
  nav: 'font-bl-melody font-normal',      // Normal weight for navigation (changed from light)
  body: 'font-bl-melody font-normal',     // Normal weight for body text
  button: 'font-bl-melody font-normal',   // Normal weight for buttons
  
  // Utility classes
  light: 'font-bl-melody font-light',
  normal: 'font-bl-melody font-normal',   // This is now the global default
  semibold: 'font-neue-metana font-semibold',
} as const;

export const fontClasses = {
  // Typography presets (updated to use normal weight as default)
  title: `${fonts.brand} text-lg`,
  subtitle: `${fonts.brand} text-base`,
  navItem: `${fonts.nav} text-sm`,        // Now uses normal weight
  bodyText: `${fonts.body} text-sm`,
  caption: `${fonts.normal} text-xs`,     // Changed to normal weight
  button: `${fonts.button} text-sm`,
} as const;