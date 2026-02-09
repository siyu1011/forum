module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/app.ts',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 30000,
  moduleNameMapper: {
    '^uuid$': '<rootDir>/src/__mocks__/uuid.ts',
  },
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
};
