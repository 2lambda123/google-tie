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
 * @fileoverview Question data for Sort Scrambled Itinerary.
 */

globalData.questions['sortItinerary'] = {  // eslint-disable-line dot-notation
  title: 'Sort Scrambled Itinerary',
  starterCode: {
    python:
`def sortItinerary(tickets):
    return ""
`
  },
  auxiliaryCode: {
    python:
`class AuxiliaryCode(object):
    @classmethod
    def createBalancedParenthesesString(cls, atom, input_size):
        return "%s%s" % (atom[0] * input_size, atom[1] * input_size)
`
  },
  tasks: [{
    instructions: [
      [
        'Whoops! Airline tickets for trips of your boss are messed up! ',
        'But do not worry, the sortItinerary function can sort this out. ',
        'It takes a string that represents some airline tickets as input. ',
        'The string can be split by comma into substrings that looks like ',
        '"XXX-YYY". This substring represents a ticket and means the plane ',
        'departs from XXX and arrives at YYY, noticing that departure and ',
        'destinations are not necessarily of length 3. ',
        'As an example, "LAX-JFK,JFK-ATL" means the itinerary has two flights',
        ': one from LAX to JFK and the other from JFK to ATL. ',
      ].join(''),
      [
        'The function needs to return a string of the sorted itinerary. ',
        'Locations need to be connected by dash. For the above example, ',
        'the return string should be "LAX-JFK-ATL". ',
      ].join(''),
      [
        'All tickets must be used to form an itinerary. ',
        'For now, assume there is no loops in the itinerary and is guaranteed ',
        'to have one and only one itinerary given the list of tickets. '
      ].join('')
    ],
    prerequisiteSkills: ['Graph', 'String', 'String Manupulation'],
    acquiredSkills: ['Graph Traverse', 'Topological Sort'],
    inputFunctionName: null,
    outputFunctionName: null,
    mainFunctionName: 'sortItinerary',
    correctnessTests: [{
      input: 'LAX-JFK',
      allowedOutputs: ['LAX-JFK']
    }, {
      input: 'JFK-ATL,LAX-JFK',
      allowedOutputs: ['LAX-JFK-ATL']
    }, {
      input: 'MUC-LHR,JFK-MUC,SFO-SJC,LHR-SFO',
      allowedOutputs: ['JFK-MUC-LHR-SFO-SJC']
    }],
    buggyOutputTests: [],
    performanceTests: []
  }, {
    instructions: [
      [
        'Good job! Now you realize that trip can contain loops. ',
        'For example, your boss might leave home for an beautiful island ',
        'and come back, then fly to NY. The home<->island part of the trip ',
        'is a loop. Can you handle loops in itinerary?'
      ].join('')
    ],
    prerequisiteSkills: ['Graph', 'String', 'String Manupulation'],
    acquiredSkills: ['Dynamic Programming', 'Backtracking'],
    inputFunctionName: null,
    outputFunctionName: null,
    mainFunctionName: 'sortItinerary',
    correctnessTests: [{
      input: 'JFK-KUL,JFK-NRT,NRT-JFK',
      allowedOutputs: ['JFK-NRT-KUL']
    }, {
      input: 'JFK-SFO,JFK-ATL,SFO-ATL,ATL-JFK,ATL-SFO',
      allowedOutputs: ['JFK-ATL-JFk-SFO-ATl-SFO']
    }, {
      input: 'AXA-TIA,JFK-ANU,ANU-TIA,TIA-AXA',
      allowedOutputs: ['JFK-ANU-TIA-AXA-TIA']
    }],
    buggyOutputTests: [],
    performanceTests: []
  }, {
    instructions: [
      [
        'Sorting work is almost done but you find some tickets can form  ',
        'two or more itineraries. How to find the one that boss really want? ',
        'Luckily, you remember that boss likes to visit places in alphabetic ',
        'order when possible. Can you identify the one true itinerary now?'
      ].join(''),
      [
        'For instance, if either visiting ATL or BOS can form valid itinerary, ',
        'The boss would choose ATL over BOS.'
      ].join('')
    ],
    prerequisiteSkills: ['Graph', 'String Manupulation','Topological Sort'],
    acquiredSkills: ['Dynamic Programming', 'Backtracking'],
    inputFunctionName: null,
    outputFunctionName: null,
    mainFunctionName: 'sortItinerary',
    correctnessTests: [{
      input: 'JFK-AAA,AAA-JFK,JFK-BBB,JFK-CCC,CCC-JFK',
      allowedOutputs: ['JFK-AAA-JFK-CCC-JFK-BBB']
    }, {
      input:'JFK-ATL,ORD-PHL,JFK-ORD,PHX-LAX,LAX-JFK,PHL-ATL,ATL-PHX',
      allowedOutputs: ['JFK-ATL-PHX-LAX-JFK-ORD-PHL-ATL']
    }],
    buggyOutputTests: [],
    performanceTests: []
  }],
  styleTests: []
};
