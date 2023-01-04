module.exports = {
  'env': {
    'es2021': true,
    'node': true,
  },
  'parserOptions': {
    'ecmaVersion': 'latest',
    'sourceType': 'module',
  },
  'overrides': [
    {
      'files': ['*.ts'],
      'parser': '@typescript-eslint/parser',
      'plugins': ['@typescript-eslint'],
      'extends': ['eslint-config-brisk/tslint'],
      'rules': {
        'no-redeclare': 'off',
        '@typescript-eslint/no-redeclare': 'warn',
        'class-methods-use-this': 'off',
        'max-classes-per-file': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
    {
      'files': ['*.js'],
      'extends': ['eslint-config-brisk/jslint'],
    },
  ],

};
