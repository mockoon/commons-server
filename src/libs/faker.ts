import { FakerAvailableLocales } from '@mockoon/commons';
import faker from 'faker';

/**
 * Set the Faker locale
 *
 * @param locale
 */
export const SetFakerLocale = (locale: FakerAvailableLocales) => {
  faker.locale = locale;
};

/**
 * Set the Faker seed
 *
 * @param seed
 */
export const SetFakerSeed = (seed: number) => {
  if (seed !== undefined && seed !== null) {
    faker.seed(seed);
  }
};
