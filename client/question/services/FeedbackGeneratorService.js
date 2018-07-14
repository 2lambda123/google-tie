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
  'CODE_EXECUTION_TIMEOUT_SECONDS', 'SUPPORTED_PYTHON_LIBS',
  'RUNTIME_ERROR_FEEDBACK_MESSAGES', 'WRONG_LANGUAGE_ERRORS', 'LANGUAGE_PYTHON',
  'CLASS_NAME_AUXILIARY_CODE', 'CLASS_NAME_SYSTEM_CODE',
  'CLASS_NAME_STUDENT_CODE', 'PARAGRAPH_TYPE_TEXT',
  'PARAGRAPH_TYPE_CODE', 'PARAGRAPH_TYPE_ERROR',
  'PYTHON_PRIMER_BUTTON_NAME', 'CORRECTNESS_FEEDBACK_TEXT',
  'FEEDBACK_CATEGORIES', 'TEST_SUITE_ID_SAMPLE_INPUT',
  'CORRECTNESS_STATE_STARTING', 'CORRECTNESS_STATE_INPUT_DISPLAYED',
  'CORRECTNESS_STATE_EXPECTED_OUTPUT_DISPLAYED',
  'CORRECTNESS_STATE_OBSERVED_OUTPUT_AVAILABLE',
  'FEEDBACK_TYPE_INPUT_TO_TRY', 'FEEDBACK_TYPE_EXPECTED_OUTPUT',
  'FEEDBACK_TYPE_OUTPUT_ENABLED',
  function(
    FeedbackObjectFactory, TranscriptService,
    CODE_EXECUTION_TIMEOUT_SECONDS, SUPPORTED_PYTHON_LIBS,
    RUNTIME_ERROR_FEEDBACK_MESSAGES, WRONG_LANGUAGE_ERRORS, LANGUAGE_PYTHON,
    CLASS_NAME_AUXILIARY_CODE, CLASS_NAME_SYSTEM_CODE,
    CLASS_NAME_STUDENT_CODE, PARAGRAPH_TYPE_TEXT,
    PARAGRAPH_TYPE_CODE, PARAGRAPH_TYPE_ERROR,
    PYTHON_PRIMER_BUTTON_NAME, CORRECTNESS_FEEDBACK_TEXT,
    FEEDBACK_CATEGORIES, TEST_SUITE_ID_SAMPLE_INPUT,
    CORRECTNESS_STATE_STARTING, CORRECTNESS_STATE_INPUT_DISPLAYED,
    CORRECTNESS_STATE_EXPECTED_OUTPUT_DISPLAYED,
    CORRECTNESS_STATE_OBSERVED_OUTPUT_AVAILABLE,
    FEEDBACK_TYPE_INPUT_TO_TRY, FEEDBACK_TYPE_EXPECTED_OUTPUT,
    FEEDBACK_TYPE_OUTPUT_ENABLED) {

    /**
     * Object used to keep track of which state we are in for correctness
     * feedback. The key indicates the test case (key generated by
     * _getTestCaseKey) and the value is the feedback state (e.g.,
     * CORRECTNESS_STATE_STARTING).
     *
     * @type {Object.<string, string>}
     */
    var correctnessTestStates = {};

    /**
     * Object to hold array indexes (values) of available correctness feedback
     * text as listed in CORRECTNESS_FEEDBACK_TEXT, per feedback type (keys).
     * Used in order to avoid presenting the same feedback text consecutively.
     * A given feedback text is not used again until all other available
     * alternative texts are used.
     *
     * @type {Object.<string, Array.<string>>}
     */
    var availableCorrectnessFeedbackIndexes = {};

    /**
     * ID of last test suite for which correctness feedback was given. Used
     * to determine if the user has moved on to a new test suite.
     *
     * @type {string}
     */
    var previousTestSuiteId = '';

    /**
     * Pseudo-randomly returns an int between min (inclusive) and max.
     *
     * @param {number} min Minimum number for range (inclusive).
     * @param {number} max Maximum number for range (exclusive).
     * @returns {number}
     * @private
     */
    var _getRandomInt = function(min, max) {
      var minimum = Math.ceil(min);
      var maximum = Math.floor(max);
      return Math.floor(Math.random() * (maximum - minimum)) + minimum;
    };

    /**
     * Randomly selects feedback string from an object containing variations
     * of a given feedback type.
     *
     * @param {string} feedbackType Correctness feedback type.
     * @returns {string}
     * @private
     */
    var _getCorrectnessFeedbackString = function(feedbackType) {
      if (!availableCorrectnessFeedbackIndexes.hasOwnProperty(feedbackType)) {
        availableCorrectnessFeedbackIndexes[feedbackType] = [];
      }
      // Resets availableCorrectnessFeedbackIndexes when length is 0.
      if (availableCorrectnessFeedbackIndexes[feedbackType].length === 0) {
        var feedbackMaxArrayLength =
          CORRECTNESS_FEEDBACK_TEXT[feedbackType].length;
        // Creates an array in which each value corresponds to its index.
        availableCorrectnessFeedbackIndexes[feedbackType] =
          Array.apply(null, {length: feedbackMaxArrayLength}).map(
          Number.call, Number);
      }
      var randomArrayIndex = _getRandomInt(
        0, availableCorrectnessFeedbackIndexes[feedbackType].length);
      var correctnessFeedbackIndex =
        availableCorrectnessFeedbackIndexes[feedbackType][randomArrayIndex];
      availableCorrectnessFeedbackIndexes[feedbackType].splice(
        randomArrayIndex, 1);
      return CORRECTNESS_FEEDBACK_TEXT[feedbackType][correctnessFeedbackIndex];
    };

    // TODO(sll): Update this function to take the programming language into
    // account when generating the human-readable representations. Currently,
    // it assumes that Python is being used.
    /**
     * Converts a Javascript variable to a human-readable element.
     * If the variable is a string, then it returns a string without the
     * formatting symbols.
     * If the variable is a number or boolean, then it returns a string
     * version of the variable.
     * If the variable is an Array, then it returns an Array with human readable
     * versions of each element.
     * If the variable is an object, then it returns a dictionary with human
     * readable versions of each key and their respective value.
     *
     * @param {*} jsVariable
     * @returns {*}
     * @private
     */
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
        throw Error(
          'Could not make the following object human-readable: ', jsVariable);
      }
    };

    /**
     * Returns a boolean representing whether the student's code has changed
     * from the previous attempt.
     *
     * @param {CodeEvalResult} codeEvalResult
     * @returns {boolean}
     * @private
     */
    var _hasCodeChanged = function(codeEvalResult) {
      var lastSnapshot = (
        TranscriptService.getTranscript().getMostRecentSnapshot());
      return (
        lastSnapshot !== null &&
        lastSnapshot.getCodeEvalResult() !== null &&
        !codeEvalResult.hasSameRawCodeAs(
          lastSnapshot.getCodeEvalResult()));
    };

    /**
     * Returns the specific feedback created as a result of a failing buggy
     * output or suite-level test, or null if all hints for that test have been
     * exhausted.
     *
     * @param {Array} messages The array of message strings.
     * @param {bool} codeHasChanged Whether the learner's code has changed
     *   since the previous submission attempt.
     * @param {string} currentFeedbackCategory The feedback category for the
     *   current set of message strings.
     * @returns {Feedback|null}
     * @private
     */
    var _getSpecificTestFeedback = function(
        messages, codeHasChanged, currentFeedbackCategory) {
      var previousHintIndex = 0;
      var previousMessage = null;

      var lastSnapshot = (
        TranscriptService.getTranscript().getMostRecentSnapshot());
      if (lastSnapshot !== null && lastSnapshot.getCodeEvalResult() !== null) {
        var previousFeedback = lastSnapshot.getFeedback();
        previousMessage = previousFeedback.getParagraphs()[0].getContent();

        if (previousFeedback.getFeedbackCategory() ===
            currentFeedbackCategory) {
          previousHintIndex = lastSnapshot.getFeedback().getHintIndex();
        }
      }

      var newHintIndex = previousHintIndex;
      // Provide a new hint if the student gets stuck on the same bug despite
      // having modified their code, since in that case we don't want to give
      // the same message twice in a row.
      if (codeHasChanged && messages[previousHintIndex] === previousMessage) {
        newHintIndex++;
      }

      if (newHintIndex >= messages.length) {
        return null;
      }
      var feedback = FeedbackObjectFactory.create(currentFeedbackCategory);
      feedback.appendTextParagraph(messages[newHintIndex]);
      feedback.setHintIndex(newHintIndex);
      return feedback;
    };

    /**
     * Returns the feedback created as a result of a failing buggy output test,
     * or null if all hints for that test have been exhausted.
     *
     * @param {BuggyOutputTest} failingTest
     * @param {bool} codeHasChanged
     * @returns {Feedback|null}
     * @private
     */
    var _getBuggyOutputTestFeedback = function(failingTest, codeHasChanged) {
      var messages = failingTest.getMessages();
      return _getSpecificTestFeedback(
        messages, codeHasChanged, FEEDBACK_CATEGORIES.KNOWN_BUG_FAILURE);
    };

    /**
     * Returns the feedback created as a result of a failing suite-level test,
     * or null if all hints for that test have been exhausted.
     *
     * @param {SuiteLevelTest} suiteLevelTest
     * @param {CodeEvalResult} codeHasChanged
     * @returns {Feedback|null}
     * @private
     */
    var _getSuiteLevelTestFeedback = function(suiteLevelTest, codeHasChanged) {
      var messages = suiteLevelTest.getMessages();
      return _getSpecificTestFeedback(
        messages, codeHasChanged, FEEDBACK_CATEGORIES.SUITE_LEVEL_FAILURE);
    };

    /**
     * Generates a unique test case key for the given (test suite, test case)
     * pair.
     *
     * @param {string} testSuiteId
     * @param {string} testCaseIndex
     */
    var _getTestCaseKey = function(testSuiteId, testCaseIndex) {
      return testSuiteId + '-' + testCaseIndex;
    };

    /**
     * Returns the Feedback object created as a result of a specified
     * correctness test.
     *
     * @param {CorrectnessTest} TestCase
     * @param {string} testSuiteId
     * @param {number} testCaseIndex
     * @param {*} observedOutput Actual output for running user's code.
     * @returns {Feedback}
     * @private
     */
    var _getCorrectnessTestFeedback = function(
      testCase, testSuiteId, testCaseIndex, observedOutput) {
      var testCaseKey = _getTestCaseKey(testSuiteId, testCaseIndex);
      var allowedOutputExample = testCase.getAnyAllowedOutput();
      var feedback = FeedbackObjectFactory.create(
        FEEDBACK_CATEGORIES.INCORRECT_OUTPUT_FAILURE);
      // Check if this is a new / next test suite.
      if (testSuiteId !== previousTestSuiteId) {
        previousTestSuiteId = testSuiteId;
        // Catch regressions to errors previously encountered and passed.
        // If certain feedback was given before, the user passes the test,
        // then later regresses, do not repeat feedback that was given before.
        // Note that if they passed a given test on the first try but later
        // regress, it is OK to display feedback as if it was the first time
        // they encountered the error; subsequent regressions will be captured
        // here.
        if (correctnessTestStates.hasOwnProperty(testCaseKey)) {
          feedback.appendTextParagraph(
            'It looks like there was a regression in your code. Your code ' +
            'used to work for the following, but it now fails:');
          feedback.appendCodeParagraph(
            'Input: ' + _jsToHumanReadable(testCase.getInput()) + '\n' +
            'Expected Output: ' + _jsToHumanReadable(allowedOutputExample));
          return feedback;
        }
        correctnessTestStates[testCaseKey] = CORRECTNESS_STATE_STARTING;
      }
      // If the suite ID corresponds to the sample input, the question will
      // already have displayed the input and expected output, so we advance
      // the correctness state to "expected output displayed".
      if (testSuiteId === TEST_SUITE_ID_SAMPLE_INPUT) {
        correctnessTestStates[testCaseKey] =
          CORRECTNESS_STATE_EXPECTED_OUTPUT_DISPLAYED;
      }
      switch (correctnessTestStates[testCaseKey]) {
        case CORRECTNESS_STATE_STARTING:
          // Display an input that the learner should use to manually walk
          // through their code.
          feedback.appendTextParagraph(
            _getCorrectnessFeedbackString(FEEDBACK_TYPE_INPUT_TO_TRY));
          feedback.appendCodeParagraph(
            'Input: ' + _jsToHumanReadable(testCase.getInput()));
          correctnessTestStates[testCaseKey] =
            CORRECTNESS_STATE_INPUT_DISPLAYED;
          return feedback;
        case CORRECTNESS_STATE_INPUT_DISPLAYED:
          // Display expected output to the user.
          feedback.appendTextParagraph(
            _getCorrectnessFeedbackString(FEEDBACK_TYPE_EXPECTED_OUTPUT));
          feedback.appendCodeParagraph(
            'Input: ' + _jsToHumanReadable(testCase.getInput()) + '\n' +
            'Expected Output: ' +
            _jsToHumanReadable(allowedOutputExample));
          correctnessTestStates[testCaseKey] =
            CORRECTNESS_STATE_EXPECTED_OUTPUT_DISPLAYED;
          return feedback;
        default:
          // Allow the user to display the output of their code.
          feedback.appendTextParagraph(
            _getCorrectnessFeedbackString(FEEDBACK_TYPE_OUTPUT_ENABLED));
          feedback.appendOutputParagraph(
            'Input: ' + _jsToHumanReadable(testCase.getInput()) +
            '\nExpected Output: ' + _jsToHumanReadable(allowedOutputExample) +
            '\nActual Output: ' + _jsToHumanReadable(observedOutput));
          correctnessTestStates[testCaseKey] =
            CORRECTNESS_STATE_OBSERVED_OUTPUT_AVAILABLE;
          return feedback;
      }
    };

    /**
     * Returns the Feedback related to a failing performance test.
     *
     * @param {string} expectedPerformance
     * @returns {Feedback}
     * @private
     */
    var _getPerformanceTestFeedback = function(expectedPerformance) {
      var feedback = FeedbackObjectFactory.create(
        FEEDBACK_CATEGORIES.PERFORMANCE_TEST_FAILURE);
      feedback.appendTextParagraph([
        'Your code is running more slowly than expected. Can you ',
        'reconfigure it such that it runs in ',
        expectedPerformance,
        ' time?'
      ].join(''));
      return feedback;
    };

    /**
     * Based on passed in error string, will generate the appropriate,
     * informative feedback to be appended to the overall submission feedback.
     *
     * @param {string} errorString
     * @param {string} language
     * @returns {string | null} Text to be appended to feedback.
     */
    var _getHumanReadableRuntimeFeedback = function(errorString, language) {
      var result = null;
      RUNTIME_ERROR_FEEDBACK_MESSAGES[language].forEach(function(check) {
        if (check.checker(errorString)) {
          result = check.generateMessage(errorString);
        }
      });
      return result;
    };

    /**
     * Returns a string of the feedback to be returned when it is detected that
     * the user is unfamiliar with the given programming language.
     *
     * @param {string} language
     * @returns {String}
     * @private
     */
    var _getUnfamiliarLanguageFeedback = function(language) {
      if (language === LANGUAGE_PYTHON) {
        return [
          "Seems like you're having some trouble with Python. Why ",
          "don't you take a look at the page linked through the '",
          PYTHON_PRIMER_BUTTON_NAME + "' button at the bottom of the screen?"
        ].join('');
      } else {
        return '';
      }
    };

    /**
     * Returns the Feedback object associated with a given user submission.
     * This assumes that the feedback is not of the forms: timeout, syntax
     * error, server error or runtime error.
     *
     * @param {Array} tasks Tasks associated with the problem that include
     *    the tests the user's code must pass.
     * @param {CodeEvalResult} codeEvalResult Test results for this submission
     * @returns {Feedback}
     * @private
     */
    var _getMainFeedback = function(tasks, codeEvalResult) {
      var buggyOutputTestResults = codeEvalResult.getBuggyOutputTestResults();
      var observedOutputs = codeEvalResult.getObservedOutputs();
      var performanceTestResults = codeEvalResult.getPerformanceTestResults();
      var codeHasChanged = _hasCodeChanged(codeEvalResult);

      for (var i = 0; i < tasks.length; i++) {
        var buggyOutputTests = tasks[i].getBuggyOutputTests();
        var suiteLevelTests = tasks[i].getSuiteLevelTests();
        var testSuites = tasks[i].getTestSuites();
        var performanceTests = tasks[i].getPerformanceTests();
        var passingSuiteIds = codeEvalResult.getPassingSuiteIds(tasks, i);

        for (var j = 0; j < buggyOutputTests.length; j++) {
          if (buggyOutputTestResults[i][j]) {

            var feedback = _getBuggyOutputTestFeedback(
              buggyOutputTests[j], codeHasChanged);
            // Null feedback indicates that we've run out of hints and should
            // provide correctness-test output feedback instead.
            if (!feedback) {
              break;
            }

            return feedback;
          }
        }

        for (j = 0; j < suiteLevelTests.length; j++) {
          if (suiteLevelTests[j].areConditionsMet(passingSuiteIds)) {
            feedback = _getSuiteLevelTestFeedback(
              suiteLevelTests[j], codeHasChanged);
            if (!feedback) {
              break;
            }

            return feedback;
          }
        }

        for (j = 0; j < testSuites.length; j++) {
          var testCases = testSuites[j].getTestCases();
          for (var testCaseIndex = 0; testCaseIndex < testCases.length;
            testCaseIndex++) {
            var testCase = testCases[testCaseIndex];
            var testSuiteId = testSuites[j].getId();
            var observedOutput = observedOutputs[i][j][testCaseIndex];
            if (!testCase.matchesOutput(observedOutput)) {
              return _getCorrectnessTestFeedback(
                testCase, testSuiteId, testCaseIndex, observedOutput);
            }
          }
        }

        for (j = 0; j < performanceTests.length; j++) {
          var expectedPerformance = (
            performanceTests[j].getExpectedPerformance());
          var observedPerformance = performanceTestResults[i][j];

          if (expectedPerformance !== observedPerformance) {
            return _getPerformanceTestFeedback(expectedPerformance);
          }
        }
      }

      feedback = FeedbackObjectFactory.create(FEEDBACK_CATEGORIES.SUCCESSFUL);
      feedback.appendTextParagraph([
        'You\'ve completed all the tasks for this question! Click the ',
        '"Next" button to move on to the next question.'
      ].join(''));
      return feedback;
    };

    return {
      /**
       * Returns the feedback associated with a user's code submission and
       * their test results. This assumes that the feedback is not of the
       * forms: timeout, syntax error, server error or runtime error.
       *
       * @param {Array} tasks Tasks associated with the problem that include
       *    the tests the user's code must pass.
       * @param {CodeEvalResult} codeEvalResult Test results for this submission
       * @returns {Feedback}
       */
      getFeedback: function(tasks, codeEvalResult) {
        var feedback = _getMainFeedback(tasks, codeEvalResult);
        return feedback;
      },
      /**
       * Returns the Feedback object for the given syntax error details.
       *
       * @param {FeedbackDetails} feedbackDetails The feedback details
       *   characterizing the syntax error.
       * @returns {Feedback}
       */
      getSyntaxErrorFeedback: function(feedbackDetails) {
        var errorString = feedbackDetails.getErrorString();
        var languageUnfamiliarityFeedbackIsNeeded = (
          feedbackDetails.isLanguageUnfamiliarityFeedbackNeeded());
        var language = feedbackDetails.getLanguage();

        var feedback = FeedbackObjectFactory.create(
          FEEDBACK_CATEGORIES.SYNTAX_ERROR);
        feedback.appendTextParagraph(
          'It looks like your code has a syntax error. ' +
          'Try to figure out what the error is.');
        feedback.appendErrorParagraph(errorString);
        if (languageUnfamiliarityFeedbackIsNeeded) {
          feedback.appendTextParagraph(
            _getUnfamiliarLanguageFeedback(language));
        }

        return feedback;
      },
      /**
       * Returns the appropriate Feedback object for the given Prerequisite
       * Check Failure.
       *
       * @param {PrereqCheckFailure} prereqCheckFailure
       * @param {bool} languageUnfamiliarityFeedbackIsNeeded
       * @param {string} language The language that the code is written in.
       * @returns {Feedback}
       */
      getPrereqFailureFeedback: function(
          prereqCheckFailure, languageUnfamiliarityFeedbackIsNeeded, language) {
        var feedback = null;
        if (prereqCheckFailure.isMissingStarterCode()) {
          feedback = FeedbackObjectFactory.create(
            FEEDBACK_CATEGORIES.FAILS_STARTER_CODE_CHECK);
          feedback.appendTextParagraph([
            'It looks like you deleted or modified the starter code!  Our ',
            'evaluation program requires the function names given in the ',
            'starter code.  You can press the \'Reset Code\' button to start ',
            'over.  Or, you can copy the starter code below:'
          ].join(''));
          feedback.appendCodeParagraph(prereqCheckFailure.getStarterCode());
        } else if (prereqCheckFailure.isBadImport()) {
          feedback = FeedbackObjectFactory.create(
            FEEDBACK_CATEGORIES.FAILS_BAD_IMPORT_CHECK);
          feedback.appendTextParagraph([
            "It looks like you're importing an external library. However, the ",
            'following libraries are not supported:\n'
          ].join(''));
          feedback.appendCodeParagraph(
            prereqCheckFailure.getBadImports().join('\n'));
          feedback.appendTextParagraph(
            'Here is a list of libraries we currently support:\n');
          feedback.appendCodeParagraph(SUPPORTED_PYTHON_LIBS.join(', '));
        } else if (prereqCheckFailure.hasGlobalCode()) {
          feedback = FeedbackObjectFactory.create(
            FEEDBACK_CATEGORIES.FAILS_GLOBAL_CODE_CHECK);
          feedback.appendTextParagraph([
            'Please keep your code within the existing predefined functions ',
            'or define your own helper functions if you need to ',
            '-- we cannot process code in the global scope.'
          ].join(' '));
        } else if (prereqCheckFailure.hasWrongLanguage()) {
          feedback = FeedbackObjectFactory.create(
            FEEDBACK_CATEGORIES.FAILS_LANGUAGE_DETECTION_CHECK);
          WRONG_LANGUAGE_ERRORS.python.forEach(function(error) {
            if (error.errorName === prereqCheckFailure.getWrongLangKey()) {
              error.feedbackParagraphs.forEach(function(paragraph) {
                if (paragraph.type === PARAGRAPH_TYPE_TEXT) {
                  feedback.appendTextParagraph(paragraph.content);
                } else if (paragraph.type === PARAGRAPH_TYPE_CODE) {
                  feedback.appendCodeParagraph(paragraph.content);
                } else if (paragraph.type === PARAGRAPH_TYPE_ERROR) {
                  feedback.appendTextParagraph(
                    'It looks like your code has a syntax error. ' +
                    'Try to figure out what the error is.');
                  feedback.appendErrorParagraph(paragraph.content);
                }
              });

              var errorLineNumber = prereqCheckFailure.getErrorLineNumber();
              if (errorLineNumber) {
                feedback.setErrorLineNumber(errorLineNumber);
                feedback.appendTextParagraph('(See line ' + errorLineNumber +
                  ' of the code.)');
              }
            }
          });
        } else if (prereqCheckFailure.hasInvalidAuxiliaryCodeCall()) {
          feedback = FeedbackObjectFactory.create(
            FEEDBACK_CATEGORIES.FAILS_FORBIDDEN_NAMESPACE_CHECK);
          feedback.appendTextParagraph([
            'Looks like your code had a runtime error. Here is the error ',
            'message: '
          ].join(''));
          feedback.appendCodeParagraph([
            'ForbiddenNamespaceError: It looks like you\'re trying to call ',
            'the ' + CLASS_NAME_AUXILIARY_CODE + ' class or its methods, ',
            'which is forbidden. Please resubmit without using this class.'
          ].join(''));
        } else if (prereqCheckFailure.hasInvalidSystemCall()) {
          feedback = FeedbackObjectFactory.create(
            FEEDBACK_CATEGORIES.FAILS_FORBIDDEN_NAMESPACE_CHECK);
          feedback.appendTextParagraph([
            'Looks like your code had a runtime error. Here is the error ',
            'message: '
          ].join(''));
          feedback.appendCodeParagraph([
            'ForbiddenNamespaceError: It looks you\'re using the ' +
            CLASS_NAME_SYSTEM_CODE + ' class or its methods, which is ',
            'forbidden. Please resubmit without using this class.'
          ].join(''));
        } else if (prereqCheckFailure.hasInvalidStudentCodeCall()) {
          feedback = FeedbackObjectFactory.create(
            FEEDBACK_CATEGORIES.FAILS_FORBIDDEN_NAMESPACE_CHECK);
          feedback.appendTextParagraph([
            'Looks like your code had a runtime error. Here is the error ',
            'message: '
          ].join(''));
          feedback.appendCodeParagraph([
            'ForbiddenNamespaceError: It looks you\'re trying to call the ' +
            CLASS_NAME_STUDENT_CODE + ' class or its methods, which is ',
            'forbidden. Please resubmit without using this class.'
          ].join(''));
        } else {
          // Prereq check failure type not handled; throw an error.
          throw new Error(['Unrecognized prereq check failure type ',
            'in getPrereqFailureFeedback().'].join());
        }

        if (languageUnfamiliarityFeedbackIsNeeded) {
          feedback.appendTextParagraph(
            _getUnfamiliarLanguageFeedback(language));
        }

        return feedback;
      },
      /**
       * Returns the Feedback object associated with a timeout error.
       *
       * @returns {Feedback}
       */
      getTimeoutErrorFeedback: function() {
        var feedback = FeedbackObjectFactory.create(
          FEEDBACK_CATEGORIES.TIME_LIMIT_ERROR);
        feedback.appendTextParagraph([
          "Your program's exceeded the time limit (",
          CODE_EXECUTION_TIMEOUT_SECONDS,
          " seconds) we've set. Can you try to make it run ",
          "more efficiently?"
        ].join(''));
        return feedback;
      },
      /**
       * Returns the Feedback object associated with an "stack exceeded" error.
       *
       * @returns {Feedback}
       */
      getStackExceededFeedback: function() {
        var feedback = FeedbackObjectFactory.create(
          FEEDBACK_CATEGORIES.STACK_EXCEEDED_ERROR);
        feedback.appendTextParagraph([
          "Looks like your code is hitting an infinite recursive loop.",
          "Check to see that your recursive calls terminate."
        ].join(' '));
        return feedback;
      },
      /**
       * Returns the Feedback related to a server error.
       *
       * @returns {Feedback}
       */
      getServerErrorFeedback: function() {
        var feedback = FeedbackObjectFactory.create(
          FEEDBACK_CATEGORIES.SERVER_ERROR);
        feedback.appendTextParagraph([
          'A server error has occurred. We are looking into it ',
          'and will fix it as quickly as possible. We apologize ',
          'for the inconvenience.'
        ].join(''));
        return feedback;
      },
      /**
       * Returns the Feedback object associated with a runtime error when
       * running the user code.
       *
       * @param {FeedbackDetails} feedbackDetails The feedback details
       *   characterizing the runtime error.
       * @param {Array} rawCodeLineIndexes The code line numbers for the user's
       *    submission. Should be an array of numbers.
       * @returns {Feedback}
       */
      getRuntimeErrorFeedback: function(feedbackDetails, rawCodeLineIndexes) {
        var errorInput = feedbackDetails.getErrorInput();
        var errorString = feedbackDetails.getErrorString();
        var language = feedbackDetails.getLanguage();
        var languageUnfamiliarityFeedbackIsNeeded = (
          feedbackDetails.isLanguageUnfamiliarityFeedbackNeeded());

        var feedback = FeedbackObjectFactory.create(
          FEEDBACK_CATEGORIES.RUNTIME_ERROR);
        var fixedErrorString = errorString.replace(
          new RegExp('line ([0-9]+)$'), function(_, humanReadableLineNumber) {
            var preprocessedCodeLineIndex = (
              Number(humanReadableLineNumber) - 1);
            if (preprocessedCodeLineIndex < 0 ||
                preprocessedCodeLineIndex >= rawCodeLineIndexes.length) {
              throw Error(
                'Line number index out of range: ' + preprocessedCodeLineIndex);
            }
            if (rawCodeLineIndexes[preprocessedCodeLineIndex] === null) {
              console.error(
                'Runtime error on line ' + preprocessedCodeLineIndex +
                ' in the preprocessed code');
              return 'a line in the test code';
            } else {
              return 'line ' + (
                rawCodeLineIndexes[preprocessedCodeLineIndex] + 1);
            }
          }
        );

        var humanReadableFeedbackString = _getHumanReadableRuntimeFeedback(
          fixedErrorString, language);
        if (humanReadableFeedbackString) {
          feedback.appendTextParagraph(humanReadableFeedbackString);
        } else {
          feedback.appendTextParagraph(
            'Looks like your code had a runtime error when evaluating the ' +
            'input ' + _jsToHumanReadable(errorInput) + '.');
          feedback.appendErrorParagraph(fixedErrorString);
        }

        if (languageUnfamiliarityFeedbackIsNeeded) {
          feedback.appendTextParagraph(
            _getUnfamiliarLanguageFeedback(language));
        }

        return feedback;
      },
      _getBuggyOutputTestFeedback: _getBuggyOutputTestFeedback,
      _getSuiteLevelTestFeedback: _getSuiteLevelTestFeedback,
      _getCorrectnessFeedbackString: _getCorrectnessFeedbackString,
      _getCorrectnessTestFeedback: _getCorrectnessTestFeedback,
      _getPerformanceTestFeedback: _getPerformanceTestFeedback,
      _getUnfamiliarLanguageFeedback: _getUnfamiliarLanguageFeedback,
      _getRandomInt: _getRandomInt,
      _getHumanReadableRuntimeFeedback: _getHumanReadableRuntimeFeedback,
      _jsToHumanReadable: _jsToHumanReadable
    };
  }
]);
