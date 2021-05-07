import { expect } from 'chai';
import { TemplateParser } from '../../src/libs/template-parser';

describe('Template parser', () => {
  describe('Helper: body', () => {
    it('should return number without quotes', () => {
      const parseResult = TemplateParser(
        "{{body 'prop1' undefined true}}",
        {
          bodyJSON: { prop1: 1 }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('1');
    });

    it('should return boolean value without quotes', () => {
      const parseResult = TemplateParser(
        "{{body 'prop1' undefined true}}",
        {
          bodyJSON: { prop1: true }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('true');
    });

    it('should return null value without quotes', () => {
      const parseResult = TemplateParser(
        "{{body 'prop1' undefined true}}",
        {
          bodyJSON: { prop1: null }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('null');
    });

    it('should always return array as JSON string', () => {
      const parseResult = TemplateParser(
        "{{body 'prop1' undefined false}}",
        {
          bodyJSON: { prop1: ['first', 'second'] }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('["first","second"]');
    });

    it('should always return object as JSON string', () => {
      const parseResult = TemplateParser(
        "{{body 'prop1' undefined false}}",
        {
          bodyJSON: { prop1: { key: 'value' } }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('{"key":"value"}');
    });

    it('should return default value enclosed in quotes', () => {
      const parseResult = TemplateParser(
        "{{body 'prop2' 'default' true}}",
        {
          bodyJSON: { prop1: 'test' }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('"default"');
    });

    it('should return string enclosed in quotes', () => {
      const parseResult = TemplateParser(
        "{{body 'prop1' undefined true}}",
        {
          bodyJSON: { prop1: 'test' }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('"test"');
    });

    it('should not return string enclosed in quotes', () => {
      const parseResult = TemplateParser(
        "{{body 'prop1'}}",
        {
          bodyJSON: { prop1: 'test' }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('test');
    });

    it('should escape newlines and quotes in string', () => {
      const parseResult = TemplateParser(
        "{{body 'prop1' undefined true}}",
        {
          bodyJSON: { prop1: 'This \n is a "message" with quotes.' }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal(
        '"This \\n is a \\"message\\" with quotes."'
      );
    });
  });

  describe('Helper: queryParam', () => {
    it('should return number without quotes', () => {
      const parseResult = TemplateParser(
        "{{queryParam 'param1' undefined true}}",
        {
          query: { param1: 1 }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('1');
    });

    it('should return boolean value without quotes', () => {
      const parseResult = TemplateParser(
        "{{queryParam 'param1' undefined true}}",
        {
          query: { param1: true }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('true');
    });

    it('should return null value without quotes', () => {
      const parseResult = TemplateParser(
        "{{queryParam 'param1' undefined true}}",
        {
          query: { param1: null }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('null');
    });

    it('should always return array as JSON string', () => {
      const parseResult = TemplateParser(
        "{{queryParam 'param1' undefined false}}",
        {
          query: { param1: ['first', 'second'] }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('["first","second"]');
    });

    it('should always return object as JSON string', () => {
      const parseResult = TemplateParser(
        "{{queryParam 'param1' undefined false}}",
        {
          query: { param1: { key: 'value' } }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('{"key":"value"}');
    });

    it('should not return string enclosed in quotes', () => {
      const parseResult = TemplateParser(
        "{{queryParam 'param1' 'default'}}",
        {
          query: { param1: 'test' }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('test');
    });

    it('should return string enclosed in quotes', () => {
      const parseResult = TemplateParser(
        "{{queryParam 'param1' undefined true}}",
        {
          query: { param1: 'test' }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('"test"');
    });

    it('should return default value enclosed in quotes', () => {
      const parseResult = TemplateParser(
        "{{queryParam 'param1' 'default' true}}",
        {
          query: { param2: 'test' }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('"default"');
    });

    it('should escape quotes in string', () => {
      const parseResult = TemplateParser(
        "{{queryParam 'param1' undefined true}}",
        {
          query: { param1: 'This is a "message" with quotes.' }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('"This is a \\"message\\" with quotes."');
    });
  });

  describe('Helper: baseUrl', () => {
    it('should return correct protocol if https is false', () => {
      const parseResult = TemplateParser(
        '{{baseUrl}}',
        {
          hostname: 'localhost'
        } as any,
        {
          https: false,
          port: 3000,
          endpointPrefix: 'api'
        } as any
      );
      expect(parseResult).to.be.equal('http://localhost:3000/api');
    });
    it('should return correct protocol if https is true', () => {
      const parseResult = TemplateParser(
        '{{baseUrl}}',
        {
          hostname: 'localhost'
        } as any,
        {
          https: true,
          port: 3000,
          endpointPrefix: 'api'
        } as any
      );
      expect(parseResult).to.be.equal('https://localhost:3000/api');
    });

    it('should return correct url format with correct port', () => {
      const parseResult = TemplateParser(
        '{{baseUrl}}',
        {
          hostname: 'localhost'
        } as any,
        {
          https: true,
          port: 3001,
          endpointPrefix: 'api'
        } as any
      );
      expect(parseResult).to.be.equal('https://localhost:3001/api');
    });

    it('should return correct url based on hostname', () => {
      const parseResult = TemplateParser(
        '{{baseUrl}}',
        {
          hostname: 'domain.tld'
        } as any,
        {
          port: 3005,
          https: true,
          endpointPrefix: 'api'
        } as any
      );
      expect(parseResult).to.be.equal('https://domain.tld:3005/api');
    });

    it('should return correct url format with endpointPrefix', () => {
      const parseResult = TemplateParser(
        '{{baseUrl}}',
        {
          hostname: 'localhost'
        } as any,
        {
          https: true,
          port: 3001,
          endpointPrefix: 'v1'
        } as any
      );
      expect(parseResult).to.be.equal('https://localhost:3001/v1');
    });

    it('should return correct url format without endpointPrefix', () => {
      const parseResult = TemplateParser(
        '{{baseUrl}}',
        {
          hostname: 'localhost'
        } as any,
        {
          https: true,
          port: 3001
        } as any
      );
      expect(parseResult).to.be.equal('https://localhost:3001');
    });

    it('should return correct url format when endpointPrefix is empty string', () => {
      const parseResult = TemplateParser(
        '{{baseUrl}}',
        {
          hostname: 'localhost'
        } as any,
        {
          https: true,
          port: 3001,
          endpointPrefix: ''
        } as any
      );
      expect(parseResult).to.be.equal('https://localhost:3001');
    });
  });
});
