import { brotliCompress, brotliDecompress } from 'zlib';
import { Redis } from 'ioredis';
import { promisify } from 'util';
import { Request } from 'express';
import { toPairs } from 'lodash';
import * as flatted from 'flatted';
import { EHttpMethod, ERedisFlag, IApiCacheConfiguration, TKeyBuilder } from './types';
import { defaultConfiguration } from './config';

/**
 * @class ApiCache
 * @description Get and set redis cache for a given express route.
 */
export class ApiCache {
  public readonly redis: Redis;
  private readonly compressAsync: (buffer: Buffer) => Promise<Buffer>;
  private readonly decompressAsync: (buffer: Buffer) => Promise<Buffer>;
  private config: IApiCacheConfiguration;

  /**
   * @description Constructor.
   * @param {Redis} redis
   * @param {IApiCacheConfiguration} config
   */
  constructor(redis: Redis, config?: IApiCacheConfiguration) {
    this.redis = redis;
    this.config = { ...defaultConfiguration, ...config };
    this.compressAsync = promisify(brotliCompress);
    this.decompressAsync = promisify(brotliDecompress);
  }

  /**
   * @description Retrieves data from cache.
   * @param {Request} req Express request to build redis key
   * @returns {Promise<unknown>} Cache data
   */
  async getCache(req: Request): Promise<unknown> {
    const keyBuilder: TKeyBuilder = !!this.config.keyBuilders?.[req.method as EHttpMethod]
      ? <TKeyBuilder>this.config.keyBuilders[req.method as EHttpMethod]
      : this.buildKey.bind(this);

    const rawData: string | null = await this.redis.get(keyBuilder(req, this.config.prefix));

    if (rawData) {
      const buffer: Buffer = await this.decompressAsync(Buffer.from(rawData, 'base64'));

      return flatted.parse(buffer.toString());
    }

    return;
  }

  /**
   * @description Stores data into cache.
   * @param {Request} req Express request associated with the data
   * @param {unknown} data - Data to cache
   * @param {number} durationInMS Cache expiration in ms
   * @returns Promise<boolean>
   */
  async setCache(req: Request, data: unknown, durationInMS: number = this.config.expirationInMS): Promise<boolean> {
    const keyBuilder: TKeyBuilder = !!this.config.keyBuilders?.[req.method as EHttpMethod]
      ? <TKeyBuilder>this.config.keyBuilders[req.method as EHttpMethod]
      : this.buildKey.bind(this);

    const compressedData: Buffer = await this.compressAsync(Buffer.from(flatted.stringify(data)));

    const redisOutput = await this.redis.set(
      keyBuilder(req, this.config.prefix),
      compressedData.toString('base64'),
      ERedisFlag.EXPIRATION_IN_MS,
      durationInMS,
    );

    return redisOutput === 'OK';
  }

  /**
   * @description Builds the redis key associated with the corresponding request.
   * @param {Request} req Express request
   * @returns {string} key used by redisClient
   * @private
   */
  private buildKey(req: Request): string {
    const generatedQuery = toPairs(req.query)
      .map((pair: [string, unknown]) => pair.join(''))
      .join('');

    return `${this.config.prefix}${req.method}__${req.path.slice(1)}__${generatedQuery}`.toLowerCase();
  }
}
