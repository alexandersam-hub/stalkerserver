module.exports = class taskDto{
    id
    game
    type
    title
    text
    mark
    key
    wrongKey
    location
    price
    priceDraw
    priceModifier
    timeDuration
    countDuration
    choice
    isActive
    description
    constructor(model) {
        this.id = model.id?model.id.toString():''
        this.game = model.game?model.game:''
        this.type= model.type?model.type:''
        this.title= model.title?model.title:''
        this.text= model.text?model.text:''
        this.key = model.key?model.key:''
        this.wrongKey = model.wrongKey?model.wrongKey:''
        this.mark= model.mark?model.mark:''
        this.location= model.location?model.location:''
        this.price = model.price?model.price:0
        this.priceDraw = model.priceDraw?model.priceDraw:0
        this.priceModifier = model.priceModifier?model.priceModifier:0
        this.countDuration = model.countDuration?model.countDuration:0
        this.choice = model.choice?model.choice:''
        this.isActive= model.isActive?model.isActive:false
        this.description = model.description?model.description:''
    }
}

// 6220b1689bd70ea0c5d4d1cb
// 6220b1689bd70ea0c5d4d1cb