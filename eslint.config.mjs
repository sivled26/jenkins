// Configuración ESLint (flat config) usada como herramienta SAST liviana.
// eslint-plugin-security detecta patrones inseguros típicos de Node.js
// (eval, child_process, regex vulnerables a ReDoS, rutas de archivo dinámicas...).
import js from '@eslint/js';
import globals from 'globals';
import security from 'eslint-plugin-security';

export default [
  {
    ignores: ['node_modules/**', 'coverage/**', 'reports/**', '.scannerwork/**'],
  },
  js.configs.recommended,
  security.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.jest },
    },
    rules: {
      // --- Reglas de seguridad que ROMPEN el build (error) ---
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-child-process': 'error',
      'security/detect-non-literal-fs-filename': 'error',
      'security/detect-non-literal-require': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-pseudoRandomBytes': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-new-buffer': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      // Muy ruidosa (falsos positivos con arreglos); se deja como advertencia
      'security/detect-object-injection': 'warn',
      // --- Calidad ---
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
