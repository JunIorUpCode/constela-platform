module.exports = {
  extends: [
    'next/core-web-vitals',
    'next/typescript',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', {
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],
    '@typescript-eslint/no-explicit-any': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'no-empty': ['error', { 'allowEmptyCatch': true }]
  }
};
