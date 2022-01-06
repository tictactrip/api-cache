# api-cache

[![Dependencies][dependencies-badge]][dependencies]
[![Build][build-badge]][build]
[![License][license-badge]][license]
[![PRs Welcome][prs-badge]][prs]

## Description

This package provides get and set methods to interact with redis cache for a given express route.

## Install

```
yarn add @tictactrip/api-cache
```

## How to use it?

```ts
import { ApiCache } from '@tictactrip/api-cache';
import { redisClient } from 'redis';
import { Request } from 'express';

// Redis connection
const redisClient = redis.createClient();

// Create your ApiCache instance
const apiCache = new ApiCache(redisClient);

const dataToCache = {
    name: "apiCache",
    description: "I can get and set on your redis cache."
}

// Caches "dataToCache" for 20 days
apiCache.set(request, dataToCache, 1000 * 60 * 60 * 24 * 20)

// Gets the data stored (returns null, if nothing found)
const cachedData = apiCache.get(request);
```

## Key structure

### Default
By default, Redis keys follow the below pattern (keys are in lowercase).

```
{prefix}{http_method}___{path}___{query}
```

**Examples**

1. Example (route without query string)

Route: `GET /users/9090/infos`
Generated key: `get__users/9090/infos__`

2. Example (route with query string)

Route: `GET /users/9090/infos?param1=true&param2=str`
Generated key: `get__users/9090/infos__param1trueparam2str`


### Custom
You can, however, define a key builder function of type `TKeyBuilder` that is provided the express `Request` and the prefix, and returns a string. If there is no key builder for a method, it just uses the default redis key builder.

```ts
import * as redis from 'redis';
import { Request } from 'express';
import { IApiCacheConfiguration, TKeyBuilder, EHttpMethod } from '@tictactrip/api-cache';

const getKeyBuilder: TKeyBuilder = (req: Request, prefix: string) => `${prefix}_${req.path}`;
const postKeyBuilder: TKeyBuilder = (req: Request, prefix: string) => `${prefix}_${req.path}_{req.body.data}$`;

const redisClient: redis.RedisClient = redis.createClient();

const configuration: IApiCacheConfiguration = {
  prefix: 'prefix',
  expirationInMS: 12_000_000,
  keyBuilders: {
    [EHttpMethod.GET]: getKeyBuilder,
    [EHttpMethod.POST]: postKeyBuilder,
  }
}

const apiCache = new ApiCache(redisClient, configuration);
```

## Configuration

You can pass an optional configuration on instantiation. It allows you to modify the prefix of Redis keys and also to edit the default cache duration.

**By default**, the prefix is an empty string (`''`) and the cache duration is set on `1 day`.

```ts
import { IApiCacheConfiguration } from '@tictactrip/api-cache';

const configuration: IApiCacheConfiguration = {
    prefix : 'myprefix__',
    expirationInMS : 1000 * 60 * 60
}

const redisClient = redis.createClient();

// Create your ApiCache instance
const apiCache = new ApiCache(redisClient, configuration);
```

## Scripts

Run using yarn run `<script>` command.

    clean       - Remove temporarily folders.
    build       - Compile source files.
    build:watch - Interactive watch mode, compile sources on change.
    lint        - Lint source files.
    lint:fix    - Fix lint source files.
    test        - Runs all tests with coverage.
    test:watch  - Interactive watch mode, runs tests on change.

## License

MIT © [Tictactrip](https://www.tictactrip.eu)

[dependencies-badge]: https://img.shields.io/david/tictactrip/api-cache
[dependencies]: https://img.shields.io/david/tictactrip/api-cache
[build-badge]: https://github.com/tictactrip/api-cache/workflows/Test/badge.svg
[build]: https://github.com/tictactrip/api-cache/actions?query=workflow%3ATest+branch%3Amaster
[license-badge]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[license]: https://github.com/tictactrip/api-cache/blob/master/LICENSE
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs]: http://makeapullrequest.com
