import { expect } from 'chai';
import { ToBase64, DecompressBody } from '../src/libs/utils';
import { Response } from 'express';
import fs from 'fs'


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

  describe('DecompressBody', () => {
    it('should decompress gzip encoded data', () => {
      const response = {
        'getHeader': (_:any) => {
          return 'gzip'
        },
        'body': fs.readFileSync(`${__dirname}/resources/content-encoding/gzip.data`)
      }

      expect(DecompressBody(response as Response)).to.equal('gzipTest')
    });

    it('should decompress brotli encoded data', () => {
      const response = {
        'getHeader': (_:any) => {
          return 'br'
        },
        'body': fs.readFileSync(`${__dirname}/resources/content-encoding/br.data`)
      }

      expect(DecompressBody(response as Response)).to.equal('brTest')
    });

    it('should decompress deflate encoded data', () => {
      const response = {
        'getHeader': (_:any) => {
          return 'deflate'
        },
        'body': fs.readFileSync(`${__dirname}/resources/content-encoding/deflate.data`)
      }

      expect(DecompressBody(response as Response)).to.equal('deflateTest')
    });

    it('should handle plain data', () => {
      const response = {
        'getHeader': (_:any) => {
          return undefined
        },
        'body': fs.readFileSync(`${__dirname}/resources/content-encoding/plain.data`)
      }

      expect(DecompressBody(response as Response)).to.equal('plainTest')
    });
  });

});
