const gameService = require('../Services/ComponentServices/GameService')
const ControlGame = require('./Services/ControlGame')
const mapService = require('../Services/ComponentServices/MapService')
const taskService = require('../Services/ComponentServices/TaskService')
const collectionKeysService = require('../Services/ComponentServices/CollectionKeysService')
const durationTaskService = require('../Services/ComponentServices/DurationTaskService')
const userService = require('../Services/ComponentServices/userService')
const SendMessage = require('./Services/SendMessage')
const DataCollection = require('./Services/DataCollection')
const TeamProgressClass = require('./Services/ProgressTeam')
class GameSocketService{

    gameId
    progress = new ControlGame()

    constructor(data){
        this.gameId = data.game
    }

//----------------упраление сокет-пользователями
    connectUser(ws,data,user){
        console.log(user)
        if(user)
        switch (user.role) {
            case 'player':
                    this.progress.playersWs[data.token] = {user:{...user, token:data.token}, ws}
                    this.progress.connectPlayer(ws,user)
                break
            case 'admin':
                this.progress.adminWs = ws
                this.progress.connectAdmin()
                break
            case 'manager':
                this.progress.managersWs.push({user, ws, token:data.token})
                SendMessage.sendMessage(ws, DataCollection.getManagerData(this.progress))
                this.progress.connectManager(ws,user)
                break
        }
        SendMessage.sendMessage(ws, DataCollection.getGameData(this.progress.playersWs, this.progress))
    }
    disconnect(user,token){
        console.log(user)
        if(user)
        switch (user.role) {
            case 'player':
                delete(this.progress.playersWs[token])
                break
            case 'admin':
                this.progress.adminWs = null
                break
            case 'manager':
                this.progress.managersWs =  this.progress.managersWs.filter(m=>m.token !== token)
                break
        }
    }

//----------------управление игрой
    startGame(){
        this.progress.startGame()
    }
    stopGame(){
        this.progress.stopGame()
    }
    async refreshGame(){
        await this.init()
        await this.progress.refreshGame()
    }

//----------------взаимодействия по счету
    pullAnswer(ws,data, user){
        this.progress.pullAnswer(ws,data, user)
    }
    pullScore(data, user){
        this.progress.pullScore(data, user)
    }
    pullChoice(data, user){
        this.progress.pullChoice(data, user)
    }

//----------------управление игровыми событиями
    addEvent(data){
        this.progress.addEvent(data.event)
    }
    delEvent(data){
        this.progress.delEvent(data.id)
    }

//----------------загрузка данных из бд
    async init(){
        this.progress.game = await this.loadGame()
        if(this.progress.timer){
            clearInterval(this.progress.timer)
            this.progress.timer = null
        }
        this.progress.maps = await this.loadMaps()
        this.progress.tasks = await this.loadTasks()
        this.progress.teams = await this.loadTeams()
        this.progress.additionalTasks = await this.loadDurationTask()
        this.progress.collectionKeys = await this.loadConnectionKeys()
        this.progress.teams.forEach(team=>{
            console.log('team', team.stringName)
                const taskMap = this.progress.maps.find(map=>map.team === team.id)?this.progress.maps.find(map=>map.team === team.id).tasks:[]
                const tasksList = []
                taskMap.forEach((tasks,i)=> {
                    tasksList.push([])
                    tasks.forEach(t=>{
                        tasksList[i].push(this.progress.tasks.find(task=>task.id === t))
                    })
                })

                this.progress.progressTeams[team.id] = new TeamProgressClass(this.progress.game.startResourceCounts, tasksList, this.progress.game.typeGame, this.progress.game.additionalResource, this.progress.additionalTasks)
        })

    }
    async loadGame(){
        const gameBd = await gameService.getGamesByGameId(this.gameId)
        if(gameBd.warning){
            if (this.progress.adminWs)
                 SendMessage.sendMessage(this.progress.adminWs, {warning:true, action:'ErrorReport', code:404, message:'Игра не найдена'})
            return null
        }
        return gameBd.game
    }
    async loadMaps(){
        const mapsBd = await mapService.getMapsByGameId(this.gameId)
        if(mapsBd.warning){
            if (this.progress.adminWs)
                SendMessage.sendMessage(this.progress.adminWs, {warning:true, action:'ErrorReport', code:404, message:'Не удалось загрузить карты команд'})
            return null
        }
        return mapsBd.maps
    }
    async loadTasks(){
        const tasksBd = await taskService.getTasksByGameId(this.gameId)
        if(tasksBd.warning){
            if (this.progress.adminWs)
                SendMessage.sendMessage(this.progress.adminWs, {warning:true,action:'ErrorReport', code:404, message:'Не удалось загрузить задания'})
            return null
        }
        return tasksBd.tasks
    }
    async loadTeams(){
        const teamsBd = await userService.getUsersByGameId(this.gameId)
        if(teamsBd.warning){
            if (this.progress.adminWs)
                SendMessage.sendMessage(this.progress.adminWs, {warning:true,action:'ErrorReport', code:404, message:'Не удалось загрузить команды'})
            return null
        }
        return teamsBd.users.filter(user=>user.role==='player')
    }
    async loadConnectionKeys(){
        const keysBd = await collectionKeysService.getCollectionKeyByGameId(this.gameId)
        if (keysBd.warning){
            if (this.progress.adminWs)
                SendMessage.sendMessage(this.progress.adminWs, {warning:true,action:'ErrorReport', code:404, message:'Не удалось загрузить ключи ответов'})
            return null
        }
        return keysBd.keys
    }
    async loadDurationTask(){
        const durationsBd = await durationTaskService.getDurationTasksByGameId(this.gameId)
        if (durationsBd.warning){
            if (this.progress.adminWs)
                SendMessage.sendMessage(this.progress.adminWs, {warning:true,action:'ErrorReport', code:404, message:'Не удалось загрузить дополнительные задания'})
            return null
        }
        return durationsBd.tasks
    }

}

module.exports = GameSocketService