module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['src/**/*.{ts,js}', '!src/main.ts', '!src/database/migrations/**'],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  setupFiles: ['reflect-metadata'],
};
