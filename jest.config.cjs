const { createCjsPreset } = require('jest-preset-angular/presets');

/** Tests unitarios con Jest + jest-preset-angular (entorno jsdom, Angular sin zone.js). */
module.exports = {
  ...createCjsPreset({ tsconfig: '<rootDir>/tsconfig.spec.json' }),
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  collectCoverageFrom: [
    'src/app/**/*.ts',
    '!src/app/**/*.spec.ts',
    '!src/app/**/*.routes*.ts',
    '!src/app/app.config*.ts',
  ],
  coverageDirectory: 'coverage',
};
