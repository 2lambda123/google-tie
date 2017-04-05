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
 * @fileoverview Question data for Bomber man.
 */

globalData.questions['bomberman'] = {  // eslint-disable-line dot-notation
  title: 'Bomberman',
  starterCode: {
    python:
`def bomb(board):
    return 0
`
  },
  auxiliaryCode: {
    python:
`class AuxiliaryCode(object):
    @classmethod
    def negative(cls, board):
        return -1
    @classmethod
    def ignoreWalls(cls, board):
        if len(board) == 0 or len(board[0]) == 0: return 0
        rows = len(board)
        cols = len(board[0])
        maxEnemy = 0
        up = [0 for x in range(cols)]
        left = 0
        memo = [[0 for x in range(cols)] for y in range(rows)]
        for r in range(rows):
            left = 0
            for c in range(cols):
                if board[r][c] == "e":
                    left += 1
                    up[c] += 1
                else:
                    memo[r][c] += left + up[c]
        right = 0
        down = [0 for x in range(cols)]
        for r in range(rows - 1, -1, -1):
            right = 0
            for c in range(cols - 1, -1, -1):
                if board[r][c] == "e":
                    right += 1
                    down[c] += 1
                else:
                    memo[r][c] += right + down[c]
                    if memo[r][c] > maxEnemy:
                        maxEnemy = memo[r][c]
        return maxEnemy
    @classmethod
    def bombAllEnemiesOnBoard(cls, board):
        if (len(board) == 0 or len(board[0]) == 0): return 0
        count = 0
        for r in range(len(board)):
            for c in range(len(board[0])):
                if board[r][c] == "e":
                    count += 1
        return count
    @classmethod
    def correctOutput(cls, board):
        if (len(board) == 0 or len(board[0]) == 0): return 0
        rows = len(board)
        cols = len(board[0])
        maxEnemy = 0
        up = [0 for x in range(cols)]
        left = 0
        memo = [[0 for x in range(cols)] for y in range(rows)]
        for r in range(rows):
            left = 0
            for c in range(cols):
                if board[r][c] == "x":
                    left = 0
                    up[c] = 0
                elif board[r][c] == "e":
                    left += 1
                    up[c] += 1
                else:
                    memo[r][c] += left + up[c]
        right = 0
        down = [0 for x in range(cols)]
        for r in range(rows - 1, -1, -1):
            right = 0
            for c in range(cols - 1, -1, -1):
                if board[r][c] == "x":
                    right = 0
                    down[c] = 0
                elif board[r][c] == "e":
                    right += 1
                    down[c] += 1
                else:
                    memo[r][c] += right + down[c]
                    if memo[r][c] > maxEnemy:
                        maxEnemy = memo[r][c]
        return maxEnemy
`
  },
  tasks: [{
    instructions: [
      [
        'For this question, you will be given a borad, in which all elements are string. ',
        'X represent a wall, e represent an enemy, "" represent an empty cell. ',
        'You can place an bomb in an empty cell, which will kill enemies in vertical and horizontal ',
        'direction until it met a wall. ',
        'Please write a function bomb(board), to find the best position to place a bomb in order to',
        'kill as many enemies as possible, then return the number of enemies killed.'
      ].join('')
    ],
    prerequisiteSkills: ['Arrays', 'Strings', 'String Manipulation'],
    acquiredSkills: ['String Manipulation'],
    inputFunctionName: null,
    outputFunctionName: null,
    mainFunctionName: 'bomb',
    correctnessTests: [
      {
        input: [],
        allowedOutputs: [0]
      },
      {
        input: [[],[],[]],
        allowedOutputs: [0]
      },   
      {
        input: [["e", "", "e", "x", "", "e"]],
        allowedOutputs: [2]
      },
      {
        input: [["e", "", "e", "", "", "e"]],
        allowedOutputs: [3]
      },
      {
        input: [["e"], ["x"], [""], ["x"]],
        allowedOutputs: [0]
      },
      {
        input: [["e"], ["e"], [""], ["x"]],
        allowedOutputs: [2]
      },
      {
        input: [["", "e", ""], ["e", "", "e"], ["", "e", ""]],
        allowedOutputs: [4]
      }
    ],
    buggyOutputTests: [{
      buggyFunctionName: 'AuxiliaryCode.ignoreWalls',
      messages: [[
        "You cannot kill an enemy behind a wall x. ",
        "Stop your fire once it meets a wall."
      ].join('')
      ]
    },
    {
      buggyFunctionName: 'AuxiliaryCode.bombAllEnemiesOnBoard',
      messages: [[
        "You cannot simply kill all enemies on the board. ",
        "Your bomb can only kill enemies in the same row and column. ",
        "Stop your fire once it meets a wall."
      ].join('')
      ]
    },
    {
      buggyFunctionName: 'AuxiliaryCode.negative',
      messages: [[
        "Don't just return -1, do something"
      ].join('')
      ]
    }],
    performanceTests: []
  }],
  styleTests: []
};
