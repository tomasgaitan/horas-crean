/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Outfit para UI, JetBrains Mono para reloj/dígitos (ver index.html)
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      // Sombra de difusión suave (sin glows), tintada al fondo oscuro
      boxShadow: {
        diffuse: '0 24px 60px -20px rgba(0, 0, 0, 0.55)',
      },
    },
  },
  plugins: [],
}
