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
 * @fileoverview Dispatcher service that performs pre-requisite checks on the
 * user's submitted code using the appropriate code evaluation engine.
 */

tie.factory('PrereqCheckDispatcherService', [
  'PythonPrereqCheckService', 'LANGUAGE_PYTHON',
  function(PythonPrereqCheckService, LANGUAGE_PYTHON) {
    /**
     * PrereqCheckDispatcherService calls the correct Prerequisite Check
     * service depending on the language that the user submits in.
     */

    return {
      /**
       * Calls the correct prereq check service for the language passed into
       * the function through the language parameter.
       *
       * @param {string} language
       * @param {string} starterCode
       * @param {string} code
       * @returns {PrereqCheckFailure}
       */
      // Returns a PrereqCheckFailure object (or null if there are no failures).
      checkCode: function(language, starterCode, code) {
        if (language === LANGUAGE_PYTHON) {
          return PythonPrereqCheckService.checkCode(starterCode, code);
        } else {
          throw Error('Language not supported: ' + language);
        }
      }
    };
  }
]);
