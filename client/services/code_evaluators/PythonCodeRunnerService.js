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
 * @fileoverview Service for executing Python code snippets.
 */

tie.factory('PythonCodeRunnerService', [
  'CodeEvalResultObjectFactory', 'VARNAME_CORRECTNESS_TEST_RESULTS',
  'VARNAME_BUGGY_OUTPUT_TEST_RESULTS', 'VARNAME_PERFORMANCE_TEST_RESULTS',
  'VARNAME_MOST_RECENT_INPUT', 'CODE_EXECUTION_TIMEOUT_SECONDS',
  function(
      CodeEvalResultObjectFactory, VARNAME_CORRECTNESS_TEST_RESULTS,
      VARNAME_BUGGY_OUTPUT_TEST_RESULTS, VARNAME_PERFORMANCE_TEST_RESULTS,
      VARNAME_MOST_RECENT_INPUT, CODE_EXECUTION_TIMEOUT_SECONDS) {
    var SECONDS_TO_MILLISECONDS = 1000;
    var outputLines = [];

    var clearOutput = function() {
      outputLines.length = 0;
    };

    var addOutputLine = function(line) {
      outputLines.push(line);
    };

    return {
      // Returns a promise.
      runCodeAsync: function(code) {
        clearOutput();
        Sk.configure({
         output: addOutputLine,
         execLimit: CODE_EXECUTION_TIMEOUT_SECONDS * SECONDS_TO_MILLISECONDS,
         read: function(name) {
           // This bit is necessary to import Python stdlib modules, like time.
           if (!Sk.builtinFiles.files.hasOwnProperty(name)) {
             throw 'Could not find module ' + name;
           }
           return Sk.builtinFiles.files[name];
         }
        });
        return Sk.misceval.asyncToPromise(function() {
          return Sk.importMainWithBody('<stdin>', false, code, true);
        }).then(function() {
          var correctnessTestResults = [];
          var buggyOutputTestResults = [];
          var performanceTestResults = [];
          // These checks retrieve the values of Skulpt's representation of
          // the global Python 'test results' variables (which Skulpt stores in
          // Sk.globals), and maps each of them to a JS value for later
          // comparison against the "correct output" specification.
          if (Sk.globals.hasOwnProperty(VARNAME_CORRECTNESS_TEST_RESULTS)) {
            correctnessTestResults = Sk.ffi.remapToJs(
              Sk.globals[VARNAME_CORRECTNESS_TEST_RESULTS]);
          }
          if (Sk.globals.hasOwnProperty(VARNAME_BUGGY_OUTPUT_TEST_RESULTS)) {
            buggyOutputTestResults = Sk.ffi.remapToJs(
              Sk.globals[VARNAME_BUGGY_OUTPUT_TEST_RESULTS]);
          }
          if (Sk.globals.hasOwnProperty(VARNAME_PERFORMANCE_TEST_RESULTS)) {
            performanceTestResults = Sk.ffi.remapToJs(
              Sk.globals[VARNAME_PERFORMANCE_TEST_RESULTS]);
          }

          // The run was successful.
          return CodeEvalResultObjectFactory.create(
            code, outputLines.join('\n'), correctnessTestResults,
            buggyOutputTestResults, performanceTestResults, null, null);
        }, function(errorMessage) {
          var errorInput = null;
          if (Sk.globals.hasOwnProperty(VARNAME_MOST_RECENT_INPUT)) {
            errorInput = Sk.ffi.remapToJs(
              Sk.globals[VARNAME_MOST_RECENT_INPUT]);
          }

          return CodeEvalResultObjectFactory.create(
            code, '', [], [], [], errorMessage, errorInput);
        });
      }
    };
  }
]);
