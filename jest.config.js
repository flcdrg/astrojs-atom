export const preset = 'ts-jest';
export const transform = {
  '^.+\\.ts?$': 'ts-jest',
};
export const testEnvironment = 'node';
export const transformIgnorePatterns = ['<rootDir>/node_modules/'];