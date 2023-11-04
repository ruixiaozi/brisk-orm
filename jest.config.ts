export default {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  coverageThreshold: {
    // 所有文件总的覆盖率要求
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  // 用排除法，解决lint-stage增量时的问题
  collectCoverageFrom: [
    '!**/*.d.ts',
    '!**/*.{js,jsx}',
    '!**/*.json',
    '!**/node_modules/**',
    '!**/example/**',
    '!**/*.config.ts',
    '!**/index.ts',
    '!src/types/*.ts',
    '!src/decorator/baseDao.ts',
    '!src/core/manage.ts',
  ],
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
        compiler: 'ttypescript',
      },
    ],
  },
  maxWorkers: 1,
};
