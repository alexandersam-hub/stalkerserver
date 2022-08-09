const {Schema, model} = require('mongoose')

const TaskModel = new Schema({
    game:{type:String, required:true},
    type:{type:String, required:true},
    title:{type:String, required:true},
    text:{type:String, required:true},
    mark:{type:String}, // дополнительные пометки для заданий, например, что оно работет с фото
    location:{type:String},
    key:{type:String},// ответ для получения плюшек.
    wrongKey:{type:String},
    price:{type:Number},
    priceDraw:{type:Number},
    priceModifier:{type:Number},
    timeDuration:{type:[Number]},
    countDuration:{type:Number},
    choice:{type:[String]},
    isActive:{type:Boolean, required:true, default:true},
    isTimeUse:{type:Boolean, required:true, default:true},
    description:{type:String}
})

module.exports = model('Task', TaskModel)