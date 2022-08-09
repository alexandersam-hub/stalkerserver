
class SendMessage{

    sendMessage(ws, message={}){
        if (ws && ws.send)
                ws.send(JSON.stringify(message))

    }

    sendMessageAll(adminWs,playersWs, managersWs, message){
        // console.log('sendMessageAll')
        this.sendMessage(adminWs,message)
        for (let key in playersWs){
            this.sendMessage(playersWs[key].ws, message)
        }
        managersWs.forEach((manager)=>{
            this.sendMessage(manager.ws, message)
        })
    }

    sendMessageAdmin(adminWs, message){
        // console.log('sendMessageAdmin')
        this.sendMessage(adminWs,message)
    }

    sendMessagePlayers(playersWs, message){
        for (let key in playersWs){
            this.sendMessage(playersWs[key].ws, message)
        }
    }

    sendMessageManagers(managersWs, message){
        managersWs.forEach(manager=>{
            this.sendMessage(manager.ws, message)
        })
    }

}

module.exports = new SendMessage()