import { Environment } from '@mockoon/commons';
import { Request } from 'express';
import { SafeString } from 'handlebars';
import { get as objectGet } from 'object-path';

export const RequestHelpers = function (
  request: Request,
  environment: Environment
) {
  return {
    // get json property from body
    body: function (path: string, defaultValue: string, stringify: boolean) {
      // no path provided
      if (typeof path === 'object') {
        path = '';
      }

      // no default value provided
      if (typeof defaultValue === 'object') {
        defaultValue = '';
      }

      // no value for stringify provided
      if (typeof stringify === 'object') {
        stringify = false;
      }

      // if no path has been provided we want the full raw body as is
      if (!path) {
        return new SafeString(request.body);
      }

      let requestToParse;

      if (request.bodyJSON) {
        requestToParse = request.bodyJSON;
      } else if (request.bodyForm) {
        requestToParse = request.bodyForm;
      }

      if (!requestToParse) {
        return new SafeString(
          stringify ? JSON.stringify(defaultValue) : defaultValue
        );
      }

      let value = objectGet(requestToParse, path);
      value = value === undefined ? defaultValue : value;

      if (Array.isArray(value) || typeof value === 'object') {
        stringify = true;
      }

      return new SafeString(stringify ? JSON.stringify(value) : value);
    },
    // use params from url /:param1/:param2
    urlParam: function (paramName: string) {
      return request.params[paramName];
    },
    // use params from query string ?param1=xxx&param2=yyy
    queryParam: function (
      path: string,
      defaultValue: string,
      stringify: boolean
    ) {
      // no path provided
      if (typeof path === 'object') {
        path = '';
      }

      // no default value provided
      if (typeof defaultValue === 'object' || !defaultValue) {
        defaultValue = '';
      }

      // no value for stringify provided
      if (typeof stringify === 'object') {
        stringify = false;
      }

      if (!request.query) {
        return new SafeString(
          stringify ? JSON.stringify(defaultValue) : defaultValue
        );
      }

      // if no path has been provided we want the full query string object as is
      if (!path) {
        return new SafeString(JSON.stringify(request.query));
      }

      let value = objectGet(request.query, path);
      value = value === undefined ? defaultValue : value;

      if (Array.isArray(value) || typeof value === 'object') {
        stringify = true;
      }

      return new SafeString(stringify ? JSON.stringify(value) : value);
    },
    // use content from request header
    header: function (headerName: string, defaultValue: string) {
      if (typeof defaultValue === 'object') {
        defaultValue = '';
      }

      return request.get(headerName) || defaultValue;
    },
    // use value of cookie
    cookie: function (key: string, defaultValue: string) {
      if (typeof defaultValue === 'object') {
        defaultValue = '';
      }

      return request.cookies[key] || defaultValue;
    },
    // use request baseUrl
    baseUrl: function () {
      const prefix = !!environment.endpointPrefix
        ? `/${environment.endpointPrefix}`
        : '';
      const protocol = environment.https ? 'https' : 'http';

      return `${protocol}://${request.hostname}:${environment.port}${prefix}`;
    },
    // use request hostname
    hostname: function () {
      return request.hostname;
    },
    // use request ip
    ip: function () {
      return request.ip;
    },
    // use request method
    method: function () {
      return request.method;
    }
  };
};
