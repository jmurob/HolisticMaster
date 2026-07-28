module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/?(*.)+(test).[tj]s?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  clearMocks: true,
  collectCoverageFrom: ['src/lib/**/*.ts', '!src/**/*.d.ts'],
  coverageThreshold: {
    './src/lib/map-utils.ts': {
      branches: 95,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
