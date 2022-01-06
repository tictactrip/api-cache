import { Request } from 'express';

/** An allowed subset of HTTP methods */
enum EHttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

/**
 * @description Function to be used to build the redis key. It defaults to a function building a string from the prefix followed by
 * 1. The method
 * 2. The path
 * 3. The URL parameters
 * @param {Request} req An express request.
 * @param {prefix} prefix The prefix provided in the apiCache constructor's configuration. Defaults to empty string ''.
 * @returns {string} Returns a string used to write / fetch the data in redis.
 */
type TKeyBuilder = (req: Request, prefix: string) => string;

/**
 * Mapping between an HTTP method (as defined by the EHttpMethod type) and a TKeyBuilder function used to build the redis key.
 */
type TKeyBuilders = {
  [key in EHttpMethod]?: TKeyBuilder;
};

interface IApiCacheConfiguration {
  expirationInMS: number;
  prefix: string;
  keyBuilders?: TKeyBuilders;
}

enum ERedisFlag {
  EXPIRATION_IN_MS = 'PX',
  TIMESTAMP_MS = 'EXAT',
  WRITE_IF_EXISTS = 'XX',
  WRITE_IF_NOT_EXISTS = 'NX',
}

export { IApiCacheConfiguration, ERedisFlag, TKeyBuilders, EHttpMethod, TKeyBuilder };
