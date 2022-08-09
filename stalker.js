const express = require('express')
const mongoose = require('mongoose')
const https = require('https');
const cors = require('cors')
require('dotenv').config()
const fs = require('fs');

const GameRouter = require('./Routers/GameRouter')
const MapRouter = require('./Routers/MapRouter')
const TaskRouter = require('./Routers/TaskRouter')
const DurationTaskRouter = require('./Routers/DurationTaskRouter')
const UserRouter = require('./Routers/UserRouter')
const CollectionKeyRouter = require('./Routers/CollectionKeyRouter')

const InitSocket = require('./Sockets/SocketRouter')

const app = express()
app.use(express.static(__dirname+'/public'));
app.use(
    cors({
    })
);
app.use(express.json({ limit: "50mb" }))

app.use('/api/game',GameRouter )
app.use('/api/map',MapRouter )
app.use('/api/task',TaskRouter )
app.use('/api/duration_task',DurationTaskRouter )
app.use('/api/user',UserRouter )
app.use('/api/keys',CollectionKeyRouter )

const PORT = process.env.PORT || 8012
const PORT_HTTPS = process.env.PORT_HTPPS || 8501

const options = {
    cert: fs.readFileSync('./sslcert/fullchain.pem'),
    key: fs.readFileSync('./sslcert/privkey.pem')
};

const start = async ()=>{
    try {
        await mongoose.connect(process.env.DB_URL)
        const server = https.createServer(options, app);
        server.listen(PORT_HTTPS)
        InitSocket.init(server)
        app.listen(PORT,()=>{
            console.log(`start on port ${PORT}, ${PORT_HTTPS}`)
        })
    }
    catch (e) {
        console.log(e)
    }

}

start()
