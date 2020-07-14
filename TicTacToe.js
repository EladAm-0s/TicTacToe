/**
 * Game logic
 */
const BOARD_SIZE = 3;

const PLAYERS = {
    empty: 0,
    p1: 1,
    p2: 2
}

class CellCoordiantes {
    constructor(row, column) {
        this.row = row;
        this.column = column;
    }
}

class AiMove {
    constructor(rating, move) {
        this.rating = rating;
        this.move = move;
    }
}

class Logic {
    constructor(player1, player2) {
        this.isRunning = true;
        // A 2D array of BOARD_SIZE times BOARD_SIZE cells initialized to cellValues.empty
        this.board = new Array(BOARD_SIZE).fill(PLAYERS.empty).map(() => new Array(BOARD_SIZE).fill(PLAYERS.empty));
        this.player1 = player1;
        this.player2 = player2;
        this.currentPlayer = player1;
        this.winningCells = [];
        this.turnCompleteEvent;
        this.turnCounter = 0;
    }
    
    playTurn(row, column) {
        if (!this.isRunning || this.board[row][column] != PLAYERS.empty) return;

        this.board[row][column] = this.currentPlayer.id;
        this.turnCounter++;
        
        if (this._hasTurnWon(row, column) || this.turnCounter == (BOARD_SIZE * BOARD_SIZE)) {
            this.isRunning = false;
        }

        this.currentPlayer = this._getOpponent(this.currentPlayer);

        this.turnCompleteEvent(row, column);
        this.playAiTurn();
    }

    isWon() {
        return this.winningCells.length != 0;
    }

    playAiTurn() {
        setTimeout(() => {
            if (!this.isRunning || !this.currentPlayer.aiControlled) return;
            
            let optimalMove = this._getOptimalAiMove(this.board, this.currentPlayer).move;
            this.playTurn(optimalMove.row, optimalMove.column);
        }, 700);
    }

    _getOptimalAiMove(board, player, move) {
        if (move != undefined && this._hasTurnWon(move.row, move.column, board)) {
            return new AiMove(-1, move);
        }

        let bestMove;
        let bestScore = Number.MIN_SAFE_INTEGER;
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (board[i][j] != PLAYERS.empty) continue;
                let newMove = new CellCoordiantes(i, j);
                let newMoveBoard = this._cloneBoard(board);
                newMoveBoard[i][j] = player.id;

                let newMoveScore = - (this._getOptimalAiMove(newMoveBoard, this._getOpponent(player), newMove).rating);
                if (newMoveScore > bestScore) {
                    bestScore = newMoveScore;
                    bestMove = newMove;
                }
            }
        }

        if (bestMove == undefined) return new AiMove(0);
        return new AiMove(bestScore, bestMove);
    }

    _cloneBoard(board) {
        let result = [];

        board.forEach(r => {
            let row = [];
            r.forEach(c => {
                row.push(c);
            });
            result.push(row);
        });

        return result;
    }

    _getOpponent(player) {
        if (player == this.player1) return this.player2;
        return this.player1;
    }

    _hasTurnWon(row, column, board) {
        if (board == undefined) board = this.board;

        // row
        if (board[row].every(c => c == board[row][column])) {
            if (board == this.board)
                board[row].forEach((v, i) => this.winningCells.push(new CellCoordiantes(row, i)));
            return true;
        }

        // column
        if (board.every(r => r[column] == board[row][column])) {
            if (board == this.board)
                board.forEach((v, i) => this.winningCells.push(new CellCoordiantes(i, column)));
            return true;
        }

        // diagonal down
        if (row == column) {
            if (board.every((x, i) => board[0][0] == board[i][i])) {
                if (board == this.board)
                    board.forEach((v, i) => this.winningCells.push(new CellCoordiantes(i, i)));

                //for (let i = 0; i < BOARD_SIZE; i++) this.winningCells.push([i, i]);
                return true;
            }
        }

        if (row == BOARD_SIZE - 1 - column) {
           // if (board.every(x, i => board[0][BOARD_SIZE - 1] == board[i][BOARD_SIZE - 1 - i]))   
            let diagUpWin = true;
            for (let i = 1; i < BOARD_SIZE; i++) {
                if (board[i][BOARD_SIZE - 1 - i] != board[0][BOARD_SIZE - 1]) {
                    diagUpWin = false;
                    break;
                }
            }
            if (diagUpWin) {
                if (board == this.board)
                    for (let i = 0; i < BOARD_SIZE; i++) this.winningCells.push(new CellCoordiantes(i, BOARD_SIZE - 1 - i));
                return true;
            }
        }

        return false;
    }
}

class Player {
    constructor(id) {
        this.id = id;
        this.score = 0;
    }
}

class ViewControl {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.startButton = document.getElementById("start-btn");
        this.nextButton = document.getElementById("next-btn");
        this.resetButton = document.getElementById("reset-btn");

        this.player1 = new Player(PLAYERS.p1);
        this.player2 = new Player(PLAYERS.p2);
    }

    onCellClick(row, column) {
        if (!this.logic.currentPlayer.aiControlled)
            this.logic.playTurn(row, column);
    }

    onTurnComplete(row, column) {
        let l = this.logic;
        let cell = document.getElementById(ViewControl._getCellId(row, column));
        if (l.board[row][column] == PLAYERS.p1) {
            cell.innerHTML = "X";
            cell.classList.add("xo-p1");
        } else {
            cell.innerHTML = "O";
            cell.classList.add("xo-p2");
        }
        cell.classList.add("played");
        
        if (l.isWon()) {

            l.winningCells.forEach(c => {
                let winCell = document.getElementById(ViewControl._getCellId(c.row, c.column));
                winCell.classList.add("win-cell");
            });
            
            if (l.board[l.winningCells[0].row][l.winningCells[0].column] == PLAYERS.p1) {
                this.player1.score++;
            } else {
                this.player2.score++;
            }
            
            this._updateScore();
        }

        if (!l.isRunning) this.nextButton.disabled = false;
    }

    start() {
        this.player1.aiControlled = document.getElementById("p1-ai-controlled").checked;
        this.player2.aiControlled = document.getElementById("p2-ai-controlled").checked;
        
        this.player1.name = document.getElementById("p1-name").value;
        this.player2.name = document.getElementById("p2-name").value;
        
        document.getElementById("p1-score-header").innerHTML = this.player1.name;
        document.getElementById("p2-score-header").innerHTML = this.player2.name;

        this._updateScore();

        document.getElementById("players-form").classList.add("hidden");
        document.getElementById("players-score").classList.remove("hidden");

        this._createNewGame();

        this.startButton.disabled = true;
        this.resetButton.disabled = false;
    }

    next() {
        this.nextButton.disabled = true;
        this._createNewGame();
    }

    reset() {
        document.getElementById("players-form").classList.remove("hidden");
        document.getElementById("players-score").classList.add("hidden");
        this.container.innerHTML = "";
        this.player1.score = 0;
        this.player2.score = 0;
        this.startButton.disabled = false;
        this.resetButton.disabled = true;
    }

    _createNewGame() {
        this.logic = new Logic(this.player1, this.player2);
        this.logic.turnCompleteEvent = (row, column) => {
            this.onTurnComplete(row, column);
        };

        this._drawBoard();
        this._createClickEvents();

        if (this.logic.currentPlayer.aiControlled) this.logic.playAiTurn();
    }

    _updateScore() {
        document.getElementById("p1-score-value").innerHTML = this.player1.score;
        document.getElementById("p2-score-value").innerHTML = this.player2.score;
    }

    _drawBoard() {
        let tableHtml = '<table class="xo-table">';
    
        for(let i = 0; i < BOARD_SIZE; i++){
            tableHtml += "<tr>";
            
            for(let j = 0; j < BOARD_SIZE; j++){
                let cellId = ViewControl._getCellId(i, j);
                tableHtml += '<td id="' + cellId + '")></td>';
            }
    
            tableHtml += "</tr>"
        }
        
        tableHtml += "</table>"
        
        this.container.innerHTML = tableHtml;
    }

    _createClickEvents() {
        for(let i = 0; i < BOARD_SIZE; i++){
            for(let j = 0; j < BOARD_SIZE; j++){
                let cell = document.getElementById(ViewControl._getCellId(i, j));
                cell.onclick = (() => this.onCellClick(i, j));
            }
        }
    }

    static _getCellId(row, column) {
        return "xo-" + row + "." + column;
    }
}

let gameView = new ViewControl("xoview");

function startGame() {
    gameView.start();
}

function nextGame() {
    gameView.next();
}

function resetGame() {
    gameView.reset();
}