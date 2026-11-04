const path = require('node:path');
const { createCjsPreset } = require('jest-preset-angular/presets');

/** Tests del portal separado, con las dependencias compartidas resueltas en ../src. */
module.exports = {
  ...createCjsPreset({ tsconfig: '<rootDir>/portal-postulantes/tsconfig.json' }),
  rootDir: path.join(__dirname, '..'),
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testMatch: ['<rootDir>/portal-postulantes/src/**/*.spec.ts'],
  resolver: '<rootDir>/portal-postulantes/jest.resolver.cjs',
};
