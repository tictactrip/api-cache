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
import { ApiCache } from 'apiCache';
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

// You can set the cached response for your Express Request for the next 20 days
apiCache.set(request, dataToCache, 1000*60*60*24*20)

// You can get the cached response for your Express Request, it will return null if no resposne is cached.
const cachedData = apiCache.get(request)

```

### Key structure

By default, redis keys follow this pattern (note that all keys are in lowercase).

```
{prefix}{http_method}___{path}___{query}
```


First example:

`GET /users/9090/infos` becomes 
```
GET get__users/9090/infos__
```


Second example:

`GET /users/9090/infos?param1=true&param2=str` becomes
```
get__users/9090/infos__param1trueparam2str
```

### Configuration

You can pass an optional configuration on instantiation. It allows you to modify the prefix of redis keys and also to edit the default cache duration.
**By default** there is `no prefix and the cache duration is set on `15 days`.

```ts
import { IApiCacheConfiguration } from './types';

const myConfiguration: IApiCacheConfiguration = {
  prefix : 'myprefix__',
  expirationInMS : 1000*60*60
}

const redisClient = redis.createClient();

// Create your ApiCache instance
const apiCache = new ApiCache(redisClient,myConfiguration);
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
