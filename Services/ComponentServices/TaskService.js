const TaskModel = require('../../Models/TaskModel')
const TaskDto = require('../../Dtos/taskDto')
const ErrorService = require('../ErrorService')

class TaskService{
    async getTasks(){
        try{
            const tasksBd = await TaskModel.find()
            const tasks = []
            tasksBd.forEach(task=>tasks.push(new TaskDto(task)))
            return {warning:false, tasks}
        }catch (e) {
            ErrorService.addLog(e.message, 'TaskService.getTasks')
            return {warning:true, message:'Не удалось выгрузить задания. '+ e.message}
        }
    }

    async getTasksByGameId(gameId){
        try{
            const tasksBd = await TaskModel.find({game:gameId})
            const tasks = []
            tasksBd.forEach(task=>tasks.push(new TaskDto(task)))
            return {warning:false, tasks}
        }catch (e) {
            ErrorService.addLog(e.message, 'TaskService.getTasks')
            return {warning:true, message:'Не удалось выгрузить задания. '+ e.message}
        }
    }

    async createTask(task){
        try{
            if (task.id)
                delete(task.id)
            const taskBd = await TaskModel.create({...task})
            return {warning:false, task:new TaskDto(taskBd)}
        }catch (e) {
            ErrorService.addLog(e.message, 'TaskService.createTask')
            return {warning:true, message:'Не удалось создать задание. '+ e.message}
        }
    }

    async updateTask(task){
        try{
            if (!task.id)
                return {warning:true, message:'Нe заполнено поле id.'}
            const id = task.id
            delete(task.id)
            await TaskModel.findByIdAndUpdate(id,{...task})
            const updatedTask = await TaskModel.findById(id)
            return {warning:false, task:new TaskDto(updatedTask)}
        }catch (e) {
            ErrorService.addLog(e.message, 'TaskService.updateTask')
            return {warning:true, message:'Не удалось изменить задание. '+ e.message}
        }
    }

    async deleteTask(taskId){
        try{
            await TaskModel.findByIdAndDelete(taskId)
            return {warning:false}
        }catch (e) {
            ErrorService.addLog(e.message, 'TaskService.deleteGame')
            return {warning:true, message:'Не удалось удалить задание. '+ e.message}
        }
    }
}

module.exports = new TaskService()