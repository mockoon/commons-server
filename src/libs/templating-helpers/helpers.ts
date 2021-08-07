import ObjectId from 'bson-objectid';
import { format as dateFormat } from 'date-fns';
import faker from 'faker';
import { HelperOptions, SafeString } from 'handlebars';
import { EOL } from 'os';
import { fromSafeString, RandomInt, ToBase64 } from '../utils';

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
export const Helpers = {
  repeat: function (min: number, max: number, options: HelperOptions | any) {
    let content = '';
    let count = 0;
    const data = { ...options };

    if (arguments.length === 3) {
      // If given two numbers then pick a random one between the two
      count = RandomInt(min, max);
    } else if (arguments.length === 2) {
      // If given one number then just use it as a fixed repeat total
      options = max;
      count = min;
    } else {
      throw new Error('The repeat helper requires a numeric param');
    }

    for (let i = 0; i < count; i++) {
      // You can access these in your template using @index, @total, @first, @last
      data.index = i;
      data.total = count;
      data.first = i === 0;
      data.last = i === count - 1;

      // By using 'this' as the context the repeat block will inherit the current scope
      content = content + options.fn(this, { data });

      if (options.hash.comma !== false) {
        // Trim any whitespace left by handlebars and add a comma if it doesn't already exist,
        // also trim any trailing commas that might be at the end of the loop
        content = content.trimRight();
        if (i < count - 1 && content.charAt(content.length - 1) !== ',') {
          content += ',';
        } else if (
          i === count - 1 &&
          content.charAt(content.length - 1) === ','
        ) {
          content = content.slice(0, -1);
        }
        content += EOL;
      }
    }

    return content;
  },
  // return one random item
  oneOf: function (itemList: string[]) {
    return itemList[RandomInt(0, itemList.length - 1)];
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
    if (value.toString() === options.data.switchValue && !options.data.found) {
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
      date = fromSafeString(options.hash['date']);
      format = fromSafeString(options.hash['format']);
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

  int: function (...args: any[]) {
    const options: { min?: number; max?: number; precision?: number } = {
      precision: 1
    };

    if (args.length >= 2 && typeof args[0] === 'number') {
      options.min = args[0];
    }

    if (args.length >= 3 && typeof args[1] === 'number') {
      options.max = args[1];
    }

    return faker.random.number(options);
  },
  float: function (...args: any[]) {
    const options: { min?: number; max?: number; precision?: number } = {
      precision: Math.pow(10, -10)
    };

    if (args.length >= 2 && typeof args[0] === 'number') {
      options.min = args[0];
    }

    if (args.length >= 3 && typeof args[1] === 'number') {
      options.max = args[1];
    }

    return faker.random.number(options);
  },
  date: function (...args: any[]) {
    let from, to, format;

    if (
      args.length >= 3 &&
      typeof args[0] === 'string' &&
      typeof args[1] === 'string'
    ) {
      from = args[0];
      to = args[1];

      const randomDate = faker.date.between(from, to);

      if (args.length === 4 && typeof args[2] === 'string') {
        format = args[2];

        return dateFormat(randomDate, format, {
          useAdditionalWeekYearTokens: true,
          useAdditionalDayOfYearTokens: true
        });
      }

      return randomDate.toString();
    }

    return '';
  },
  time: function (...args: any[]) {
    let from, to, format;

    if (
      args.length >= 3 &&
      typeof args[0] === 'string' &&
      typeof args[1] === 'string'
    ) {
      from = `1970-01-01T${args[0]}`;
      to = `1970-01-01T${args[1]}`;

      if (args.length === 4 && typeof args[2] === 'string') {
        format = args[2];
      }

      return dateFormat(faker.date.between(from, to), format || 'HH:mm', {
        useAdditionalWeekYearTokens: true,
        useAdditionalDayOfYearTokens: true
      });
    }

    return '';
  },
  boolean: function () {
    return faker.random.boolean();
  },
  title: function () {
    return faker.name.prefix();
  },
  firstName: function () {
    return faker.name.firstName();
  },
  lastName: function () {
    return faker.name.lastName();
  },
  company: function () {
    return faker.company.companyName();
  },
  domain: function () {
    return faker.internet.domainName();
  },
  tld: function () {
    return faker.internet.domainSuffix();
  },
  email: function () {
    return faker.internet.email();
  },
  street: function () {
    return faker.address.streetAddress();
  },
  city: function () {
    return faker.address.city();
  },
  country: function () {
    return faker.address.country();
  },
  countryCode: function () {
    return faker.address.countryCode();
  },
  zipcode: function () {
    return faker.address.zipCode();
  },
  postcode: function () {
    return faker.address.zipCode();
  },
  lat: function () {
    return faker.address.latitude();
  },
  long: function () {
    return faker.address.longitude();
  },
  phone: function () {
    return faker.phone.phoneNumber();
  },
  color: function () {
    return faker.commerce.color();
  },
  hexColor: function () {
    return Math.floor(
      faker.random.number({ min: 0, max: 1, precision: Math.pow(10, -16) }) *
        16777215
    ).toString(16);
  },
  guid: function () {
    return faker.random.uuid();
  },
  ipv4: function () {
    return faker.internet.ip();
  },
  ipv6: function () {
    return faker.internet.ipv6();
  },
  lorem: function (...args: any[]) {
    let count: number | undefined;

    if (args.length >= 2 && typeof args[0] === 'number') {
      count = args[0];
    }

    return faker.lorem.sentence(count);
  },
  // Handlebars hook when a helper is missing
  helperMissing: function () {
    return '';
  },

  // Maths helpers
  add: function (...args: any[]) {
    // Check if there are parameters
    if (args.length === 1) {
      return '';
    }

    return args.reduce((sum, item, index) => {
      if (!isNaN(Number(fromSafeString(item))) && index !== args.length - 1) {
        return Number(sum) + Number(item);
      } else {
        return Number(sum);
      }
    });
  },

  subtract: function (...args: any[]) {
    // Check if there are parameters
    if (args.length === 1) {
      return '';
    }

    return args.reduce((sum, item, index) => {
      if (!isNaN(Number(fromSafeString(item))) && index !== args.length - 1) {
        return Number(sum) - Number(item);
      } else {
        return Number(sum);
      }
    });
  },

  multiply: function (...args: any[]) {
    // Check if there are parameters
    if (args.length === 1) {
      return '';
    }

    return args.reduce((sum, item, index) => {
      if (!isNaN(Number(fromSafeString(item))) && index !== args.length - 1) {
        return Number(sum) * Number(item);
      } else {
        return Number(sum);
      }
    });
  },

  divide: function (...args: any[]) {
    // Check if there are parameters
    if (args.length === 1) {
      return '';
    }

    return args.reduce((sum, item, index) => {
      if (
        !isNaN(Number(fromSafeString(item))) &&
        index !== args.length - 1 &&
        Number(item) !== 0
      ) {
        return Number(sum) / Number(item);
      } else {
        return Number(sum);
      }
    });
  },

  modulo: function (...args: any[]) {
    const parameters = args.slice(0, -1);
    // Check if there are parameters or if attempting to compute modulo 0
    if (parameters.length <= 1 || Number(parameters[1]) === 0) {
      return '';
    }

    return Number(parameters[0]) % Number(parameters[1]);
  },

  ceil: function (...args: any[]) {
    const parameters = args.slice(0, -1);
    // Check if there are parameters
    if (parameters.length === 0) {
      return '';
    }

    return Math.ceil(Number(parameters[0]));
  },

  floor: function (...args: any[]) {
    const parameters = args.slice(0, -1);
    // Check if there are parameters
    if (parameters.length === 0) {
      return '';
    }

    return Math.floor(Number(parameters[0]));
  }
};
