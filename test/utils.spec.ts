import { expect } from 'chai';
import { SafeString } from 'handlebars';
import { fromSafeString, ToBase64 } from '../src/libs/utils';

describe('Utils', () => {
  describe('toBase64', () => {
    it('should return string converted to base64 when btoa available', () => {
      global.btoa = () => Buffer.from('text').toString('base64');

      const base64 = ToBase64('text');

      expect(base64).to.equal('dGV4dA==');
    });

    it('should return string converted to base64 when only Buffer available', () => {
      const base64 = ToBase64('text');

      expect(base64).to.equal('dGV4dA==');
    });

    afterEach(() => {
      (global.btoa as unknown) = undefined;
    });
  });

  describe('fromSafeString', () => {
    it('should return a string if input is a string', () => {
      const newString = fromSafeString('text');

      expect(newString).to.equal('text');
    });

    it('should return a string if input is a SafeString', () => {
      const newString = fromSafeString(new SafeString('text'));

      expect(newString).to.equal('text');
    });
  });
});
