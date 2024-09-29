import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import { connectDB } from './lib/db.js'

import authRoutes from './routes/authRoute.js'
import userRoutes from './routes/userRoutes.js'
import postRoutes from './routes/postRoutes.js'
import notificationRoutes from './routes/notificationRoute.js'
import connectionRoutes from './routes/connectionRoute.js'
import path from 'path'


const app = express()
const PORT = process.env.PORT || 5000
const __dirname = path.resolve()

if(process.env.NODE_ENV !== 'production'){
    app.use(cors({
        origin: 'http://localhost:5173',
        credentials: true
    }))
}
app.use(express.json({limit: '5mb'}))
app.use(cookieParser())

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/posts', postRoutes)
app.use('/api/v1/notifications', notificationRoutes)
app.use('/api/v1/connections', connectionRoutes)

if(process.env.NODE_ENV === 'production'){
    app.use(express.static(__dirname, '/Frontend/dist'))

    app.get('*', (req, res)=>{
        res.sendFile(path.resolve(__dirname, 'Frontend', 'dist', 'index.html'))
    })
}

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`)
    connectDB()
})