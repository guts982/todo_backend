Dev

compile ts files to dist using, npx tsc

#### Alias

In package.json, in dev its "./src", but for production, right before tsc compile or build, or running run start in this case, its "./dist"

 "_moduleAliases":{

    "@":"./src"

  }



### Further Integrations tests to do:

* Project structure : models, controllers, middlewares, routes, utils, views, services
* 


    Queue:

    •Bull queue - Using Redis, RabbitMQ or MySQL as the backing store. Features jobs, queues, and a job processing API similar to Laravel's queue system.

    Filesystem:

    •Multer - Node middleware for handling multipart/form-data, which is primarily used for uploading files. Similar to Laravel's file upload helpers and classes.

    Caching:

    •Node-cache - Cache node.js objects in memory or vs disk cache. Similar toLaravel's cache helper.

    •Redis cache - Cache data in Redis in-memory key-value store. Similar to Laravel's Redis cache implementation.

    Authentication(either of):

    •Passport - Complete authentication middleware for Express. Supports local, Facebook, Twitter, Google, etc strategies.

    •JsonWebTokens - Json Web Tokens are used to implement authentication in APIs. Package provides helpers to generate and validate JWTs.


    Middleware:

    •Helmet - Add security-related HTTP headers.

    •Compression - Gzip/deflate compress HTTP responses.

    Similar to Laravel's middleware.

    Some other popular packages for features like:

    •Logging

    •Testing

    •CORS

    •Cron jobs

    •Caching

    •sessions


#### Further lookinto

* Loopback.js
