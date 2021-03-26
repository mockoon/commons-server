import ObjectId from 'bson-objectid';
import { format as dateFormat } from 'date-fns';
import { Request } from 'express';
import faker from 'faker';
import { compile as hbsCompile, HelperOptions, SafeString } from 'handlebars';
import { get as objectGet } from 'object-path';
import { OldTemplatingHelpers } from './old-templating-helpers';
import { IsEmpty, RandomInt, ToBase64 } from './utils';

/**
 * Handlebars may insert its own `options` object as the last argument.
 * Be careful when retrieving `defaultValue` or any other last param.
 *
 * use:
 * if (typeof defaultValue === 'object') {
 *   defaultValue = '';
 * }
 *
 * or:
 * args[args.length - 1]
 */
const TemplateParserHelpers = function (request: Request) {
  return {
    ...OldTemplatingHelpers,
    // faker wrapper
    faker: function (...args: any[]) {
      const hbsOptions: HelperOptions & hbs.AST.Node = args[args.length - 1];

      let fakerName: string;

      if (args.length === 1) {
        fakerName = '';
      } else {
        fakerName = args[0];
      }

      const [fakerPrimaryMethod, fakerSecondaryMethod] = fakerName.split('.');
      let errorMessage = `${fakerName} is not a valid Faker method`;
      // check faker helper name pattern
      if (
        !fakerName ||
        !fakerName.match(/^[a-z]+\.[a-z]+$/i) ||
        !fakerPrimaryMethod ||
        !fakerSecondaryMethod ||
        !faker[fakerPrimaryMethod] ||
        !faker[fakerPrimaryMethod][fakerSecondaryMethod]
      ) {
        if (!fakerName) {
          errorMessage = 'Faker method name is missing';
        }

        throw new Error(
          `${errorMessage} (valid: "address.zipCode", "date.past", etc) line ${
            hbsOptions.loc &&
            hbsOptions.loc &&
            hbsOptions.loc.start &&
            hbsOptions.loc.start.line
          }`
        );
      }

      const fakerFunction = faker[fakerPrimaryMethod][fakerSecondaryMethod];
      const fakerArgs = args.slice(1, args.length - 1);

      // push hbs named parameters (https://handlebarsjs.com/guide/block-helpers.html#hash-arguments) to Faker
      if (!IsEmpty(hbsOptions.hash)) {
        fakerArgs.push(hbsOptions.hash);
      }

      let fakedContent = fakerFunction(...fakerArgs);

      // do not stringify Date coming from Faker.js
      if (
        (Array.isArray(fakedContent) || typeof fakedContent === 'object') &&
        !(fakedContent instanceof Date)
      ) {
        fakedContent = JSON.stringify(fakedContent);
      }

      return new SafeString(fakedContent);
    },
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
    },
    // return one random item
    oneOf: function (itemList: string[]) {
      return faker.random.arrayElement(itemList);
    },
    // return some random item as an array (to be used in triple braces) or as a string
    someOf: function (
      itemList: string[],
      min: number,
      max: number,
      asArray = false
    ) {
      const randomItems = itemList
        .sort(() => 0.5 - Math.random())
        .slice(0, RandomInt(min, max));

      if (asArray === true) {
        return `["${randomItems.join('","')}"]`;
      }

      return randomItems;
    },
    // create an array
    array: function (...args: any[]) {
      // remove last item (handlebars options argument)
      return args.slice(0, args.length - 1);
    },
    // switch cases
    switch: function (value: any, options: HelperOptions) {
      options.data.found = false;

      options.data.switchValue =
        value instanceof SafeString ? value.toString() : value;
      const htmlContent = options.fn(options);

      return htmlContent;
    },
    // case helper for switch
    case: function (value: any, options: HelperOptions) {
      // check switch value to simulate break
      if (
        value.toString() === options.data.switchValue &&
        !options.data.found
      ) {
        options.data.found = true;

        return options.fn(options);
      }
    },
    // default helper for switch
    default: function (options: HelperOptions) {
      // if there is still a switch value show default content
      if (!options.data.found) {
        delete options.data.switchValue;

        return options.fn(options);
      }
    },
    // provide current time with format
    now: function (format: any) {
      return dateFormat(
        new Date(),
        typeof format === 'string' ? format : "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
        {
          useAdditionalWeekYearTokens: true,
          useAdditionalDayOfYearTokens: true
        }
      );
    },
    // converts the input to a base64 string
    base64: function (...args: any[]) {
      const hbsOptions: HelperOptions & hbs.AST.Node = args[args.length - 1];

      let content: string;

      if (args.length === 1) {
        content = hbsOptions.fn(hbsOptions);
      } else {
        content = args[0];
      }

      // convert content toString in case we pass a SafeString from another helper
      return new SafeString(ToBase64(content.toString()));
    },
    // adds a newline to the output
    newline: function () {
      return '\n';
    },
    // returns a compatible ObjectId
    // * if value is undefined or null returns a random ObjectId
    // * if value is defined is used a seed, can be a string, number or Buffer
    objectId: function (defaultValue: any) {
      if (typeof defaultValue === 'object') {
        defaultValue = undefined;
      }

      return new ObjectId(defaultValue).toHexString();
    },
    // concat multiple string and/or variables (like @index)
    concat: function (...args: any[]) {
      // remove handlebars options
      const toConcat = args.slice(0, args.length - 1);

      return toConcat.join('');
    },
    // Shift a date and time by a specified ammount.
    dateTimeShift: function (options: HelperOptions) {
      let date: undefined | Date | string;
      let format: undefined | string;

      if (typeof options === 'object' && options.hash) {
        date = options.hash['date'];
        format = options.hash['format'];
      }

      // If no date is specified, default to now. If a string is specified, then parse it to a date.
      const dateToShift: Date =
        date === undefined
          ? new Date()
          : typeof date === 'string'
          ? new Date(date)
          : date;

      if (typeof options === 'object' && options !== null && options.hash) {
        if (typeof options.hash['days'] === 'number') {
          dateToShift.setDate(dateToShift.getDate() + options.hash['days']);
        }
        if (typeof options.hash['months'] === 'number') {
          dateToShift.setMonth(dateToShift.getMonth() + options.hash['months']);
        }
        if (typeof options.hash['years'] === 'number') {
          dateToShift.setFullYear(
            dateToShift.getFullYear() + options.hash['years']
          );
        }
        if (typeof options.hash['hours'] === 'number') {
          dateToShift.setHours(dateToShift.getHours() + options.hash['hours']);
        }
        if (typeof options.hash['minutes'] === 'number') {
          dateToShift.setMinutes(
            dateToShift.getMinutes() + options.hash['minutes']
          );
        }
        if (typeof options.hash['seconds'] === 'number') {
          dateToShift.setSeconds(
            dateToShift.getSeconds() + options.hash['seconds']
          );
        }
      }

      return dateFormat(
        dateToShift,
        typeof format === 'string' ? format : "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
        {
          useAdditionalWeekYearTokens: true,
          useAdditionalDayOfYearTokens: true
        }
      );
    },
    // Get's the index of a search string within another string.
    indexOf: function (
      data: string | SafeString | HelperOptions,
      search: string | SafeString | HelperOptions | undefined,
      position?: number | string | SafeString | HelperOptions | undefined
    ) {
      data =
        typeof data === 'object' && !(data instanceof SafeString)
          ? ''
          : data.toString();

      search =
        (typeof search === 'object' || typeof search === 'undefined') &&
        !(search instanceof SafeString)
          ? ''
          : search.toString();

      position =
        (typeof position === 'object' || typeof position === 'undefined') &&
        !(position instanceof SafeString)
          ? undefined
          : Number(position.toString());

      if (typeof position === 'number') {
        return data.indexOf(search, position);
      } else {
        return data.indexOf(search);
      }
    },
    // Returns if the provided search string is contained in the data string.
    includes: function (
      data: string | SafeString | HelperOptions,
      search: string | SafeString | HelperOptions | undefined
    ) {
      data =
        (typeof data === 'object' || typeof data == 'undefined') &&
        !(data instanceof SafeString)
          ? ''
          : data.toString();

      search =
        (typeof search === 'object' || typeof search == 'undefined') &&
        !(search instanceof SafeString)
          ? ''
          : search.toString();

      return data.includes(search);
    },
    // Returns the substring of a string based on the passed in starting index and length.
    substr: function (
      data: string | SafeString | HelperOptions,
      from: number | string | SafeString | HelperOptions | undefined,
      length: number | string | SafeString | HelperOptions | undefined
    ) {
      data =
        typeof data === 'object' && !(data instanceof SafeString)
          ? ''
          : data.toString();

      const fromValue =
        (typeof from === 'object' || typeof from == 'undefined') &&
        !(from instanceof SafeString)
          ? 0
          : Number(from.toString());

      const lengthValue =
        (typeof length === 'object' || typeof length == 'undefined') &&
        !(length instanceof SafeString)
          ? undefined
          : Number(length.toString());

      if (typeof lengthValue !== 'undefined') {
        return data.substr(fromValue, lengthValue);
      } else {
        return data.substr(fromValue);
      }
    },
    // set a variable to be used in the template
    setVar: function (
      name: string,
      value: string | number | SafeString | HelperOptions,
      options: HelperOptions
    ) {
      if (typeof name === 'object') {
        return;
      }

      // return if no value provided
      if (
        (typeof value === 'object' && !(value instanceof SafeString)) ||
        !value
      ) {
        return;
      }

      // we are at the root level
      if (options.data.root) {
        options.data.root[name] = value;
      } else {
        options.data[name] = value;
      }
    },
    // Handlebars hook when a helper is missing
    helperMissing: function () {
      return '';
    }
  };
};

/**
 * Parse a content with Handlebars
 *
 * @param content
 * @param request
 */
export const TemplateParser = function (
  content: string,
  request: Request
): string {
  try {
    return hbsCompile(content)(
      {},
      {
        helpers: TemplateParserHelpers(request)
      }
    );
  } catch (error) {
    throw error;
  }
};
