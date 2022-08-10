const  ControlGamesSocket = require ("./GamesSocketController");
const tokenService = require('../Services/ComponentServices/tokenService')
const { v1: userKey} = require('uuid')
const { WebSocketServer } = require('ws');

class SocketRouter{
    ws
    init(server){
        try{
            //this.ws = new WebSocketServer({server});
            console.log('start socketServer')
            this.ws = new WebSocketServer({server});

            this.ws.on('connection', (ws) =>{
                let user = null
                let token = ''
                let game = ''
                ws.on('message', async (message)=> {
                    const data = JSON.parse(message)
                    switch (data.action) {
                        case 'login':
                            token = data.token
                            user = tokenService.validationToken(data.token)
                            if (!user || !data ||!token )
                                return
                            if(data.game){
                                game = data.game
                            }else{
                                game = user.game
                                data.game = game
                            }
                            if (!token||!game||!user){
                                ws.send(JSON.stringify({warning:true, code:404, message:'Не заполнено поля token или game'}))
                            }
                            await ControlGamesSocket.connect(ws, data, user)
                            break

                        case 'start':
                            ControlGamesSocket.startGame(game)
                            break
                        case 'stop':
                            ControlGamesSocket.stopGame(game)
                            break
                        case 'refresh':
                            ControlGamesSocket.refreshGame(game)
                            break

                        case 'pullAnswer':
                            ControlGamesSocket.pullAnswer(ws,game, data, user)
                            break
                        case 'pullScore':
                            ControlGamesSocket.pullScore(game, data, user)
                            break
                        case 'pullChoice':
                            ControlGamesSocket.pullChoice(game, data, user)
                            break

                        case 'addEvent':
                            ControlGamesSocket.addEvent(game, data)
                            break
                        case 'delEvent':
                            ControlGamesSocket.delEvent(game, data)
                            break
                    }
                })

                ws.on('close', ()=> {
                    if(user)
                        ControlGamesSocket.disconnect(user, token, game)
                })
            })

        }catch (e) {
            console.log(e)
        }
    }
}

module.exports = new SocketRouter()