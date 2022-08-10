
class progressTeam {
    currentScore
    typeGame
    lastScore
    additionalScore = {}
    currentChoices
    gameKeys=[]
    logScore=[]
    countDuration = {}
    agentKeyUse = []
    mapTeam
    isAnswer = {}
    isAnswerAdditional = {}
    currentTasks
    countRoundPairDuration = {}
    additionalResource
    event = null
    additionalTasks = null
    additionalCountRound = 0

    constructor(startScore = 0, map, typeGame, additionalResource, additionalTasks) {
        this.currentScore = startScore
        this.lastScore = startScore
        this.additionalTasks = additionalTasks?additionalTasks:null
        this.logScore.push(this.currentScore)
        this.mapTeam = map
        this.currentTasks = map[0] ? map[0] : []
        this.currentTasks.map(task=>{
            switch (task.type) {
                case 'task':
                    break
                case 'pairTask':
                    this.countRoundPairDuration[task.id] = 1
                    task.currentDuration = 1
                    //console.log('currentDuration constructor', task.currentDuration)
                    break
            }
        })
        this.typeGame = typeGame
        additionalResource.forEach(resource=>
            this.additionalScore[resource.name] = resource.startCount
        )

    }

    nextRound(RoundNumber){
        if (this.typeGame !== 'stalker'){
            this.calculateScore()
            this.calculateAdditionalScore()
        }

        this.logScore.push(this.currentScore)
        this.currentTasks = this.mapTeam[RoundNumber] ? this.mapTeam[RoundNumber] : []
        this.currentTasks.map(task=>{
            if (task && task.type)
            switch (task.type) {
                case 'task':
                    break
                case 'pairTask':
                   if ( !this.countRoundPairDuration[task.id]){
                       this.countRoundPairDuration[task.id] = 1
                   }
                    else {
                       this.countRoundPairDuration[task.id] ++
                   }

                    task.currentDuration = this.countRoundPairDuration[task.id]
                    break
            }
        })
    }

//---------------PULL функции
    pullAnswer(task, isCorrect, answer){
        if (!task.type)
            return
        switch (task.type) {
            case 'additionalQuest':
                this.isAnswerAdditional[this.additionalCountRound].isAnswer = true
                this.isAnswerAdditional[this.additionalCountRound].answer = answer
                break
            case 'task':
                this.isAnswer[task.id] = isCorrect
                // switch (this.typeGame) {
                //     case 'king':
                //         return
                //     case 'stalker':
                //         return
                //     default:
                //         return null
                // }
                break
            case 'pairTask':
                this.isAnswer[task.id] = isCorrect
                break
        }
    }

    pullChoice(task, choice){

    }

//---------------Изменение счета
    addScore(score){
        this.currentScore += score
    }

    calculateAdditionalScore(){
        if(!this.additionalTasks)
            return false
        // console.log(this.isAnswerAdditional[this.additionalCountRound].answer)
        if(this.isAnswerAdditional[this.additionalCountRound] && this.isAnswerAdditional[this.additionalCountRound].isAnswer ){
            const answer = this.additionalTasks[this.additionalCountRound].changes[this.isAnswerAdditional[this.additionalCountRound].answer]

            if(answer){

                for(let i in answer.prices){

                    if (i === 'resource')
                        this.currentScore += answer.prices[i]
                    else
                        this.additionalScore[i] += answer.prices[i]

                }
            }
        }
        this.additionalCountRound+=1
        //else{
        //     const score = {}
        //     this.additionalTasks[this.additionalCountRound].changes.forEach(change=>{
        //         for(let i in change.prices){
        //             if (score[i]){
        //                 score[i].value += change.prices[i]
        //                 score[i].count ++
        //             }
        //             else {
        //                 score[i].value = change.prices[i]
        //                 score[i].count = 1
        //             }
        //         }
        //     })
        //
        //     for( let i in score){
        //         if (i === 'resource'){
        //             this.addit
        //         }
        //
        //     }
        // }
    }

    calculateScore(){
        let score = 0

        this.currentTasks.forEach(task=>{
            const isAnswer = this.isAnswer[task.id]
            switch (task.type) {
                case 'task':
                    if (isAnswer)
                        score+=task.price
                    else
                        score-=task.price
                    break
                case 'pairTask':
                    if(this.countRoundPairDuration[task.id] === task.countDuration){
                        if (isAnswer)
                            score+=task.price
                        else
                            score-=task.price
                        delete (this.countRoundPairDuration[task.id])
                    }
                    break
            }
        })
        this.currentScore += score
    }//


//----------------GET-функции
    getTasks(){
        if(this.event)
            return [{...this.event, type:'event'}]
        const tasks = []
        let isGetAdditional = false
        this.currentTasks.map(task=>{
            if (task && task.id)
            if (this.isAnswer[task.id]){
                if (this.additionalTasks && !isGetAdditional && (!this.isAnswerAdditional[this.additionalCountRound] || !this.isAnswerAdditional[this.additionalCountRound].isAnswer)){
                    if(!this.isAnswerAdditional[this.additionalCountRound])
                        this.isAnswerAdditional[this.additionalCountRound] = {visible:true, isAnswer:false, answer:null}
                    isGetAdditional = true
                    if(this.additionalTasks[this.additionalCountRound])
                        tasks.push(this.additionalTasks[this.additionalCountRound])
                }
            }
            else
            if (task && task.type)
            switch (task.type) {
                case 'pairTask':
                    tasks.push(task)

                    break
                default:
                    tasks.push(task)
            }
        })
        if (tasks.length>0){
            return tasks
        }
        else{
            return [{type:'waiting'}]
        }

    }

    getScore(){
        return {score:this.currentScore, additionalScore:this.additionalScore}
    }

    getCountResource(){
        return  {score:this.currentScore}
    }

//----------------Управление событиями
    addEvent(event){
        this.event = event
    }
    clearEvent(){
        this.event = null
    }

    isUseAgentKey(word){
        return !!this.agentKeyUse.find(key=>key===word)
    }

    pushAgentKey(word){
        this.agentKeyUse.push(word)
    }

    pushGameKey(word){
        this.gameKeys.push(word)
    }
    getDifferenceScore(roundNumber){

        return {currentScore:this.currentScore, difference:this.currentScore-this.logScore[roundNumber] }
    }
}


module.exports = progressTeam