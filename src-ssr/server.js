/**
 * Quasar SSR — server.js
 * Location: src-ssr/server.js
 */

import express from 'express';
import {
  ssrClose,
  ssrCreate,
  ssrListen,
  ssrServeStaticContent,
  ssrRenderPreloadTag,
} from 'quasar/wrappers';

export const create = ssrCreate(() => {
  const app = express();
  app.disable('x-powered-by');
  return app;
});

export const listen = ssrListen(async ({ app, port }) => {
  return app.listen(port, () => {
    if (process.env.PROD) {
      console.log(`Server listening at port ${port}`);
    }
  });
});

export const close = ssrClose(({ listenResult }) => {
  return listenResult.close();
});

export const serveStaticContent = ssrServeStaticContent((params) => {
  const publicFolder = params?.folders?.public;
  if (typeof publicFolder !== 'string' || !publicFolder) {
    return (_req, _res, next) => next();
  }
  return express.static(publicFolder, { maxAge: 0 });
});

export const renderPreloadTag = ssrRenderPreloadTag((file) => {
  if (file.endsWith('.js')) {
    return `<link rel="modulepreload" href="${file}" crossorigin>`;
  }
  if (file.endsWith('.css')) {
    return `<link rel="stylesheet" href="${file}">`;
  }
  return '';
});
