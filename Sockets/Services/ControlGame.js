const SendMessage = require('./SendMessage')
const DataCollection = require('./DataCollection')
const TeamProgressClass = require('./ProgressTeam')

class ControlGame{

    isStart
    isFinish
    currentRound
    game
    maps
    tasks
    additionalTasks
    teams
    collectionKeys
    progressTeams = {}
    timer = null
    time = 0
    playersWs = {}
    adminWs = {}
    managersWs = []
    roundTasks = []
    eventList = []
    isEvent = false
    isViewScore = false
    keyWords = []

    constructor() {
        this.isStart = false
        this.isFinish = false
        this.currentRound = 0
    }

//----------------управление игрой
    startGame(){

        if ( this.isStart)
            return
        this.time = 0
        this.isStart = true

        if (this.game.timeRound>0){
            this.startTimer(this.game.timeRound)
        }
        this.roundTasks=DataCollection.getTeamsTasksRound(this.teams,this.currentRound,this.maps,this.tasks)
        this._sendScoreAll()
        this._sendMessage(DataCollection.getGameData( this.playersWs, this), 'all')

        this._sendMessage( {action:'teamsMap', tasks:this.roundTasks}, 'admin')
        this._sendMessage( {action:'keyWords', words:this.keyWords}, 'admin')
        this._sendDispositionTeams()
    }
    stopGame(){
        this.isStart = false
        this.isViewScore = false
        clearTimeout(this.timer)
        this._sendMessage(DataCollection.getGameData( this.playersWs, this),'all')
    }
    refreshGame(){
        this.isStart = false
        this.isFinish = false
        this.currentRound = 0
        this.isEvent = false
        this.eventList.map(event=>event.done=false)
        this.teams.forEach(team=>{
            const taskMap = this.maps.find(map=>map.team === team.id)?this.maps.find(map=>map.team === team.id).tasks:[]
            const tasksList = []
            taskMap.forEach((tasks,i)=> {
                tasksList.push([])
                tasks.forEach(t=>{
                    tasksList[i].push(this.tasks.find(task=>task.id === t))
                })
            })
            this.progressTeams[team.id] = new TeamProgressClass(this.game.startResourceCounts, tasksList, this.game.typeGame, this.game.additionalResource, this.additionalTasks)
        })
        this._sendMessage(DataCollection.getGameData( this.playersWs, this), 'all')
    }

    finishGame(){
        this.isFinish = true
        clearInterval(this.timer)
        this._sendMessage(DataCollection.getGameData( this.playersWs, this), 'all')
    }

//----------------прием ответов
    pullAnswer(ws, data, user){
        if (!data || !data.answer){
            this._sendMessage({action:'report', warning:true, message:'Ключ не может быть пустым'}, 'one', ws)
            return;
        }

        if(data.task){
            switch (data.task.type) {
                case "additionalQuest":
                    this.progressTeams[user.id].pullAnswer(data.task, '', data.answer)
                    this.keyWords.push({word:data.answer, team:user.stringName, type:'additional', price:0})
                    break
                case 'agent':
                    if(this.collectionKeys.correctKey.find(key=>key.key === data.answer && key.mark === 'agent')){
                        if ( this.progressTeams[user.id].isUseAgentKey(data.answer)){
                            this._sendMessage({action:'reportAgent', warning:true, message:'Этот ключ уже вводился раннее'}, 'one', ws)
                        }else{
                            this.progressTeams[user.id].addScore(this.game.agentPrice)
                            this.progressTeams[user.id].pushAgentKey(data.answer)
                            this.keyWords.push({word:data.answer, team:user.stringName, type:'agent', price:data.task.price})
                            this._sendMessage({action:'reportAgent', warning:false, message:'Ответ принят.', price:this.game.agentPrice}, 'one', ws)
                            this._sendMessage({action:'score', score:this.progressTeams[user.id].getScore()},'one', ws)
                            this._sendMessage( {action:'keyWords', words:this.keyWords}, 'admin')
                            this._sendScoreAll()
                        }
                    }else
                        this._sendMessage({action:'reportAgent', warning:true, message:'Неверный ключ'}, 'one', ws)
                    break
                default:
                    if(this.collectionKeys.correctKey.find(key=>key.key === data.answer && key.mark === data.task.mark)){
                        this.progressTeams[user.id].pullAnswer(data.task, 'correct', data.answer)
                        this.keyWords.push({word:data.answer, team:user.stringName, type:'task', price:this.game.agentPrice})
                        this._sendMessage( {action:'keyWords', words:this.keyWords}, 'admin')
                        this.collectionKeys.correctKey = this.collectionKeys.correctKey.filter(word=>word.key!==data.answer)

                    }else if(this.collectionKeys.drawKey.find(key=>key.key === data.answer && key.mark === data.task.mark)){
                        this.progressTeams[user.id].pullAnswer(data.task, 'draw', data.answer)
                        this.collectionKeys.drawKey = this.collectionKeys.drawKey.filter(word=>word.key!==data.answer)

                    }else if(this.collectionKeys.incorrectKey.find(key=>key.key === data.answer && key.mark === data.task.mark)){
                        this.progressTeams[user.id].pullAnswer(data.task, 'incorrectKey', data.answer)
                        this.collectionKeys.incorrectKey = this.collectionKeys.incorrectKey.filter(word=>word.key!==data.answer)

                    }else{
                        // this.progressTeams[user.id].pullAnswer(data.task, 'none', data.answer)
                        this._sendMessage({action:'report', warning:true, message:'неверный ключ'}, 'one', ws)

                    }

            }
        }else{
            if(this.collectionKeys.correctKey.find(key=>key.key === data.answer && key.mark === 'agent')){
                if ( this.progressTeams[user.id].isUseAgentKey(data.answer)){
                    this._sendMessage({action:'reportAgent', warning:true, message:'Этот ключ уже вводился раннее'}, 'one', ws)
                }else{
                    this.progressTeams[user.id].addScore(this.game.agentPrice)
                    this.progressTeams[user.id].pushAgentKey(data.answer)
                    this.keyWords.push({word:data.answer, team:user.stringName, type:'agent', price:this.game.agentPrice})
                    this._sendMessage({action:'reportAgent', warning:false, message:'Ответ принят.', price:this.game.agentPrice}, 'one', ws)
                    this._sendMessage({action:'score', score:this.progressTeams[user.id].getScore()},'one', ws)
                    this._sendScoreAll()
                }
                return
            }
            const keyGame = this.collectionKeys.correctKey.find(key=>key.key === data.answer && key.mark !== 'agent')
            const drawKey = this.collectionKeys.incorrectKey.find(key=>key.key === data.answer)
            if(keyGame){
                this.progressTeams[user.id].addScore(keyGame.price)
                this.progressTeams[user.id].pushGameKey(data.answer)
                this.collectionKeys.correctKey = this.collectionKeys.correctKey.filter(word=>word.key!==data.answer)
                this.keyWords.push({word:data.answer, team:user.stringName, type:'task', price:keyGame.price})
                this._sendMessage({action:'reportAgent', warning:false, message:'Ответ принят.', price:this.game.agentPrice}, 'one', ws)
                this._sendMessage({action:'score', score:this.progressTeams[user.id].getScore()},'one', ws)
                this._sendScoreAll()
            }else if(drawKey){
                this.progressTeams[user.id].addScore(drawKey.price)
                this.progressTeams[user.id].pushGameKey(data.answer)
                this.collectionKeys.drawKey = this.collectionKeys.drawKey.filter(word=>word.key!==data.answer)
                this._sendMessage({action:'reportAgent', warning:false, message:'Ответ принят.', price:this.game.agentPrice}, 'one', ws)
                this._sendMessage({action:'score', score:this.progressTeams[user.id].getScore()},'one', ws)
                this._sendScoreAll()
            } else{
                this._sendMessage({action:'reportAgent', warning:true, message:'Неверный ключ или данный ключ уже был введен'}, 'one', ws)
            }
        }

        this._sendMessage({action:'disposition',isViewScore:this.isViewScore, tasks:this.progressTeams[user.id].getTasks()},'one', ws)

    }

    pullScore(data, user){

    }
    pullChoice(data, user){

    }
    buyAmmunition(ws, data, user){
        this.progressTeams[user.id].buyAmmunition(data.price)
        this._sendMessage({action:'reportAgentBuy', warning:false, message:'Покупка завершена.', price:this.game.agentPrice}, 'one', ws)
        this._sendMessage({action:'score', score:this.progressTeams[user.id].getScore()},'one', ws)
        this._sendScoreAll()
    }

//----------------игровые события
    addEvent(event){
        event.done = false
        this.eventList.push(event)
        this._sendMessage( {action:'event', events:this.eventList}, 'admin')
    }
    delEvent(id){
        this.eventList = this.eventList.filter((event,i)=>i !== id)
        this._sendMessage( {action:'event', events:this.eventList}, 'admin')
    }

    startEvent(event){
        this.isEvent = true
        clearInterval(this.timer)
        this.startTimer(event.time)
        for(let keyProgress in this.progressTeams){
            this.progressTeams[keyProgress].calculateScore()
            this.progressTeams[keyProgress].addScore(event.price)
            this.progressTeams[keyProgress].addEvent(event)
        }
        this._sendMessage(DataCollection.getGameData(this.playersWs, this), 'all')
        this._sendMessage( {action:'teamsMap', tasks:event}, 'admin')
        this._sendDispositionTeams()

    }

//----------------Отправка сообщения при подключении
    connectPlayer(ws, user){
        this._sendMessage({action:'getName', user},'one', ws)
        if (this.isViewScore){
            this._sendTimeViewScore(ws)
        }
        if (this.isStart && !this.isFinish) {
            this._sendMessage({action: 'disposition',isViewScore:this.isViewScore, tasks: this.progressTeams[user.id].getTasks()}, 'one', ws)
            this._sendMessage({action: 'score', score: this.progressTeams[user.id].getScore()}, 'one', ws)
            this._sendScoreAll(ws)
        }
    }

    connectManager(ws, user){
        this._sendMessage( {action:'teamsMap', tasks:this.isEvent?this.eventList.find(event=>!event.done && event.round === this.currentRound + 1):this.roundTasks}, 'manager')
        this._sendScoreAll(ws)
    }

    connectAdmin(){
        this._sendMessage( {action:'teamsMap', tasks:this.isEvent?this.eventList.find(event=>!event.done && event.round === this.currentRound + 1):this.roundTasks}, 'admin')
        this._sendMessage( {action:'event', events:this.eventList}, 'admin')
        this._sendMessage( {action:'keyWords', words:this.keyWords}, 'admin')
    }

//----------------Управление раундами игры
    startTimer(timeRound){
        if (this.timer)
            clearInterval(this.timer)
        this.time = timeRound
        this.timer = setInterval(()=>{
            this.time--
            if (this.time === 0){
                this.finishTime(timeRound)
            }
            this._sendMessage({action:'time', time:this.time}, 'all')
        },1000)
    }
    finishTime(timeRound){
        this.time = timeRound
        if(!this.isEvent){
            if (!this.isViewScore){
                this.isViewScore = true
                clearInterval(this.timer)
                for(let key in this.progressTeams){
                    this.progressTeams[key].nextRound(this.currentRound+1)
                }
                this.startTimer(this.game.timeViewScore)
                this._sendScoreAll()
                this._sendTimeViewScore()

            }else{
                this.isViewScore = false
                this.nextRound()
            }
        }
        else
            this.nextRound()
    }
    nextRound(){
        clearInterval(this.timer)
        if(this.isEvent){
            this.isEvent = false
            this.eventList.find(event=>!event.done && event.round === this.currentRound + 1).done = true
            for(let keyProgress in this.progressTeams){
                this.progressTeams[keyProgress].clearEvent()
            }
        }
        else {
            this.currentRound++
        }

        const event = this.eventList.find(event=>!event.done && event.round === this.currentRound + 1)
        if (event){
            this.startEvent(event)
            return
        }

        if (this.currentRound === this.game.countRound){
            this.finishGame()
            return
        }
        this.roundTasks = DataCollection.getTeamsTasksRound(this.teams,this.currentRound,this.maps,this.tasks)


        this.startTimer(this.game.timeRound)
        this._sendScoreAll()
        this._sendMessage(DataCollection.getGameData(this.playersWs, this), 'all')
        this._sendMessage( {action:'teamsMap', tasks:this.roundTasks}, 'admin')
        this._sendMessage( {action:'teamsMap', tasks:this.roundTasks}, 'manager')
        this._sendDispositionTeams()
      //  SendMessage.sendAdminDispositionTeam()

    }

//----------------отправка socket-сообщений
    _sendMessage(message, to='all', ws={}){
        switch (to) {
            case 'one':
                SendMessage.sendMessage(ws, message)
                break
            case "all":
                SendMessage.sendMessageAll(this.adminWs, this.playersWs, this.managersWs, message)
                break
            case 'admin':
                if (this.adminWs)
                    SendMessage.sendMessageAdmin(this.adminWs, message)
                break
            case 'players':
                SendMessage.sendMessagePlayers(this.playersWs, message)
                break
            case 'manager':
                SendMessage.sendMessageManagers(this.managersWs, message)
                break

        }
    }

    _sendScoreAll(ws=null){
        const scores = []
        if(this.teams)
            this.teams.forEach(team=>{
                scores.push({team:team.stringName, isBuy:this.progressTeams[team.id].isBuy, score: this.progressTeams[team.id].currentScore})
            })
        scores.sort((a,b)=>b.score-a.score)
        if (!ws) {
            for (let team in this.playersWs) {
                this._sendMessage({action: 'scoreTeams', scores: scores}, 'one', this.playersWs[team].ws)
            }
            this._sendMessage({action: 'scoreTeams', scores: scores}, 'admin')
            this._sendMessage({action: 'scoreTeams', scores: scores}, 'manager')
        }
        else{
            this._sendMessage({action:'scoreTeams', scores:scores},'one',ws)
        }
    }

    _sendTimeViewScore(ws=null){
        const scoresDifference = []
        this.teams.forEach(team=>{
            scoresDifference.push({score:this.progressTeams[team.id].getDifferenceScore(this.currentRound), team:team.stringName, teamId:team.id})
        })

        scoresDifference.sort((a,b)=>b.currentScore-a.currentScore)
        if (ws){
            this._sendMessage({action:'viewScore', scoresDifference},'one', ws)
        }
        else
        for(let team in this.playersWs){
            this._sendMessage({action:'viewScore', scoresDifference},'one', this.playersWs[team].ws)
        }
    }

    _sendDispositionTeams(){
        for(let team in this.playersWs){
            this._sendMessage({action:'disposition',isViewScore:this.isViewScore, tasks:this.progressTeams[this.playersWs[team].user.id].getTasks()},'one', this.playersWs[team].ws)
            this._sendMessage({action:'score', score:this.progressTeams[this.playersWs[team].user.id].getScore()},'one', this.playersWs[team].ws)
        }
    }

}

module.exports = ControlGame