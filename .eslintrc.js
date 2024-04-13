module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: 'standard-with-typescript',
  overrides: [
    {
      env: {
        node: true
      },
      files: [
        '.eslintrc.{js,cjs}',
        'src/**/*.ts'
      ],
      parserOptions: {
        sourceType: 'script',
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json']
      }
    }
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    '@typescript-eslint/no-invalid-void-type': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-throw-literal': 'off',
    '@typescript-eslint/no-unsafe-argument': 'warn'
  }
}
