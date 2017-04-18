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

/*
 * A service that saves student code to the browser's localStorage.
 */
tie.factory('CodeStorageService', [
  function() {
    var getLocalStorageHashKey = function(questionId, language) {
      return questionId + ":" + language;
    };

    return {
      storeCode: function(questionId, code, language) {
        var localStorageKey = getLocalStorageHashKey(
          questionId, language);
        localStorage.setItem(localStorageKey, code);
      },
      loadStoredCode: function(questionId, language) {
        var localStorageKey = getLocalStorageHashKey(
          questionId, language);
        var storedCode = localStorage.getItem(localStorageKey);
        return storedCode;
      },
      clearLocalStorageCode: function(questionId, language) {
        var localStorageKey = getLocalStorageHashKey(
          questionId, language);
        localStorage.removeItem(localStorageKey);
      }
    };
  }
]);

