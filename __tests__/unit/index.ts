import * as redis from 'redis';
import { Request } from 'express';
import { ApiCache, ERedisFlag } from '../../src';

describe('apiCache.ts', () => {
  let redisClient: redis.RedisClient;
  let apiCache: ApiCache;

  beforeAll(() => {
    jest.spyOn(redis, 'createClient').mockReturnValue(<redis.RedisClient>{
      get: (key: string): boolean => true,
      set: (key: string, value: string): boolean => true,
      quit: (): boolean => true,
    });
    redisClient = redis.createClient();
    apiCache = new ApiCache(redisClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#getCache', () => {
    it('should return cache data', async () => {
      const data = {
        glossary: {
          title: 'example glossary',
          GlossDiv: {
            title: 'S',
            GlossList: {
              GlossEntry: {
                ID: 'SGML',
                SortAs: 'SGML',
                GlossTerm: 'Standard Generalized Markup Language',
                Acronym: 'SGML',
                Abbrev: 'ISO 8879:1986',
                GlossDef: {
                  para: 'A meta-markup language, used to create markup languages such as DocBook.',
                  GlossSeeAlso: ['GML', 'XML'],
                },
                GlossSee: 'markup',
              },
            },
          },
        },
      };

      const redisGetAsyncSpy = jest
        .spyOn(apiCache, 'redisGetAsync')
        .mockResolvedValue(
          'G6UBABwHzrk8JjkKvE79lCJbe0asK9WbzSc3QNVvNItOV9/7v/nCMbHA7O43ps4BvKZRBGGZnjR1WOS09YUIh0TRWnqJcLhZzxAeeAqKvXvTgm8SaBqebQQRSUsgjNRVcAyhP4HQ8v8CG1FAdbk/jQdAlJG/BBit6lel6RpI0Osvb0RD7uRlDTgWU6tlcbnUe14Sg7UOvamb3X+Zn0kOXtctFGoeVBmhqoqmjzENrEM+EY73j6QsxEl1uCc/L8AgTstzoDCz5+OxLHMWcqejn9ZN7Mv0Q3tfyHAi4CSMIth9yBk=',
        );

      const res = await apiCache.getCache({ query: {}, method: 'GET', path: '/langage/SGML/infos' } as Request);

      expect(redisGetAsyncSpy).toBeCalledTimes(1);
      expect(redisGetAsyncSpy).toHaveBeenNthCalledWith(1, 'get__langage/sgml/infos__');
      expect(res).toStrictEqual(data);
    });

    it('should return undefined cache data', async () => {
      const redisGetAsyncSpy = jest.spyOn(apiCache, 'redisGetAsync').mockResolvedValue(null);

      const res = await apiCache.getCache({
        query: {},
        method: 'GET',
        path: '/langage/invalid/infos',
      } as Request);

      expect(redisGetAsyncSpy).toBeCalledTimes(1);
      expect(redisGetAsyncSpy).toHaveBeenNthCalledWith(1, 'get__langage/invalid/infos__');
      expect(res).toStrictEqual(undefined);
    });
  });

  describe('#setCache', () => {
    it('should store cache data', async () => {
      const redisSetAsyncSpy = jest.spyOn(apiCache, 'redisSetAsync').mockResolvedValue('GET_langage/XAML/infos_');

      const data = {
        glossary: {
          title: 'example glossary',
          GlossDiv: {
            title: 'S',
            GlossList: {
              GlossEntry: {
                ID: 'SGML',
                SortAs: 'SGML',
                GlossTerm: 'Standard Generalized Markup Language',
                Acronym: 'SGML',
                Abbrev: 'ISO 8879:1986',
                GlossDef: {
                  para: 'A meta-markup language, used to create markup languages such as DocBook.',
                  GlossSeeAlso: ['GML', 'XML'],
                },
                GlossSee: 'markup',
              },
            },
          },
        },
      };

      await apiCache.setCache({ query: {}, method: 'GET', path: '/langage/XML/infos' } as Request, data, 2592000000);

      expect(redisSetAsyncSpy).toBeCalledTimes(1);
      expect(redisSetAsyncSpy).toHaveBeenNthCalledWith(
        1,
        'get__langage/xml/infos__',
        'G6UBABwHzrk8JjkKvE79lCJbe0asK9WbzSc3QNVvNItOV9/7v/nCMbHA7O43ps4BvKZRBGGZnjR1WOS09YUIh0TRWnqJcLhZzxAeeAqKvXvTgm8SaBqebQQRSUsgjNRVcAyhP4HQ8v8CG1FAdbk/jQdAlJG/BBit6lel6RpI0Osvb0RD7uRlDTgWU6tlcbnUe14Sg7UOvamb3X+Zn0kOXtctFGoeVBmhqoqmjzENrEM+EY73j6QsxEl1uCc/L8AgTstzoDCz5+OxLHMWcqejn9ZN7Mv0Q3tfyHAi4CSMIth9yBk=',
        ERedisFlag.EXPIRATION_IN_MS,
        2592000000,
      );
    });
  });
});
