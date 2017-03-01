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
 * @fileoverview Directive for the learner "practice question" view.
 */

tie.directive('learnerView', [function() {
  return {
    restrict: 'E',
    scope: {},
    template: `
      <div class="tie-exercise-ui-outer">
        <div class="tie-exercise-ui-inner">
          <div>
            Stepper:
            <div ng-repeat="questionId in questionIds track by $index">
              <span ng-class="{'tie-active-question-index': currentQuestionIndex === $index}">
                {{$index + 1}}
              </span>
            </div>
          </div>
          <div class="tie-coding-ui">
            <div class="tie-feedback-window">
              <div id="tie-feedback" class="tie-feedback">
                <p ng-repeat="paragraph in feedbackParagraphs track by $index"
                    class="tie-feedback-paragraph">
                  {{paragraph}}
                </p>
              </div>
            </div>
            <div class="tie-coding-window">
              <div class="tie-lang-terminal">
                <div class="tie-coding-terminal">
                  <ui-codemirror ui-codemirror="codeMirrorOptions" ng-model="code" class="tie-codemirror-container"></ui-codemirror>
                </div>
                <select class="tie-lang-select-menu"
                    name="lang-select-menu">
                  <option value="Python" selected>Python</option>
                </select>
                <button class="tie-run-button"
                    ng-class="{'active': !nextButtonIsShown}"
                    ng-click="submitCode(code)"
                    ng-disabled="nextButtonIsShown">
                  Run
                </button>
              </div>
            </div>
          </div>
          <div class="tie-question-ui">
            <div class="tie-question-window">
              <h3>Exercise {{currentQuestionIndex + 1}}: {{title}}</h3>
              <div class="tie-previous-instructions">
                <div ng-repeat="previousInstruction in previousInstructions track by $index">
                  <p ng-repeat="paragraph in previousInstruction track by $index">
                    {{paragraph}}
                  </p>
                  <hr>
                </div>
              </div>
              <div id="tie-instructions" class="tie-instructions">
                <p ng-repeat="paragraph in instructions">
                  {{paragraph}}
                </p>
              </div>
            </div>
            <button ng-click="showNextPrompt()" ng-if="nextButtonIsShown"
                class="tie-next-button">Next</button>
            </button>
          </div>
        </div>
      </div>
      <style>
        body {
          background-color: rgb(242, 242, 242);
          font-family: Roboto, 'Helvetica Neue', 'Lucida Grande', sans-serif;
          font-size: 15px;
        }
        /* TODO(sll): This is temporary styling. */
        .tie-active-question-index {
          font-weight: bold;
          color: green;
        }
        .tie-coding-terminal .CodeMirror {
          /* Overwriting codemirror defaults */
          height: 100%;
        }
        .tie-codemirror-container {
          width: 100%;
        }
        .tie-coding-terminal {
          display: flex;
          font-size: 13px;
          height: 368px;
          margin-top: 10px;
          width: 662px;
        }
        .tie-coding-window {
          display: inherit;
        }
        .tie-coding-terminal, .tie-question-window {
          background-color: rgb(255, 255, 255);
          border-color: rgb(222, 222, 222);
          border-radius: 3px;
          border-style: solid;
          border-width: 1px;
          -webkit-font-smoothing: antialiased;
        }
        .tie-coding-terminal:focus, .tie-lang-select-menu:focus, .tie-run-button:focus {
          outline: 0;
        }
        .tie-coding-ui, .tie-question-ui {
          display: inline-block;
          margin: 8px;
        }
        .tie-exercise-ui-inner {
          padding-left: 32px;
          padding-right: 32px;
        }
        .tie-exercise-ui-outer {
          display: table;
          margin-left: auto;
          margin-right: auto;
          margin-top: 32px;
        }
        .tie-feedback-window {
          background-color: rgb(255, 255, 242);
          border-color: rgb(222, 222, 222);
          border-radius: 3px;
          border-style: solid;
          border-width: 1px;
          font-size: 14px;
          height: 128px;
          overflow: auto;
          padding: 10px;
          resize: both;
          width: 642px;
          -webkit-font-smoothing: antialiased;
        }
        .tie-lang-select-menu {
          float: left;
          margin-top: 10px;
        }
        .tie-lang-terminal {
          display: inline;
        }
        .tie-next-button {
          background-color: rgb(32, 142, 64);
          border-radius: 4px;
          border-style: none;
          color: white;
          cursor: pointer;
          float: right;
          font-family: Roboto, 'Helvetica Neue', 'Lucida Grande', sans-serif;
          font-size: 12px;
          height: 24px;
          margin-top: 10px;
          position: relative;
          width: 100px;
        }
        .tie-previous-instructions {
          opacity: 0.5;
        }
        .tie-question-ui {
          vertical-align: top;
        }
        .tie-question-window {
          font-size: 14px;
          height: 508px;
          overflow: auto;
          padding: 10px;
          resize: both;
          width: 548px;
        }
        .tie-run-button {
          background-color: rgb(66, 133, 244);
          border-radius: 4px;
          border-style: none;
          color: white;
          cursor: pointer;
          float: right;
          font-family: Roboto, 'Helvetica Neue', 'Lucida Grande', sans-serif;
          font-size: 12px;
          height: 24px;
          margin-top: 10px;
          position: relative;
          width: 100px;
        }
        .tie-run-button:active {
          box-shadow: inset 0 1px 2px rgba(0,0,0.3);
          background-color: rgb(56, 123, 244);
          border: 1px solid rgb(42, 112, 232);
        }
      </style>
    `,
    controller: [
      '$scope', '$timeout', 'SolutionHandlerService', 'QuestionDataService',
      'LANGUAGE_PYTHON',
      function(
          $scope, $timeout, SolutionHandlerService, QuestionDataService,
          LANGUAGE_PYTHON) {
        var language = LANGUAGE_PYTHON;
        // TODO(sll): Generalize this to dynamically select a question set
        // based on user input.
        var questionSetId = 'strings';
        var NEXT_QUESTION_INTRO_PARAGRAPHS = ["Now, let's try a new question."];
        var CONGRATULATORY_FEEDBACK_PARAGRAPHS = [
          "Fantastic! You're done with this exercise. Shall we try the next one?",
          "Click the \"Next\" button below to move on to the next exercise."
        ];

        QuestionDataService.initCurrentQuestionSet(questionSetId);
        var questionSet = QuestionDataService.getCurrentQuestionSet(
          questionSetId);
        $scope.currentQuestionIndex = 0;

        var question = null;
        var prompts = null;
        var currentPromptIndex = null;
        var feedbackDiv = document.getElementById('tie-feedback');
        var instructionsDiv = document.getElementById('tie-instructions');

        var loadQuestion = function(questionId, introParagraphs) {
          question = QuestionDataService.getQuestion(questionId);
          prompts = question.getPrompts();
          currentPromptIndex = 0;
          $scope.title = question.getTitle();
          $scope.code = question.getStarterCode(language);
          $scope.instructions = prompts[currentPromptIndex].getInstructions();
          $scope.previousInstructions = [];
          $scope.nextButtonIsShown = false;
          $scope.feedbackParagraphs = introParagraphs;
        };

        var clearFeedback = function() {
          $scope.feedbackParagraphs = [];
        };

        var setFeedback = function(feedback) {
          if (feedback.isAnswerCorrect()) {
            $scope.nextButtonIsShown = true;
            $scope.feedbackParagraphs = CONGRATULATORY_FEEDBACK_PARAGRAPHS;
          } else {
            $scope.feedbackParagraphs = [feedback.getMessage()];
          }
          // Skulpt processing happens outside an Angular context, so
          // $scope.$apply() is needed to force a DOM update.
          $scope.$apply();
          feedbackDiv.lastElementChild.scrollIntoView();
        };

        $scope.codeMirrorOptions = {
          autofocus: true,
          lineNumbers: true,
          mode: LANGUAGE_PYTHON,
          smartIndent: false,
          tabSize: 4
        };

        $scope.showNextPrompt = function() {
          if (question.isLastPrompt(currentPromptIndex)) {
            $scope.currentQuestionIndex++;
            if ($scope.currentQuestionIndex >= $scope.questionIds.length) {
              // TODO(sll): This needs to be fleshed out.
              alert('Congratulations, you have finished!');
              return;
            }
            var questionId = $scope.questionIds[$scope.currentQuestionIndex];
            loadQuestion(questionId);
          } else {
            currentPromptIndex++;
            $scope.previousInstructions.push($scope.instructions);
            $scope.instructions = prompts[currentPromptIndex].getInstructions();
            $scope.nextButtonIsShown = false;
            // TODO (johnmunoz): DOM not yet updated; is there a better way
            // than using a timeout?
            $timeout(function() {
              instructionsDiv.lastElementChild.scrollIntoView();
            }, 0);
            clearFeedback();
          }
        };

        $scope.submitCode = function(code) {
          SolutionHandlerService.processSolutionAsync(
            prompts[currentPromptIndex], code,
            question.getAuxiliaryCode(language), language
          ).then(setFeedback);
        };

        $scope.questionIds = questionSet.getQuestionIds();
        loadQuestion(
          questionSet.getFirstQuestionId(),
          questionSet.getIntroductionParagraphs());
      }
    ]
  };
}]);
