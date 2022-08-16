
class DataCollection{

    constructor(){

    }

    // getDispositionTeams(teams, currentRound, maps, tasks){
    //     const usersMap = []
    //     for(let team of teams){
    //         usersMap.push({
    //             team,
    //             tasks:this.getDispositionTeamByTeamId(team.id,currentRound,maps, tasks)
    //         })
    //
    //     }
    //    return {action:'teamsMap', tasks:usersMap}
    // }

    getDispositionTeamByTeamId(teamId, currentRound, maps, tasks){

        const teamMap = maps.find(m=>m.team === teamId)
        const teamTasks = []
        if (!teamMap || !teamMap.tasks[currentRound])
            return []
        teamMap.tasks[currentRound].forEach(t=>{
            teamTasks.push(tasks.find(task=>task.id === t))
        })

        return teamTasks
    }

    getGameData(playersWs, progress){

        return {
            action:'gameData',
            isStart:progress.isStart,
            isFinish:progress.isFinish,
            isEvent:progress.isEvent,
            isViewScore:progress.isViewScore,
            currentRound:progress.currentRound,
            score:progress.score,
            time:progress.time,
            game:progress.game,

        }
    }
    getManagerData(progress){
        return {
            action:'managerData',
            tasks:progress.tasks,
            maps:progress.maps,
            teams:progress.teams,
        }
    }

    getTeamsTasksRound(teams,currentRound, maps,tasks){
       const teamsTasksRound = []

       teams.forEach(team=>{
           if (team.role === 'player')
           teamsTasksRound.push({team, tasks:this.getDispositionTeamByTeamId(team.id, currentRound, maps, tasks)})
       })
        return teamsTasksRound
    }
}

module.exports = new DataCollection