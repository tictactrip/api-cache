import { brotliCompress, brotliDecompress } from 'zlib';
import * as redis from 'redis';
import { promisify } from 'util';
import { Request } from 'express';
import { toPairs } from 'lodash';
import * as flatted from 'flatted';
import { ERedisFlag, IApiCacheConfiguration } from './types';
import { defaultConfiguration } from './config';

/**
 * @class ApiCache
 * @description Get and set redis cache for a given express route.
 */
export class ApiCache {
  private readonly redis: redis.RedisClient;
  private readonly compressAsync: (buffer: Buffer) => Promise<Buffer>;
  private readonly decompressAsync: (buffer: Buffer) => Promise<Buffer>;
  private config: IApiCacheConfiguration;
  public redisSetAsync: (key: string, value: string, flag?: ERedisFlag, expirationInMS?: number) => Promise<unknown>;
  public redisGetAsync: (key: string) => Promise<string | null>;

  /**
   * @description Constructor.
   * @param {RedisClient} redis
   * @param {IApiCacheConfiguration} config
   */
  constructor(redis: redis.RedisClient, config?: IApiCacheConfiguration) {
    this.redis = redis;
    this.config = { ...defaultConfiguration, ...config };
    this.redisSetAsync = promisify(this.redis.set).bind(this.redis);
    this.redisGetAsync = promisify(this.redis.get).bind(this.redis);
    this.compressAsync = promisify(brotliCompress);
    this.decompressAsync = promisify(brotliDecompress);
  }

  /**
   * @description Retrieves data from cache.
   * @param {Request} req Express request to build redis key
   * @returns {Promise<unknown>} Cache data
   */
  async getCache(req: Request): Promise<unknown> {
    const rawData: string | null = await this.redisGetAsync(this.buildKey(req));

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
   * @returns Promise<string>
   */
  async setCache(req: Request, data: unknown, durationInMS: number = this.config.expirationInMS): Promise<boolean> {
    const compressedData: Buffer = await this.compressAsync(Buffer.from(flatted.stringify(data)));

    const redisOutput = await this.redisSetAsync(
      this.buildKey(req),
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
