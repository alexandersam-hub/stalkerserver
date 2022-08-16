const GameSocketClass = require('./GameSocketService')

class GamesSocketController{

    games = {}

    constructor() {
        //прописать логику вывода из бекапа

    }
    async connect(ws, data, user){
        if(!this.games[data.game]) {
            this.games[data.game] = new GameSocketClass(data)
            await this.games[data.game].init()
        }
        this.games[data.game].connectUser(ws,data,user)
    }

    disconnect(user, token, game){
        this.games[game].disconnect(user,token)
    }

    startGame(game){
        this.games[game].startGame()
    }
    stopGame(game){
        this.games[game].stopGame()
    }
    refreshGame(game){
        this.games[game].refreshGame()
    }


    pullAnswer(ws, game, data, user){
        // console.log(data)
        this.games[game].pullAnswer(ws,data, user)
    }
    pullScore(game, data, user){
        this.games[game].pullScore()
    }
    pullChoice(game, data, user){
        this.games[game].pullChoice(data, user)
    }

    addEvent(game, data){
        this.games[game].addEvent(data)
    }
    delEvent(game, data){
        this.games[game].delEvent(data)
    }

    buyAmmunition(ws, game, data, user){
        this.games[game].buyAmmunition(ws, data,user)
    }
}

module.exports = new GamesSocketController()