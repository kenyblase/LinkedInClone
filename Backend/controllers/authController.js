import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/userModel.js'
import { sendWelcomeEmail } from '../lib/mailTrap/emails.js'

export const signup = async (req, res)=>{
    try {
        const {name, username, email, password} = req.body

        if(!name || !username || !password || !email){
            return res.status(400).json({message: 'Please Fill in All Fields'})
        }

        const existingEmail = await User.findOne({email})

        if(existingEmail){
            return res.status(400).json({message: 'Email Already Exists'})
        }

        const existingUsername = await User.findOne({username})

        if(existingUsername){
            return res.status(400).json({message: 'Username Already Taken'})
        }

        if(password.length < 6){
            return res.status(400).json({message: 'password must be at least 6 characters'})
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const user = new User({
            name,
            email,
            password: hashedPassword,
            username
        })

        await user.save()

        const token = jwt.sign({userId: user._id}, process.env.jWT_SECRET, {expiresIn:'3d'})

        res.cookie('jwt-LinkedIn', token, {
            httpOnly: true, 
            maxAge: 3 * 24 * 60 * 60 * 1000,
            sameSite:'strict',
            secure: process.env.NODE_ENV === 'production'
        })

        res.status(201).json({message: 'User Created Successfully'})

        const profileUrl = `${process.env.CLIENT_URL}/profile/${user.username}`

        try {
            await sendWelcomeEmail(user.email, user.name, profileUrl)
        } catch (error) {
            console.log('Error Sending Welcome Email:', error.message)
        }
    } catch (error) {
        console.log('Error in signup:', error.message)
        res.status(500).json({message: 'Internal Server Error'})
    }
}
export const login = async (req, res)=>{
    try {
        const {username, password} = req.body
        
        const user = await User.findOne({username})

        if(!user){
            return res.status(400).json({message: 'Invalid Credentials'})
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch){
            return res.status(400).json({
            message: 'Invalid password'
            })
        }

        const token = jwt.sign({userId: user._id,}, process.env.jWT_SECRET, {expiresIn: '3d'})

        await res.cookie('jwt-LinkedIn', token,{
            httpOnly: true,
            maxAge: 3 * 24 * 60 * 60 * 1000,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production'
        })
        res.status(200).json({
            message: 'Logged In Successfully'
        })
    } catch (error) {
        console.log('Error in Login Controller:', error.message)
        res.status(500).json({message: 'Internal Server Error'})
    }

}
export const logout = (req, res)=>{
    res.clearCookie('jwt-LinkedIn')
    res.json({
        message: 'Logged Out Successfully'
    })
}

export const getCurrentUser = async(req, res)=>{
    try {
        res.json(req.user)
    } catch (error) {
        console.log('Error in getCurrentUser:', error)
        res.status(500).json({message: 'Server Error'})
    }
}