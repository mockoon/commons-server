import { expect } from 'chai';
import { ToBase64 } from '../src/libs/utils';

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
});
