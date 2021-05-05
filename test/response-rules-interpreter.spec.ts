import { ResponseRuleTargets, RouteResponse } from '@mockoon/commons';
import { expect } from 'chai';
import { Request } from 'express';
import QueryString from 'qs';
import { ResponseRulesInterpreter } from '../src/libs/response-rules-interpreter';

const routeResponse403: RouteResponse = {
  uuid: '',
  body: 'unauthorized',
  latency: 0,
  statusCode: 403,
  label: '',
  headers: [
    {
      key: 'Content-Type',
      value: 'text/plain'
    }
  ],
  filePath: '',
  sendFileAsBody: false,
  disableTemplating: false,
  rules: [],
  rulesOperator: 'OR'
};

const routeResponseTemplate: RouteResponse = {
  uuid: '',
  body: '',
  latency: 0,
  statusCode: 200,
  label: '',
  headers: [
    {
      key: 'Content-Type',
      value: 'text/plain'
    }
  ],
  filePath: '',
  sendFileAsBody: false,
  disableTemplating: false,
  rules: [],
  rulesOperator: 'OR'
};

describe('Response rules interpreter', () => {
  it('should return default response (no rule fulfilled)', () => {
    const request: Request = {
      header: function (headerName: string) {
        const headers = { 'Content-Type': 'application/json' };

        return headers[headerName];
      },
      body: ''
    } as Request;

    const routeResponse = new ResponseRulesInterpreter(
      [routeResponse403, routeResponseTemplate],
      request,
      false,
      false
    ).chooseResponse(1);

    expect(routeResponse.body).to.be.equal('unauthorized');
  });

  it('should return default response if rule is invalid (missing target)', () => {
    const request: Request = {
      header: function (headerName: string) {
        const headers = { 'Content-Type': 'application/json' };

        return headers[headerName];
      },
      body: '{"prop": "value"}',
      query: { prop: 'value' } as QueryString.ParsedQs,
      params: { prop: 'value' } as QueryString.ParsedQs
    } as Request;

    const routeResponse = new ResponseRulesInterpreter(
      [
        routeResponse403,
        {
          ...routeResponseTemplate,
          rules: [
            {
              target: '' as ResponseRuleTargets,
              modifier: 'prop',
              value: 'value',
              isRegex: false
            }
          ],
          body: 'invalid'
        }
      ],
      request,
      false,
      false
    ).chooseResponse(1);

    expect(routeResponse.body).to.be.equal('unauthorized');
  });

  describe('Query string rules', () => {
    it('should return response if query param matches (regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        query: { obj: { prop: 'valuetest' } } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'query',
                modifier: 'obj.prop',
                value: '^value',
                isRegex: true
              }
            ],
            body: 'query1'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);

      expect(routeResponse.body).to.be.equal('query1');
    });

    it('should return default response if query param does not match', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        query: { obj: { prop: 'value' } } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'query',
                modifier: 'obj.prop',
                value: 'val',
                isRegex: false
              }
            ],
            body: 'query2'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);

      expect(routeResponse.body).to.be.equal('unauthorized');
    });

    it('should return response if query param matches (no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        query: { obj: { prop: 'value' } } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'query',
                modifier: 'obj.prop',
                value: 'value',
                isRegex: false
              }
            ],
            body: 'query3'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);

      expect(routeResponse.body).to.be.equal('query3');
    });

    it('should return response if query param value contained in array (regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        query: { array: ['test2'] } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'query',
                modifier: 'array',
                value: 'test1|test2',
                isRegex: true
              }
            ],
            body: 'query4'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);

      expect(routeResponse.body).to.be.equal('query4');
    });

    it('should return response if query param value contained in array (no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        query: { array: ['test2'] } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'query',
                modifier: 'array',
                value: 'test2',
                isRegex: false
              }
            ],
            body: 'query5'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);

      expect(routeResponse.body).to.be.equal('query5');
    });

    it('should return default response if query param modifier not present', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        query: { prop: 'value' } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'query',
                modifier: '',
                value: 'value',
                isRegex: false
              }
            ],
            body: 'query6'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);

      expect(routeResponse.body).to.be.equal('unauthorized');
    });

    it('should return default response if query param is empty', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        query: { prop: undefined } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'query',
                modifier: 'prop',
                value: 'value',
                isRegex: false
              }
            ],
            body: 'query7'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);

      expect(routeResponse.body).to.be.equal('unauthorized');
    });
  });

  describe('Route params rules', () => {
    it('should return response if route param value matches (regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        params: { id: '111' } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'params',
                modifier: 'id',
                value: '^1',
                isRegex: true
              }
            ],
            body: 'params1'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('params1');
    });

    it('should return response if route param value matches (no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        params: { id: '111' } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'params',
                modifier: 'id',
                value: '111',
                isRegex: false
              }
            ],
            body: 'params2'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('params2');
    });

    it('should return default response if route param modifier not present', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        params: { id: '111' } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'params',
                modifier: '',
                value: '111',
                isRegex: false
              }
            ],
            body: 'params3'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('unauthorized');
    });

    it('should return default response if route param value does not match', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        params: { id: '111' } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'params',
                modifier: '',
                value: '11',
                isRegex: false
              }
            ],
            body: 'params4'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('unauthorized');
    });

    it('should return default response if route param value is empty', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = { 'Content-Type': 'application/json' };

          return headers[headerName];
        },
        body: '',
        params: { id: undefined } as QueryString.ParsedQs
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'params',
                modifier: '',
                value: '11',
                isRegex: false
              }
            ],
            body: 'params5'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('unauthorized');
    });
  });

  describe('Request number rules', () => {
    it('should return response if request number matches', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'request_number',
                modifier: '',
                value: '1',
                isRegex: false
              }
            ],
            body: 'request_number_1'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('request_number_1');
    });

    it("should not return response if request number don't matches", () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'request_number',
                modifier: '',
                value: '1',
                isRegex: false
              }
            ],
            body: 'request_number_1'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(2);
      expect(routeResponse.body).to.be.equal('unauthorized');
    });

    it('should return response if request number matches regex', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'request_number',
                modifier: '',
                value: '^[1-9][0-9]?$|^100$',
                isRegex: true
              }
            ],
            body: 'request_number_regex'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(99);
      expect(routeResponse.body).to.be.equal('request_number_regex');
    });

    it("should not return response if request don't matches regex", () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'request_number',
                modifier: '',
                value: '^[1-9][0-9]?$|^100$',
                isRegex: true
              }
            ],
            body: 'request_number_regex'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(101);
      expect(routeResponse.body).to.be.equal('unauthorized');
    });

    it('should return response if both rules match with request number', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            Authorization: 'test'
          };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const responseRulesinterpreter = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'header',
                modifier: 'Authorization',
                value: '^$|s+',
                isRegex: true
              },
              {
                target: 'request_number',
                modifier: '',
                value: '1|2',
                isRegex: true
              }
            ],
            rulesOperator: 'AND',
            body: 'request_number_complex1'
          }
        ],
        request,
        false,
        false
      );

      expect(responseRulesinterpreter.chooseResponse(1).body).to.be.equal(
        'request_number_complex1'
      );
      expect(responseRulesinterpreter.chooseResponse(2).body).to.be.equal(
        'request_number_complex1'
      );
      expect(responseRulesinterpreter.chooseResponse(3).body).to.be.equal(
        'unauthorized'
      );
    });
  });

  describe('Sequential responses', () => {
    it('should return each response depending on the request call index and go back to the first one', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const responseRulesInterpreter = new ResponseRulesInterpreter(
        [
          {
            ...routeResponseTemplate,
            body: 'request_number_1'
          },
          {
            ...routeResponseTemplate,
            body: 'request_number_2'
          },
          {
            ...routeResponseTemplate,
            body: 'request_number_3'
          },
          {
            ...routeResponseTemplate,
            body: 'request_number_4'
          }
        ],
        request,
        false,
        true
      );
      expect(responseRulesInterpreter.chooseResponse(1).body).to.be.equal(
        'request_number_1'
      );
      expect(responseRulesInterpreter.chooseResponse(1).body).to.be.equal(
        'request_number_1'
      );
      expect(responseRulesInterpreter.chooseResponse(3).body).to.be.equal(
        'request_number_3'
      );
      expect(responseRulesInterpreter.chooseResponse(4).body).to.be.equal(
        'request_number_4'
      );
      expect(responseRulesInterpreter.chooseResponse(5).body).to.be.equal(
        'request_number_1'
      );
    });
  });

  describe('Headers rules', () => {
    it('should return response if header value matches (regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'header',
                modifier: 'Accept-Charset',
                value: '^UTF',
                isRegex: true
              }
            ],
            body: 'header1'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('header1');
    });

    it('should return response if header value matches (no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'header',
                modifier: 'Accept-Charset',
                value: 'UTF-8',
                isRegex: false
              }
            ],
            body: 'header2'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('header2');
    });

    it('should return default response if header value does not match', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'header',
                modifier: 'Accept-Charset',
                value: 'UTF-16',
                isRegex: false
              }
            ],
            body: 'header3'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('unauthorized');
    });

    it('should return default response if header value is empty', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': undefined
          };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'header',
                modifier: 'Accept-Charset',
                value: 'UTF-16',
                isRegex: false
              }
            ],
            body: 'header4'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('unauthorized');
    });

    it('should return default response if header modifier not present', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept-Charset': 'UTF-8'
          };

          return headers[headerName];
        },
        body: ''
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'header',
                modifier: '',
                value: 'UTF-8',
                isRegex: false
              }
            ],
            body: 'header5'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('unauthorized');
    });
  });

  describe('Body rules', () => {
    it('should return response if full body value matches (no modifier + regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        body: 'bodyvalue'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: '',
                value: 'value',
                isRegex: true
              }
            ],
            body: 'body1'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body1');
    });

    it('should return response if full body value matches (no modifier + no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        body: 'bodyvalue'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: '',
                value: 'bodyvalue',
                isRegex: false
              }
            ],
            body: 'body2'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body2');
    });

    it('should return default response if full body value does not match (no modifier)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        body: 'bodyvalue'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: '',
                value: 'body',
                isRegex: false
              }
            ],
            body: 'body3'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('unauthorized');
    });

    it('should return response if JSON body property value matches (no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        body: '{"name": "john"}'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'name',
                value: 'john',
                isRegex: false
              }
            ],
            body: 'body4'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body4');
    });

    it('should return response if JSON body path value matches (no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        body: '{ "user": [{ "name": "John" }] }'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'user.0.name',
                value: 'John',
                isRegex: false
              }
            ],
            body: 'body5'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body5');
    });

    it('should return response if JSON body path value matches (regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        body: '{ "user": [{ "name": "John" }] }'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'user.0.name',
                value: '^John',
                isRegex: true
              }
            ],
            body: 'body6'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body6');
    });

    it('should return response if JSON body path array values contains (no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        body: '{ "users": ["John", "Johnny", "Paul"] }'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'users',
                value: 'John',
                isRegex: false
              }
            ],
            body: 'body7'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body7');
    });

    it('should return response if JSON body path array values contains (regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        body: '{ "users": ["John", "Johnny", "Paul"] }'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'users',
                value: '^John',
                isRegex: true
              }
            ],
            body: 'body8'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body8');
    });

    it('should return response if JSON body path value matches (no regex + charset in content-type)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json; Charset=UTF-8'
          };

          return headers[headerName];
        },
        body: '{ "test": "test" }'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'test',
                value: 'test',
                isRegex: false
              }
            ],
            body: 'body9'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body9');
    });

    it('should return response if JSON body path number value matches (no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        body: '{ "test": 1 }'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'test',
                value: '1',
                isRegex: false
              }
            ],
            body: 'body10'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body10');
    });

    it('should return response if JSON body path boolean value matches (no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        body: '{ "test": false }'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'test',
                value: 'false',
                isRegex: false
              }
            ],
            body: 'body11'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body11');
    });

    it('should return response if x-www-form body path value matches (no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
          };

          return headers[headerName];
        },
        body: 'param1=value1'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'param1',
                value: 'value1',
                isRegex: false
              }
            ],
            body: 'body12'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body12');
    });

    it('should return response if x-www-form body path value matches (regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
          };

          return headers[headerName];
        },
        body: 'param1=value1'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'param1',
                value: '^value',
                isRegex: true
              }
            ],
            body: 'body13'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body13');
    });

    it('should return response if x-www-form body path array value matches (no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
          };

          return headers[headerName];
        },
        body: 'params[]=value1&params[]=value2'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'params',
                value: 'value2',
                isRegex: false
              }
            ],
            body: 'body14'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body14');
    });

    it('should return response if x-www-form body path value matches (no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
          };

          return headers[headerName];
        },
        body: 'params[prop1]=value1&params[prop2]=value2'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'params.prop2',
                value: 'value2',
                isRegex: false
              }
            ],
            body: 'body15'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body15');
    });

    it('should return response if x-www-form full body value matches (no modifier + no regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
          };

          return headers[headerName];
        },
        body: 'bodyvalue'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: '',
                value: 'bodyvalue',
                isRegex: false
              }
            ],
            body: 'body16'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body16');
    });

    it('should return response if x-www-form full body value matches (no modifier + regex)', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
          };

          return headers[headerName];
        },
        body: 'bodyvalue'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: '',
                value: 'value',
                isRegex: true
              }
            ],
            body: 'body17'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body17');
    });

    it('should return response if JSON body property value is null', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        body: '{"prop1": null}'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'prop1',
                value: '',
                isRegex: false
              }
            ],
            body: 'body19'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body19');
    });

    it('should return response if JSON body property value is null nad rule value is null too', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json'
          };

          return headers[headerName];
        },
        body: '{"prop1": null}'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'prop1',
                value: null,
                isRegex: false
              } as any
            ],
            body: 'body19'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('body19');
    });
  });

  describe('Complex rules (AND/OR)', () => {
    it('should return response if both rules match', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Test-Header': 'headervalue'
          };

          return headers[headerName];
        },
        body: '{ "test": "bodyvalue" }'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'test',
                value: 'bodyvalue',
                isRegex: false
              },
              {
                target: 'header',
                modifier: 'Test-Header',
                value: 'headervalue',
                isRegex: false
              }
            ],
            rulesOperator: 'AND',
            body: 'complex1'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('complex1');
    });

    it('should return default response if both rules do not match', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Test-Header': 'headervalue'
          };

          return headers[headerName];
        },
        body: '{ "test": "bodyvalue" }'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'test',
                value: 'bodyvalue',
                isRegex: false
              },
              {
                target: 'header',
                modifier: 'Test-Header',
                value: 'headervalue1',
                isRegex: false
              }
            ],
            rulesOperator: 'AND',
            body: 'complex2'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('unauthorized');
    });

    it('should return response if one rule matches', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Test-Header': 'empty'
          };

          return headers[headerName];
        },
        body: '{ "test": "bodyvalue" }'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'test',
                value: 'bodyvalue',
                isRegex: false
              },
              {
                target: 'header',
                modifier: 'Test-Header',
                value: 'headervalue',
                isRegex: false
              }
            ],
            rulesOperator: 'OR',
            body: 'complex3'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('complex3');
    });

    it('should return default response if none rule matches', () => {
      const request: Request = {
        header: function (headerName: string) {
          const headers = {
            'Content-Type': 'application/json',
            'Test-Header': 'empty'
          };

          return headers[headerName];
        },
        body: '{ "test": "empty" }'
      } as Request;

      const routeResponse = new ResponseRulesInterpreter(
        [
          routeResponse403,
          {
            ...routeResponseTemplate,
            rules: [
              {
                target: 'body',
                modifier: 'test',
                value: 'bodyvalue',
                isRegex: false
              },
              {
                target: 'header',
                modifier: 'Test-Header',
                value: 'headervalue',
                isRegex: false
              }
            ],
            rulesOperator: 'OR',
            body: 'complex4'
          }
        ],
        request,
        false,
        false
      ).chooseResponse(1);
      expect(routeResponse.body).to.be.equal('unauthorized');
    });
  });
});
