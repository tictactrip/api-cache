interface IApiCacheConfiguration {
  expirationInMS: number;
  prefix: string;
}

enum ERedisFlag {
  EXPIRATION_IN_MS = 'PX',
  TIMESTAMP_MS = 'EXAT',
  WRITE_IF_EXISTS = 'XX',
  WRITE_IF_NOT_EXISTS = 'NX',
}

export { IApiCacheConfiguration, ERedisFlag };
