import Redis from 'ioredis';
import { Request } from 'express';
import { snakeCase } from 'lodash';
import { ApiCache, EHttpMethod, ERedisFlag, TKeyBuilder } from '../../src';

describe('apiCache.ts', () => {
  const redisClient = new Redis();

  afterEach(jest.clearAllMocks);

  afterAll(async () => {
    jest.restoreAllMocks();
    await redisClient.quit();
  });

  describe('#getCache', () => {
    it('should return cache data', async () => {
      const apiCache = new ApiCache(redisClient);

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

      const redisGetSpy = jest
        .spyOn(apiCache.redis, 'get')
        .mockResolvedValue(
          'G6UBABwHzrk8JjkKvE79lCJbe0asK9WbzSc3QNVvNItOV9/7v/nCMbHA7O43ps4BvKZRBGGZnjR1WOS09YUIh0TRWnqJcLhZzxAeeAqKvXvTgm8SaBqebQQRSUsgjNRVcAyhP4HQ8v8CG1FAdbk/jQdAlJG/BBit6lel6RpI0Osvb0RD7uRlDTgWU6tlcbnUe14Sg7UOvamb3X+Zn0kOXtctFGoeVBmhqoqmjzENrEM+EY73j6QsxEl1uCc/L8AgTstzoDCz5+OxLHMWcqejn9ZN7Mv0Q3tfyHAi4CSMIth9yBk=',
        );

      const res = await apiCache.getCache({ query: {}, method: 'GET', path: '/langage/SGML/infos' } as Request);

      expect(redisGetSpy).toBeCalledTimes(1);
      expect(redisGetSpy).toHaveBeenNthCalledWith(1, 'get__langage/sgml/infos__');
      expect(res).toStrictEqual(data);
    });

    it('should return undefined cache data', async () => {
      const apiCache = new ApiCache(redisClient);
      const redisGetSpy = jest.spyOn(apiCache.redis, 'get').mockResolvedValue(null);

      const res = await apiCache.getCache({
        query: {},
        method: 'GET',
        path: '/langage/invalid/infos',
      } as Request);

      expect(redisGetSpy).toBeCalledTimes(1);
      expect(redisGetSpy).toHaveBeenNthCalledWith(1, 'get__langage/invalid/infos__');
      expect(res).toStrictEqual(undefined);
    });

    it('should take into account keyBuilders provided in the configuration', async () => {
      const mockPrefix = 'prefix';
      const getKeyBuilder: TKeyBuilder = (req: Request, prefix: string) =>
        `${prefix}_${req.method}_${req.path.split('/').join('-')}`;
      const mockGetKeyBuilder: TKeyBuilder = jest.fn().mockImplementation(getKeyBuilder);
      const apiCache = new ApiCache(redisClient, {
        expirationInMS: 123,
        prefix: mockPrefix,
        keyBuilders: {
          [EHttpMethod.GET]: mockGetKeyBuilder,
        },
      });

      const mockRequest: Request = <Request>{ query: {}, method: 'GET', path: '/langage/SGML/infos' };

      const redisGetSpy = jest
        .spyOn(apiCache.redis, 'get')
        .mockResolvedValue(
          'G6UBABwHzrk8JjkKvE79lCJbe0asK9WbzSc3QNVvNItOV9/7v/nCMbHA7O43ps4BvKZRBGGZnjR1WOS09YUIh0TRWnqJcLhZzxAeeAqKvXvTgm8SaBqebQQRSUsgjNRVcAyhP4HQ8v8CG1FAdbk/jQdAlJG/BBit6lel6RpI0Osvb0RD7uRlDTgWU6tlcbnUe14Sg7UOvamb3X+Zn0kOXtctFGoeVBmhqoqmjzENrEM+EY73j6QsxEl1uCc/L8AgTstzoDCz5+OxLHMWcqejn9ZN7Mv0Q3tfyHAi4CSMIth9yBk=',
        );

      await apiCache.getCache(mockRequest);

      expect(redisGetSpy).toBeCalledTimes(1);
      expect(mockGetKeyBuilder).toBeCalledTimes(1);
      expect(mockGetKeyBuilder).toHaveBeenNthCalledWith(1, mockRequest, mockPrefix);
      expect(redisGetSpy).toHaveBeenNthCalledWith(1, getKeyBuilder(mockRequest, mockPrefix));
    });
  });

  describe('#setCache', () => {
    const mockData = {
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

    it('should store cache data', async () => {
      const apiCache = new ApiCache(redisClient);
      const redisSetSpy = jest.spyOn(apiCache.redis, 'set').mockResolvedValue('GET_langage/XAML/infos_');

      await apiCache.setCache(
        { query: {}, method: 'GET', path: '/langage/XML/infos' } as Request,
        mockData,
        2592000000,
      );

      expect(redisSetSpy).toBeCalledTimes(1);
      expect(redisSetSpy).toHaveBeenNthCalledWith(
        1,
        'get__langage/xml/infos__',
        'G6UBABwHzrk8JjkKvE79lCJbe0asK9WbzSc3QNVvNItOV9/7v/nCMbHA7O43ps4BvKZRBGGZnjR1WOS09YUIh0TRWnqJcLhZzxAeeAqKvXvTgm8SaBqebQQRSUsgjNRVcAyhP4HQ8v8CG1FAdbk/jQdAlJG/BBit6lel6RpI0Osvb0RD7uRlDTgWU6tlcbnUe14Sg7UOvamb3X+Zn0kOXtctFGoeVBmhqoqmjzENrEM+EY73j6QsxEl1uCc/L8AgTstzoDCz5+OxLHMWcqejn9ZN7Mv0Q3tfyHAi4CSMIth9yBk=',
        ERedisFlag.EXPIRATION_IN_MS,
        2592000000,
      );
    });

    it('should take into account keyBuilders provided in the configuration', async () => {
      const mockPrefix = 'prefix';
      const postKeyBuilder: TKeyBuilder = (req: Request, prefix: string) =>
        `${prefix}_${req.method}_${snakeCase(req.body.data)}`;
      const mockPostKeyBuilder: TKeyBuilder = jest.fn().mockImplementation(postKeyBuilder);
      const apiCache = new ApiCache(redisClient, {
        expirationInMS: 123,
        prefix: mockPrefix,
        keyBuilders: {
          [EHttpMethod.POST]: mockPostKeyBuilder,
        },
      });

      const mockRequest: Request = <Request>{
        query: {},
        method: 'POST',
        path: '/langage/SGML/infos',
        body: { data: 'this is data' },
      };

      const redisSetSpy = jest.spyOn(apiCache.redis, 'set').mockResolvedValue('OK');

      await apiCache.setCache(mockRequest, mockData);

      expect(mockPostKeyBuilder).toBeCalledTimes(1);
      expect(mockPostKeyBuilder).toHaveBeenNthCalledWith(1, mockRequest, mockPrefix);
      expect(redisSetSpy).toBeCalledTimes(1);
      expect(redisSetSpy).toHaveBeenNthCalledWith(
        1,
        postKeyBuilder(mockRequest, mockPrefix),
        'G6UBABwHzrk8JjkKvE79lCJbe0asK9WbzSc3QNVvNItOV9/7v/nCMbHA7O43ps4BvKZRBGGZnjR1WOS09YUIh0TRWnqJcLhZzxAeeAqKvXvTgm8SaBqebQQRSUsgjNRVcAyhP4HQ8v8CG1FAdbk/jQdAlJG/BBit6lel6RpI0Osvb0RD7uRlDTgWU6tlcbnUe14Sg7UOvamb3X+Zn0kOXtctFGoeVBmhqoqmjzENrEM+EY73j6QsxEl1uCc/L8AgTstzoDCz5+OxLHMWcqejn9ZN7Mv0Q3tfyHAi4CSMIth9yBk=',
        ERedisFlag.EXPIRATION_IN_MS,
        123,
      );
    });
  });
});
