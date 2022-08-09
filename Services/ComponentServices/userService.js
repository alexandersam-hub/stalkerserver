const UserModel = require('../../Models/UserModel')
const bcrypt = require('bcrypt')
const tokenService = require('./tokenService')
const UserDto = require('../../Dtos/UserDto')
const ErrorService = require('../ErrorService')

class UserService{

    async registration(userData){
        try{
            const candidate = await UserModel.findOne({username: userData.username})
            if(candidate)
               return {warning:true, message:'Пользователь с таким именем уже существует'}
            userData.password = bcrypt.hashSync(userData.password, 7)
            delete (userData.id)
            //const activationLink = uuid.v4()

            const user = await UserModel.create({...userData})
            // await mailService.sendActivationMail(email, `${process.env.URL_SERVER}/api/activate/${activationLink}`) отправка подтверждения для пользователя на email
            const userDto = new UserDto(user)

            return { warning:false, user:userDto}
        }catch (e) {
            ErrorService.addLog(e.message, 'UserService.registration')
            return { warning:true, message:'Ошибка БД', error:e.message}
        }
    }

    async updateUser(user){
        try{
            if (!user.id)
                return {warning:true, message:'Нe заполнено поле id '}
            const id = user.id
            delete (user.id)
            if (user.password)
                delete (user.password)
            await UserModel.findByIdAndUpdate(id, {...user})
            const userBd = await UserModel.findById(id)
            return {warning:false, user:new UserDto(userBd)}
        }catch (e) {
            ErrorService.addLog(e.message, 'UserService.updateUser')
            return {warning:true, message:'Не удалось изменить пользователя. '+ e.message}
        }
    }

    async updateUserPassword(userId, password){
        try{
            const newPassword = bcrypt.hashSync(password, 7)
            await UserModel.findByIdAndUpdate(userId, {password:newPassword})
            return {warning:false}
        }catch (e) {
            ErrorService.addLog(e.message, 'UserService.updateUser')
            return {warning:true, message:'Не удалось изменить пользователя. '+ e.message}
        }
    }

    async login(username, password){
        try{
            const user = await UserModel.findOne({username})
            if(!user)
                return {warning:true, message:'Пользователь с таким именем не существует'}
            const isPassEquals = bcrypt.compareSync(password, user.password)
            if(!isPassEquals)
                return {warning:true, message:'Неверно указан пароль'}
            const userDto = new UserDto(user)
            const token = tokenService.generationToken({...userDto})
            await tokenService.tokenSave(userDto.id, token)
            return {
                warning:false,
                token,
                user:userDto,
                role:userDto.role
            }
        }catch (e) {
            ErrorService.addLog(e.message, 'UserService.login')
            return {warning:true, message:'Не удалось проверить правильность логина и пароля. '+ e.message}
        }

    }

    async getAllUsers(){
        try{
            const usersBd = await UserModel.find()
            const users = []
            usersBd.forEach(user=>users.push(new UserDto(user)))
            return {warning:false, users}
        }catch (e) {
            ErrorService.addLog(e.message, 'UserService.getAllUsers')
            return {warning:true, message:'Ошибка БД'}
        }

    }

    async getUsersByGameId(game_id){
        try{
            const usersBd = await UserModel.find({game:game_id})
            const users = []
            usersBd.forEach(user=>users.push(new UserDto(user)))
            return {warning:false, users}
        }catch (e) {
            ErrorService.addLog(e.message, 'UserService.getAllUsers')
            return {warning:true, message:'Ошибка БД'}
        }

    }

    async deleteUser(userId){
        try{
            await UserModel.findByIdAndDelete(userId)
            return {warning:false}
        }catch (e) {
            ErrorService.addLog(e.message, 'UserService.deleteUser')
            return {warning:true, message:'Ошибка БД'}
        }
    }

}

module.exports = new UserService()