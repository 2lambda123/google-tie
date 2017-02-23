// Copyright 2017 The TIE Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for the PythonCodePreprocessorService.
 */

describe('PythonCodePreprocessorService', function() {
  var PythonCodePreprocessorService;

  beforeEach(module('tie'));
  beforeEach(inject(function($injector) {
    PythonCodePreprocessorService = $injector.get(
      'PythonCodePreprocessorService');
  }));

  describe('_wrapCodeIntoClass', function() {
    it('should correctly wrap a function', function() {
      var rawCode = [
        'def myFunc():',
        '    a = 3'
      ].join('\n');

      // The Python interpreter ignores the trailing comma and space in the
      // function arguments.
      var expectedWrappedCode = [
        'class StudentAnswer(object):',
        '    def myFunc(self, ):',
        '        a = 3'
      ].join('\n');

      expect(
        PythonCodePreprocessorService._wrapCodeIntoClass(rawCode)
      ).toEqual(expectedWrappedCode);
    });

    it('should correctly wrap inner functions', function() {
      var rawCode = [
        'def myFunc():',
        '    a = 3',
        '    def inner_func():',
        '        b = 6',
        '    inner_func()'
      ].join('\n');

      var expectedWrappedCode = [
        'class StudentAnswer(object):',
        '    def myFunc(self, ):',
        '        a = 3',
        '        def inner_func():',
        '            b = 6',
        '        inner_func()'
      ].join('\n');

      expect(
        PythonCodePreprocessorService._wrapCodeIntoClass(rawCode)
      ).toEqual(expectedWrappedCode);
    });

    it('should preserve inner whitespace', function() {
      var rawCode = [
        'def       myFunc():',
        '    a = 3'
      ].join('\n');

      var expectedWrappedCode = [
        'class StudentAnswer(object):',
        '    def       myFunc(self, ):',
        '        a = 3'
      ].join('\n');

      expect(
        PythonCodePreprocessorService._wrapCodeIntoClass(rawCode)
      ).toEqual(expectedWrappedCode);
    });

    it('should wrap functions with arguments', function() {
      var rawCode = [
        'def myFunc(c, b, x):',
        '    a = 3',
      ].join('\n');

      var expectedWrappedCode = [
        'class StudentAnswer(object):',
        '    def myFunc(self, c, b, x):',
        '        a = 3',
      ].join('\n');

      expect(
        PythonCodePreprocessorService._wrapCodeIntoClass(rawCode)
      ).toEqual(expectedWrappedCode);
    });

    it('should correctly wrap multi-line functions', function() {
      var rawCode = [
        'def myFunc(',
        '    c, b, x):',
        '    a = 3',
      ].join('\n');

      var expectedWrappedCode = [
        'class StudentAnswer(object):',
        '    def myFunc(self, ',
        '        c, b, x):',
        '        a = 3',
      ].join('\n');

      expect(
        PythonCodePreprocessorService._wrapCodeIntoClass(rawCode)
      ).toEqual(expectedWrappedCode);
    });

    it('should correctly wrap multiple functions', function() {
      var rawCode = [
        'def funcOne(a, b):',
        '    x = 3',
        '',
        'def funcTwo(c):',
        '    d = 4'
      ].join('\n');

      var expectedWrappedCode = [
        'class StudentAnswer(object):',
        '    def funcOne(self, a, b):',
        '        x = 3',
        '    ',
        '    def funcTwo(self, c):',
        '        d = 4',
      ].join('\n');

      expect(
        PythonCodePreprocessorService._wrapCodeIntoClass(rawCode)
      ).toEqual(expectedWrappedCode);
    });

    it('should trim whitespace at the ends, but preserve it between functions',
      function() {
        var rawCode = [
          '',
          '',
          'def funcOne(a, b):',
          '    x = 3',
          '',
          '',
          '',
          'def funcTwo(c):',
          '    d = 4',
          '',
          '',
          ''
        ].join('\n');

        var expectedWrappedCode = [
          'class StudentAnswer(object):',
          '    def funcOne(self, a, b):',
          '        x = 3',
          '    ',
          '    ',
          '    ',
          '    def funcTwo(self, c):',
          '        d = 4',
        ].join('\n');

        expect(
          PythonCodePreprocessorService._wrapCodeIntoClass(rawCode)
        ).toEqual(expectedWrappedCode);
      }
    );

    it('should throw an error if the code cannot be transformed',
      function() {
        var rawCode = [
          'def funcOne:',
          '    x = 3'
        ].join('\n');

        expect(function() {
          PythonCodePreprocessorService._wrapCodeIntoClass(rawCode);
        }).toThrow(new Error('Incomplete line: missing "(" in def statement.'));
      }
    );
  })
});
