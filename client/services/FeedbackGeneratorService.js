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
  'FeedbackObjectFactory', 'TranscriptService',
  'CODE_EXECUTION_TIMEOUT_SECONDS', function(
    FeedbackObjectFactory, TranscriptService, CODE_EXECUTION_TIMEOUT_SECONDS) {
    // TODO(sll): Update this function to take the programming language into
    // account when generating the human-readable representations. Currently,
    // it assumes that Python is being used.
    var _jsToHumanReadable = function(jsVariable) {
      if (jsVariable === null || jsVariable === undefined) {
        return 'None';
      } else if (typeof jsVariable === 'string') {
        // Replace tab and newline characters with a literal backslash followed
        // by the character 't' or 'n', respectively.
        return (
          '"' + jsVariable.replace(/\t/g, '\\t').replace(/\n/g, '\\n') + '"');
      } else if (typeof jsVariable === 'number') {
        return String(jsVariable);
      } else if (typeof jsVariable === 'boolean') {
        return jsVariable ? 'True' : 'False';
      } else if (Array.isArray(jsVariable)) {
        var humanReadableElements = jsVariable.map(function(arrayElement) {
          return _jsToHumanReadable(arrayElement);
        });
        return '[' + humanReadableElements.join(', ') + ']';
      } else if (typeof jsVariable === 'object') {
        var humanReadableKeyValuePairs = [];
        for (var key in jsVariable) {
          humanReadableKeyValuePairs.push(
            _jsToHumanReadable(key) + ': ' +
            _jsToHumanReadable(jsVariable[key]));
        }
        return '{' + humanReadableKeyValuePairs.join(', ') + '}';
      } else {
        console.error(
          'Could not make the following object human-readable: ', jsVariable);
        return '[UNKNOWN OBJECT]';
      }
    };

    var _getBuggyOutputTestFeedback = function(failingTest, codeEvalResult) {
      var hintIndex = 0;
      var buggyMessages = failingTest.getMessages();
      var lastSnapshot = (
        TranscriptService.getTranscript().getPreviousSnapshot());
      if (lastSnapshot !== null) {
        // This section makes sure to provide a new hint
        // if the student gets stuck on the same bug by checking
        // that they've submitted new code with the same error.
        var previousFeedback = lastSnapshot.getFeedback();
        var previousHintIndex = previousFeedback.getHintIndex();
        if (previousHintIndex !== null) {
          var previousMessages = previousFeedback.getParagraphs();
          // This could cause a problem if two different buggy outputs
          // have the exact same hint, but that shouldn't be allowed.
          if (previousMessages[0].getContent() ===
              buggyMessages[previousHintIndex]) {
            var previousCode = (
              lastSnapshot.getCodeEvalResult().getCode());
            if (previousCode === codeEvalResult.getCode() ||
                previousHintIndex === buggyMessages.length - 1) {
              hintIndex = previousHintIndex;
            } else {
              hintIndex = previousHintIndex + 1;
            }
          }
        }
      }
      var feedback = FeedbackObjectFactory.create(false);
      feedback.appendTextParagraph(buggyMessages[hintIndex]);
      feedback.setHintIndex(hintIndex);
      return feedback;
    };

    var _getCorrectnessTestFeedback = function(
      correctnessTest, observedOutput) {
      var allowedOutputExample = correctnessTest.getAnyAllowedOutput();
      var feedback = FeedbackObjectFactory.create(false);
      feedback.appendTextParagraph('Your code produced the following result:');
      feedback.appendCodeParagraph(
        'Input: ' + _jsToHumanReadable(correctnessTest.getInput()) + '\n' +
        'Output: ' + _jsToHumanReadable(observedOutput));
      feedback.appendTextParagraph('However, the expected output is:');
      feedback.appendCodeParagraph(
        _jsToHumanReadable(allowedOutputExample));
      feedback.appendTextParagraph('Could you fix this?');
      return feedback;
    };

    var _getPerformanceTestFeedback = function(expectedPerformance) {
      var feedback = FeedbackObjectFactory.create(false);
      feedback.appendTextParagraph([
        'Your code is running more slowly than expected. Can you ',
        'reconfigure it such that it runs in ',
        expectedPerformance,
        ' time?'
      ].join(''));
      return feedback;
    };

    var _getRuntimeErrorFeedback = function(
        codeEvalResult, rawCodeLineIndexes) {
      var errorInput = codeEvalResult.getErrorInput();
      var inputClause = (
        ' when evaluating the input ' + _jsToHumanReadable(errorInput));
      var feedback = FeedbackObjectFactory.create(false);
      feedback.appendTextParagraph(
        "Looks like your code had a runtime error" + inputClause +
        ". Here's the trace:");

      var stringifiedErrorMessage = String(
        codeEvalResult.getErrorMessage());
      var fixedErrorMessage = stringifiedErrorMessage.replace(
        new RegExp('line ([0-9]+)$'), function(_, humanReadableLineNumber) {
          var preprocessedCodeLineIndex = (
            Number(humanReadableLineNumber) - 1);
          if (preprocessedCodeLineIndex < 0 ||
              preprocessedCodeLineIndex >= rawCodeLineIndexes.length) {
            throw Error(
              'Line number index out of range: ' + preprocessedCodeLineIndex);
          }

          if (rawCodeLineIndexes[preprocessedCodeLineIndex] === null) {
            return 'a line in the test code';
          } else {
            return 'line ' + (
              rawCodeLineIndexes[preprocessedCodeLineIndex] + 1);
          }
        }
      );
      feedback.appendCodeParagraph(fixedErrorMessage);
      return feedback;
    };

    var _getTimeoutErrorFeedback = function() {
      var feedback = FeedbackObjectFactory.create(false);
      feedback.appendTextParagraph([
        "Your program's exceeded the time limit (",
        CODE_EXECUTION_TIMEOUT_SECONDS,
        " seconds) we've set. Can you try to make it run ",
        "more efficiently?"
      ].join(''));
      return feedback;
    };

    return {
      getFeedback: function(task, codeEvalResult, rawCodeLineIndexes) {
        var errorMessage = codeEvalResult.getErrorMessage();
        if (errorMessage !== null &&
            errorMessage.toString().startsWith('TimeLimitError')) {
          // We want to catch and handle a timeout error uniquely, rather than
          // integrate it into the existing feedback pipeline.
          return _getTimeoutErrorFeedback();
        } else if (errorMessage) {
          return _getRuntimeErrorFeedback(codeEvalResult, rawCodeLineIndexes);
        } else {
          var buggyOutputTests = task.getBuggyOutputTests();
          var buggyOutputTestResults =
              codeEvalResult.getBuggyOutputTestResults();
          for (var i = 0; i < buggyOutputTests.length; i++) {
            if (buggyOutputTestResults[i]) {
              return _getBuggyOutputTestFeedback(
                buggyOutputTests[i], codeEvalResult);
            }
          }

          var correctnessTests = task.getCorrectnessTests();
          var observedOutputs = codeEvalResult.getCorrectnessTestResults();
          for (i = 0; i < correctnessTests.length; i++) {
            var observedOutput = observedOutputs[i];

            // TODO(eyurko): Add varied statements for when code is incorrect.
            if (!correctnessTests[i].matchesOutput(observedOutput)) {
              return _getCorrectnessTestFeedback(
                correctnessTests[i], observedOutput);
            }
          }

          var performanceTests = task.getPerformanceTests();
          var performanceTestResults =
              codeEvalResult.getPerformanceTestResults();
          for (i = 0; i < performanceTests.length; i++) {
            var expectedPerformance = (
              performanceTests[i].getExpectedPerformance());
            var observedPerformance = performanceTestResults[i];

            if (expectedPerformance !== observedPerformance) {
              return _getPerformanceTestFeedback(expectedPerformance);
            }
          }

          var feedback = FeedbackObjectFactory.create(true);
          feedback.appendTextParagraph([
            'You\'ve completed all the tasks for this question! Click the ',
            '"Next" button to move on to the next question.'
          ].join(''));
          return feedback;
        }
      },
      getSyntaxErrorFeedback: function(errorMessage) {
        var feedback = FeedbackObjectFactory.create(false);
        feedback.appendTextParagraph(
          "Looks like your code did not compile. Here's the error trace: ");
        feedback.appendCodeParagraph(errorMessage);
        return feedback;
      },
      _getBuggyOutputTestFeedback: _getBuggyOutputTestFeedback,
      _getCorrectnessTestFeedback: _getCorrectnessTestFeedback,
      _getPerformanceTestFeedback: _getPerformanceTestFeedback,
      _getRuntimeErrorFeedback: _getRuntimeErrorFeedback,
      _getTimeoutErrorFeedback: _getTimeoutErrorFeedback,
      _jsToHumanReadable: _jsToHumanReadable
    };
  }
]);
