import { IApiCacheConfiguration } from './types';

const defaultConfiguration: IApiCacheConfiguration = {
  expirationInMS: 1000 * 60 * 60 * 24,
  prefix: '',
};

export { defaultConfiguration };
