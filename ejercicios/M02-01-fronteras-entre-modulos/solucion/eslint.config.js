// Configuración de ESLint (formato plano).
module.exports = [
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Frontera: ningún fichero de src/modulos/<x>/ puede entrar en otro módulo.
      // Los datos llegan por props desde quien compone (src/App.jsx).
      'no-restricted-imports': ['error', {
        patterns: [{ group: ['../*/**'], message: 'No importes de otro módulo: recibe los datos por props.' }],
      }],
    },
  },
];
