import { expect } from 'chai';
import { format as dateFormat } from 'date-fns';
import { TemplateParser } from '../src/libs/template-parser';

describe('Template parser', () => {
  describe('Helper: concat', () => {
    it('should concat two strings', () => {
      const parseResult = TemplateParser("{{concat 'test' 'test'}}", {} as any);
      expect(parseResult).to.be.equal('testtest');
    });

    it('should concat two strings and repeat index', () => {
      const parseResult = TemplateParser(
        "{{#repeat 1 comma=false}}{{concat 'test' @index 'test'}}{{/repeat}}",
        {} as any
      );
      expect(parseResult).to.be.equal('test0test');
    });

    it('should concat two strings and the result of a helper', () => {
      const parseResult = TemplateParser(
        "{{#repeat 1 comma=false}}{{concat 'test' (body 'id') 'test'}}{{/repeat}}",
        { bodyJSON: { id: '123' } } as any
      );
      expect(parseResult).to.be.equal('test123test');
    });

    it('should concat two strings and number', () => {
      const parseResult = TemplateParser(
        "{{concat 'test' 123 'test'}}",
        {} as any
      );
      expect(parseResult).to.be.equal('test123test');
    });

    it('should concat object path to retrieve body array items', () => {
      const parseResult = TemplateParser(
        "{{#repeat 2 comma=false}}item_{{body (concat 'a.' @index '.item')}}{{/repeat}}",
        { bodyJSON: { a: [{ item: 10 }, { item: 20 }] } } as any
      );
      expect(parseResult).to.be.equal('item_10item_20');
    });
  });

  describe('Helper: setVar', () => {
    it('should set a variable to a string', () => {
      const parseResult = TemplateParser(
        "{{setVar 'testvar' 'testvalue'}}{{testvar}}",
        {} as any
      );
      expect(parseResult).to.be.equal('testvalue');
    });

    it('should set a variable to a number', () => {
      const parseResult = TemplateParser(
        "{{setVar 'testvar' 123}}{{testvar}}",
        {} as any
      );
      expect(parseResult).to.be.equal('123');
    });

    it('should set a variable value to body helper result', () => {
      const parseResult = TemplateParser(
        "{{setVar 'testvar' (body 'uuid')}}{{testvar}}",
        {
          bodyJSON: { uuid: '0d35618e-5e85-4c09-864d-6d63973271c8' }
        } as any
      );
      expect(parseResult).to.be.equal('0d35618e-5e85-4c09-864d-6d63973271c8');
    });

    it('should set a variable value to oneOf helper result', () => {
      const parseResult = TemplateParser(
        "{{setVar 'testvar' (oneOf (array 'item1'))}}{{testvar}}",
        {} as any
      );
      expect(parseResult).to.be.equal('item1');
    });

    it('should set a variable and use it in another helper', () => {
      const parseResult = TemplateParser(
        "{{setVar 'testvar' 5}}{{#repeat testvar comma=false}}test{{/repeat}}",
        {} as any
      );
      expect(parseResult).to.be.equal('testtesttesttesttest');
    });

    it('should set a variable in a different scope: repeat', () => {
      const parseResult = TemplateParser(
        "{{#repeat 5 comma=false}}{{setVar 'testvar' @index}}{{@testvar}}{{/repeat}}",
        {} as any
      );
      expect(parseResult).to.be.equal('1234');
    });

    it('should set a variable in root scope and child scope: repeat', () => {
      const parseResult = TemplateParser(
        "{{setVar 'outsidevar' 'test'}}{{@root.outsidevar}}{{#repeat 5 comma=false}}{{setVar 'testvar' @index}}{{@testvar}}{{outsidevar}}{{/repeat}}",
        {} as any
      );
      expect(parseResult).to.be.equal('testtest1test2test3test4test');
    });

    it('should set a variable to empty value if none provided', () => {
      const parseResult = TemplateParser(
        "{{setVar 'testvar'}}{{testvar}}",
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });

    it('should not set a variable if no name provided', () => {
      const parseResult = TemplateParser("{{setVar ''}}{{testvar}}", {} as any);
      expect(parseResult).to.be.equal('');
    });
  });

  describe('Helper: dateTimeShift', () => {
    it('Should not throw an error when passed with invalid parameters.', () => {
      const parseResult = TemplateParser('{{dateTimeShift 1}}', {} as any);

      // When invalid parameters are passed, the default should just be to return the current date with no shift.
      const date = new Date();
      const dateString = dateFormat(date, "yyyy-MM-dd'T'HH:mm");
      expect(parseResult).to.match(new RegExp(dateString + '.*'));
    });

    it('Should return a date shifted the specified amount of days from now.', () => {
      const parseResult = TemplateParser('{{dateTimeShift days=2}}', {} as any);

      const date = new Date();
      date.setDate(date.getDate() + 2);
      // As our reference date here may differ slightly from the one interally used in the helper, it's more reliable to just compare the date/time with the seconds (and lower) excluded.
      const dateString = dateFormat(date, "yyyy-MM-dd'T'HH:mm");
      expect(parseResult).to.match(new RegExp(dateString + '.*'));
    });

    it('Should return a date shifted by the requested amount from a specified start date.', () => {
      const parseResult = TemplateParser(
        "{{dateTimeShift date='2021-02-01' days=2 months=4}}",
        {} as any
      );

      expect(parseResult).to.match(/2021-06-03.*/);
    });

    it('Should return a date shifted by the requested amount from the specified start date in the specified format.', () => {
      const parseResult = TemplateParser(
        "{{dateTimeShift date='2021-02-01' format='yyyy-MM-dd' days=2 months=4}}",
        {} as any
      );

      expect(parseResult).to.equals('2021-06-03');
    });

    it('Should return a date time shifted by the requested amount from the specified start date in the specified format.', () => {
      const parseResult = TemplateParser(
        "{{dateTimeShift date='2021-02-01T10:45:00' format=\"yyyy-MM-dd'T'HH:mm:ss\" days=8 months=3 hours=1 minutes=2 seconds=3}}",
        {} as any
      );

      expect(parseResult).to.equals('2021-05-09T11:47:03');
    });
  });

  describe('Helper: includes', () => {
    it('should return true if a string includes a search string', () => {
      const parseResult = TemplateParser(
        "{{includes 'testdata' 'test'}}",
        {} as any
      );

      expect(parseResult).to.be.equal('true');
    });

    it('should return false if a string does not include a search string', () => {
      const parseResult = TemplateParser(
        "{{includes 'testdata' 'not'}}",
        {} as any
      );

      expect(parseResult).to.be.equal('false');
    });

    it('should not fail when passing no parameters', () => {
      const parseResult = TemplateParser('{{includes}}', {} as any);

      expect(parseResult).to.be.equal('true');
    });

    it('should not fail when passing only one parameter', () => {
      const parseResult = TemplateParser("{{includes 'testdata'}}", {} as any);

      expect(parseResult).to.be.equal('true');
    });
  });

  describe('Helper: substr', () => {
    it('should return a substring of the provided string', () => {
      const parseResult = TemplateParser(
        "{{substr 'testdata' 4 4}}",
        {} as any
      );

      expect(parseResult).to.be.equal('data');
    });

    it('should work correctly when from and length parameters are passed as strings', () => {
      const parseResult = TemplateParser(
        "{{substr 'testdata' '4' '4'}}",
        {} as any
      );

      expect(parseResult).to.be.equal('data');
    });

    it('should return a substring of the provided string to the end when the length parameter is excluded (from as a number)', () => {
      const parseResult = TemplateParser("{{substr 'testdata' 4}}", {} as any);

      expect(parseResult).to.be.equal('data');
    });

    it('should return a substring of the provided string to the end when the length parameter is excluded (from as a string)', () => {
      const parseResult = TemplateParser(
        "{{substr 'testdata' '4'}}",
        {} as any
      );

      expect(parseResult).to.be.equal('data');
    });

    it('Should work correctly when variables are passed as parameters as numbers', () => {
      const parseResult = TemplateParser(
        "{{setVar 'testvar' 'testdata'}}{{setVar 'from' 4}}{{setVar 'length' 4}}{{substr testvar from length}}",
        {} as any
      );

      expect(parseResult).to.be.equal('data');
    });

    it('Should work correctly when variables are passed as parameters as strings', () => {
      const parseResult = TemplateParser(
        "{{setVar 'testvar' 'testdata'}}{{setVar 'from' '4'}}{{setVar 'length' '4'}}{{substr testvar from length}}",
        {} as any
      );

      expect(parseResult).to.be.equal('data');
    });

    it('Should work correctly when other helpers are used for parameters as numbers', () => {
      const parseResult = TemplateParser(
        "{{substr (body 'prop1') (body 'prop2') (body 'prop3')}}",
        {
          bodyJSON: { prop1: 'testdata', prop2: 4, prop3: 4 }
        } as any
      );

      expect(parseResult).to.be.equal('data');
    });

    it('Should work correctly when other helpers are used for parameters as strings', () => {
      const parseResult = TemplateParser(
        "{{substr (body 'prop1') (body 'prop2') (body 'prop3')}}",
        {
          bodyJSON: { prop1: 'testdata', prop2: '4', prop3: '4' }
        } as any
      );

      expect(parseResult).to.be.equal('data');
    });

    it('should not fail when passing no parameters', () => {
      const parseResult = TemplateParser('{{substr}}', {} as any);

      expect(parseResult).to.be.equal('');
    });

    it('should not fail when passing only one parameter', () => {
      const parseResult = TemplateParser("{{substr 'testdata'}}", {} as any);

      expect(parseResult).to.be.equal('testdata');
    });
  });

  describe('Helper: indexOf', () => {
    it('should return the index of a matching substring', () => {
      const parseResult = TemplateParser(
        "{{indexOf 'testdata' 'data'}}",
        {} as any
      );

      expect(parseResult).to.be.equal('4');
    });

    it('should return the index of a matching substring from a given starting position', () => {
      const parseResult = TemplateParser(
        "{{indexOf 'testdatadata' 'data' 6}}",
        {} as any
      );

      expect(parseResult).to.be.equal('8');
    });

    it('should still work correctly if the position parameter is passed as a string', () => {
      const parseResult = TemplateParser(
        "{{indexOf 'testdatadata' 'data' '6'}}",
        {} as any
      );

      expect(parseResult).to.be.equal('8');
    });

    it('should be possible to search for a number', () => {
      const parseResult = TemplateParser(
        "{{indexOf 'testdata12345' 3}}",
        {} as any
      );

      expect(parseResult).to.be.equal('10');
    });

    it('should be possible to search for a number (as a string)', () => {
      const parseResult = TemplateParser(
        "{{indexOf 'testdata12345' '3'}}",
        {} as any
      );

      expect(parseResult).to.be.equal('10');
    });

    it('Can return the index from a previously set variable', () => {
      const parseResult = TemplateParser(
        "{{setVar 'testvar' 'this is a test'}}{{indexOf testvar 'test'}}",
        {} as any
      );

      expect(parseResult).to.be.equal('10');
    });

    it('Can return the index from a previously set variable using a variable for the search string', () => {
      const parseResult = TemplateParser(
        "{{setVar 'testvar' 'this is a test'}}{{setVar 'searchstring' 'test'}}{{indexOf testvar searchstring}}",
        {} as any
      );

      expect(parseResult).to.be.equal('10');
    });

    it('Can return the index from a body property', () => {
      const parseResult = TemplateParser(
        "{{indexOf (body 'prop1') (body 'prop2')}}",
        {
          bodyJSON: { prop1: 'First test then test', prop2: 'test' }
        } as any
      );

      expect(parseResult).to.be.equal('6');
    });

    it('Can return the index from a body property with a position', () => {
      const parseResult = TemplateParser(
        "{{indexOf (body 'prop1') (body 'prop2') (body 'prop3')}}",
        {
          bodyJSON: { prop1: 'First test then test', prop2: 'test', prop3: 10 }
        } as any
      );

      expect(parseResult).to.be.equal('16');
    });

    it('should not fail when passing no parameters', () => {
      const parseResult = TemplateParser('{{indexOf}}', {} as any);

      expect(parseResult).to.be.equal('0');
    });

    it('should not fail when passing only one parameter', () => {
      const parseResult = TemplateParser("{{indexOf 'testdata'}}", {} as any);

      expect(parseResult).to.be.equal('0');
    });
  });

  describe('Helper: someOf', () => {
    it('should return one element', () => {
      const parseResult = TemplateParser(
        "{{someOf (array 'value1' 'value2' 'value3' 'value4' 'value5' 'value6') 1 1}}",
        {} as any
      );

      const count = (parseResult.match(/value/g) || []).length;
      expect(count).to.equal(1);
    });

    it('should return 1 to 3 elements', () => {
      const parseResult = TemplateParser(
        "{{someOf (array 'value1' 'value2' 'value3' 'value4' 'value5' 'value6') 1 3}}",
        {} as any
      );

      const countItems = (parseResult.match(/value/g) || []).length;
      expect(countItems).is.least(1);
      expect(countItems).is.most(3);

      const countSeparators = (parseResult.match(/,/g) || []).length;
      expect(countSeparators).is.least(0);
      expect(countSeparators).is.most(2);
    });

    it('should return 1 to 3 elements as array', () => {
      const parseResult = TemplateParser(
        "{{someOf (array 'value1' 'value2' 'value3' 'value4' 'value5' 'value6') 1 3 true}}",
        {} as any
      );
      expect(parseResult.match(/^\[.*\]$/)?.length).to.equal(1);
      const countItems = (parseResult.match(/value/g) || []).length;
      expect(countItems).is.least(1);
      expect(countItems).is.most(3);

      const countSeparators = (parseResult.match(/,/g) || []).length;
      expect(countSeparators).is.least(0);
      expect(countSeparators).is.most(2);
    });
  });

  describe('Helper: base64', () => {
    it('should encode string to base64', () => {
      const parseResult = TemplateParser("{{base64 'abc'}}", {} as any);
      expect(parseResult).to.be.equal('YWJj');
    });

    it('should encode body property to base64', () => {
      const parseResult = TemplateParser("{{base64 (body 'prop1')}}", {
        bodyJSON: { prop1: '123' }
      } as any);
      expect(parseResult).to.be.equal('MTIz');
    });

    it('should encode block to base64', () => {
      const parseResult = TemplateParser(
        "{{#base64}}value: {{body 'prop1'}}{{/base64}}",
        {
          bodyJSON: { prop1: '123' }
        } as any
      );
      expect(parseResult).to.be.equal('dmFsdWU6IDEyMw==');
    });
  });

  describe('Helper: body', () => {
    it('should return number without quotes', () => {
      const parseResult = TemplateParser("{{body 'prop1' undefined true}}", {
        bodyJSON: { prop1: 1 }
      } as any);
      expect(parseResult).to.be.equal('1');
    });

    it('should return boolean value without quotes', () => {
      const parseResult = TemplateParser("{{body 'prop1' undefined true}}", {
        bodyJSON: { prop1: true }
      } as any);
      expect(parseResult).to.be.equal('true');
    });

    it('should return null value without quotes', () => {
      const parseResult = TemplateParser("{{body 'prop1' undefined true}}", {
        bodyJSON: { prop1: null }
      } as any);
      expect(parseResult).to.be.equal('null');
    });

    it('should always return array as JSON string', () => {
      const parseResult = TemplateParser("{{body 'prop1' undefined false}}", {
        bodyJSON: { prop1: ['first', 'second'] }
      } as any);
      expect(parseResult).to.be.equal('["first","second"]');
    });

    it('should always return object as JSON string', () => {
      const parseResult = TemplateParser("{{body 'prop1' undefined false}}", {
        bodyJSON: { prop1: { key: 'value' } }
      } as any);
      expect(parseResult).to.be.equal('{"key":"value"}');
    });

    it('should return default value enclosed in quotes', () => {
      const parseResult = TemplateParser("{{body 'prop2' 'default' true}}", {
        bodyJSON: { prop1: 'test' }
      } as any);
      expect(parseResult).to.be.equal('"default"');
    });

    it('should return string enclosed in quotes', () => {
      const parseResult = TemplateParser("{{body 'prop1' undefined true}}", {
        bodyJSON: { prop1: 'test' }
      } as any);
      expect(parseResult).to.be.equal('"test"');
    });

    it('should not return string enclosed in quotes', () => {
      const parseResult = TemplateParser("{{body 'prop1'}}", {
        bodyJSON: { prop1: 'test' }
      } as any);
      expect(parseResult).to.be.equal('test');
    });

    it('should escape newlines and quotes in string', () => {
      const parseResult = TemplateParser("{{body 'prop1' undefined true}}", {
        bodyJSON: { prop1: 'This \n is a "message" with quotes.' }
      } as any);
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
        } as any
      );
      expect(parseResult).to.be.equal('1');
    });

    it('should return boolean value without quotes', () => {
      const parseResult = TemplateParser(
        "{{queryParam 'param1' undefined true}}",
        {
          query: { param1: true }
        } as any
      );
      expect(parseResult).to.be.equal('true');
    });

    it('should return null value without quotes', () => {
      const parseResult = TemplateParser(
        "{{queryParam 'param1' undefined true}}",
        {
          query: { param1: null }
        } as any
      );
      expect(parseResult).to.be.equal('null');
    });

    it('should always return array as JSON string', () => {
      const parseResult = TemplateParser(
        "{{queryParam 'param1' undefined false}}",
        {
          query: { param1: ['first', 'second'] }
        } as any
      );
      expect(parseResult).to.be.equal('["first","second"]');
    });

    it('should always return object as JSON string', () => {
      const parseResult = TemplateParser(
        "{{queryParam 'param1' undefined false}}",
        {
          query: { param1: { key: 'value' } }
        } as any
      );
      expect(parseResult).to.be.equal('{"key":"value"}');
    });

    it('should not return string enclosed in quotes', () => {
      const parseResult = TemplateParser("{{queryParam 'param1' 'default'}}", {
        query: { param1: 'test' }
      } as any);
      expect(parseResult).to.be.equal('test');
    });

    it('should return string enclosed in quotes', () => {
      const parseResult = TemplateParser(
        "{{queryParam 'param1' undefined true}}",
        {
          query: { param1: 'test' }
        } as any
      );
      expect(parseResult).to.be.equal('"test"');
    });

    it('should return default value enclosed in quotes', () => {
      const parseResult = TemplateParser(
        "{{queryParam 'param1' 'default' true}}",
        {
          query: { param2: 'test' }
        } as any
      );
      expect(parseResult).to.be.equal('"default"');
    });

    it('should escape quotes in string', () => {
      const parseResult = TemplateParser(
        "{{queryParam 'param1' undefined true}}",
        {
          query: { param1: 'This is a "message" with quotes.' }
        } as any
      );
      expect(parseResult).to.be.equal('"This is a \\"message\\" with quotes."');
    });
  });
});
