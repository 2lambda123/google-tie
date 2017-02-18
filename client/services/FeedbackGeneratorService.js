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
 * @fileoverview Service for generating feedback based on the evaluation result
 * of the code submitted by the user, preprocessed and augmented with unit
 * tests. This assumes that the base code already passes "compile-time" checks.
 */

tie.factory('FeedbackGeneratorService', [
  function() {
    // TODO(sll): Add escaping?
    var jsToHumanReadable = function(jsVariable) {
      if (typeof jsVariable === 'string') {
        return '"' + jsVariable + '"';
      }
    };

    return {
      getFeedback: function(prompt, codeEvalResult) {
        if (codeEvalResult.getErrorMessage()) {
          return (
            'Your code threw an error: ' + codeEvalResult.getErrorMessage());
        } else {
          var correctnessTests = prompt.getCorrectnessTests();
          var observedOutputs = codeEvalResult.getTestResults();
          for (var i = 0; i < correctnessTests.length; i++) {
            var expectedOutput = correctnessTests[i].getExpectedOutput();
            var observedOutput = observedOutputs[i];

            if (expectedOutput !== observedOutput) {
              return [
                'Your code gave the output ',
                jsToHumanReadable(observedOutput),
                ' for the input ',
                jsToHumanReadable(correctnessTests[i].getInput()),
                ' ... but this does not match the expected output ',
                jsToHumanReadable(expectedOutput),
                '.'
              ].join('');
            }
          }
          return [
            'Congratulations -- your code looks correct! ',
            'It passes all our test cases.'
          ].join('');
        }
      }
    };
  }
]);
