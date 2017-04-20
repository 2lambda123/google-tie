// Copyright 2017 The TIE Author, s. All Rights Reserved.
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
 * @fileoverview Question data for Unknown Alphabet.
 */

globalData.questions['unknownAlphabet'] = {  // eslint-disable-line dot-notation
  title: 'Unknown Alphabet',
  starterCode: {
    python:
`def findAlphabet(words):
    return ""`
  },
  auxiliaryCode: {
    python:
`class AuxiliaryCode(object):
  @classmethod
  def failsOnNoSolution(cls, words):
    """
      Dictionary 'edges' stores the pairs of characters which the second one has 
      the higher rank than the first one. These pairs can be represented as 
      graph's edges. 'edges[ch]' is a list of letters which have higher rank than 
      ch's rank. Dictionary 'degree' stores the in-degree in the graph of each letter.
      For each letter 'ch', there're 'degree[ch]' letters goes to ch.
    """
    edges = {}
    degree = {}
    for word in words:
      for ch in word:
        ch = ch.lower()
        if(not edges.has_key(ch)):
          edges[ch] = []
          degree[ch] = 0
    for wordIndex in range(len(words) - 1):
      for letterIndex in range(min(len(words[wordIndex]), len(words[wordIndex + 1]))):
        letterOne = words[wordIndex][letterIndex].lower()
        letterTwo = words[wordIndex + 1][letterIndex].lower()
        if(letterOne != letterTwo):
          edges[letterOne].append(letterTwo)
          degree[letterTwo] = degree[letterTwo] + 1
          break
    answer  = ""
    hasZeroDegreeLetter = True
    while hasZeroDegreeLetter:
      hasZeroDegreeLetter = False
      for key in degree:
        if degree[key] == 0:
          hasZeroDegreeLetter = True
          answer = answer + key
          for nextLetter in edges[key]:
            degree[nextLetter] = degree[nextLetter] - 1
          del degree[key]
      if not hasZeroDegreeLetter:
        break
    return answer
    
    
  @classmethod
  def failsOnUppercase(cls, words):
    edges = {}
    degree = {}
    for word in words:
      for ch in word:
        if(not edges.has_key(ch)):
          edges[ch] = []
          degree[ch] = 0
    for wordIndex in range(len(words) - 1):
      for letterIndex in range(min(len(words[wordIndex]), len(words[wordIndex + 1]))):
        letterOne = words[wordIndex][letterIndex]
        letterTwo = words[wordIndex + 1][letterIndex]
        if letterOne != letterTwo:
          edges[letterOne].append(letterTwo)
          degree[letterTwo] = degree[letterTwo] + 1
          break
    answer  = ""
    hasZeroDegreeLetter = True
    while hasZeroDegreeLetter:
      hasZeroDegreeLetter = False
      for key in degree:
        if degree[key] == 0:
          hasZeroDegreeLetter = True
          answer = answer + key
          for nextLetter in edges[key]:
            degree[nextLetter] = degree[nextLetter] - 1
          del degree[key]
      if not hasZeroDegreeLetter:
        break
    if degree:
      return ""
    return answer
`

  },
  tasks: [{
    instructions: [
      [
        'Given a dictionary (a list of words in lexicographic order) of all',
        'words in an unknown or invented language, write a function findAlphabet ',
        'that returns the alphabet (an ordered list of characters sorted by ',
        'lexicographic) of that language.'
      ].join(''),
      'You may suppose there\'s one and only one solution to this problem.',
      'Example dictionary:',
      '[art, rat, cat, car]',
      'Alphabet is: "atrc"'
    ],
    prerequisiteSkills: ['Topological Sorting', 'String Manipulation'],
    acquiredSkills: ['String Manipulation'],
    inputFunctionName: null,
    outputFunctionName: null,
    mainFunctionName: 'findAlphabet',
    correctnessTests: [{
      input: [
        "a",
        "ab",
        "b"
      ],
      allowedOutputs: ['ab']
    }, {
      input: [
        "aaec",
        "aaed",
        "aac",
        "abe",
        "abc",
        "bed",
        "bea",
        "bcc",
        "bcd"
      ],
      allowedOutputs: ['ecdab']
    }, {
      input: [
        "egdi",
        "egdb",
        "egej",
        "egei",
        "ebjj",
        "ebjg",
        "ebgh",
        "ebgj",
        "igac",
        "igae",
        "igia",
        "igif",
        "idcf",
        "idcc",
        "idh"
      ],
      allowedOutputs: ['afchjgdeib']
    },
    {
      input: [
        "curwfe",
        "curwfe",
        "curwst",
        "curwsw",
        "curuyc",
        "curuyf",
        "curuga",
        "curugs",
        "cuxdeh",
        "cuxdeu",
        "cuxdbv",
        "cuxdbn",
        "cuxolc",
        "cuxolb",
        "cuxojd",
        "cuxojs",
        "cpcnow",
        "cpcnob",
        "cpcnqu",
        "cpcnqp",
        "cpctkj",
        "cpctkd",
        "cpctfg",
        "cpctfa",
        "cpbjeq",
        "cpbjec",
        "cpbjz",
        "cpbhx",
        "cpbhc",
        "khjzs",
        "khjzu",
        "khjis",
        "khjiv",
        "khfax",
        "khfay",
        "khftg",
        "khftq",
        "kmima",
        "kmimd",
        "kmiej",
        "kmies",
        "kmrbm",
        "kmrbr",
        "kmrus",
        "kmrut"
      ],
      allowedOutputs: ['ljhmezirxygadoqckfsvntwbup']
    }],
    buggyOutputTests: [],
    performanceTests: []
  }, {
    instructions: [
      [
        'Next, double-check your code to make sure it handles unexpected cases',
        ', such as a test case with no solution or a test case with more than ',
        'one correct answer.'
      ].join(''),
      [
        'For the test case that has no solution, just return "". If multiple ',
        'letters have the same frequency, return them in alphabetical order.'
      ].join(''),
      'Example dictionary:',
      '[a, b, a]',
      'Alphabet is: ""',
      '[cba]',
      'Alphabet is: "abc"'
    ],
    prerequisiteSkills: ['Topological Sorting', 'String Manipulation'],
    acquiredSkills: ['String Manipulation'],
    inputFunctionName: null,
    outputFunctionName: null,
    mainFunctionName: 'findAlphabet',
    correctnessTests: [{
      input: [
        "a",
        "b",
        "a"
      ],
      allowedOutputs: ['']
    }, {
      input: [
        "c",
        "a",
        "b",
        "a"
      ],
      allowedOutputs: ['']
    }, {
      input: [
        "cab",
        "bc"
      ],
      allowedOutputs: ['acb']
    }],
    buggyOutputTests: [{
      buggyFunctionName: 'AuxiliaryCode.failsOnNoSolution',
      messages: [
        [
          'Try running your function on ["c", "a", "b", "a"] on paper. ',
          'Is your result what you expect?'
        ].join(''),
        [
          'For the case ["c", "a", "b", "a"] your code returns "c", even though ',
          '"a" appears both before and after "b". It should return no solution.'
        ].join('')
      ]
    }],
    performanceTests: []
  }, {
    instructions: [
      [
        'Finally, modify your code to handle strings with a mix of lowercase ',
        'and uppercase letters. Assume that a lowercase and uppercase version ',
        'of a letter is the same with regards to lexicographic ordering. Your ',
        'answer, though, should be lowercase.'
      ].join(''),
      'Example dictionary:',
      '[b, Ba]',
      'Alphabet is: "ab"'
    ],
    prerequisiteSkills: ['Topological Sorting', 'String Manipulation'],
    acquiredSkills: ['String Manipulation'],
    inputFunctionName: null,
    outputFunctionName: null,
    mainFunctionName: 'findAlphabet',
    correctnessTests: [{
      input: [
        "ab",
        "Aba",
        "b"
      ],
      allowedOutputs: ['ab']
    }],
    buggyOutputTests: [{
      buggyFunctionName: 'AuxiliaryCode.failsOnUppercase',
      messages: [
        [
          'Try running your code over ["a", "Ab", "b"]. Do you get the result ',
          'you expected?'
        ].join(''),
        'How does your code handle uppercase letters?',
        [
          'The answer to the test case ["a", "Ab", "b"] should be "ab". It ',
          'looks like you returned a string with some uppercase letters.'
        ].join('')
      ]
    }],
    // TODO: Time complexity is O(m), which is non-linear. Fix in the future.
    performanceTests: []
  }],
  styleTests: [{
    evaluationFunctionName: 'allowOnlyOneFunction',
    expectedOutput: true,
    message: [
      'You should only be writing code in an findAlphabet function. While ',
      "decomposition is generally a good idea, you shouldn't need more than ",
      'just this function for this question.'
    ].join('')
  }]
};
