import connectionRequest from '../models/connectionRequestModel.js'
import User from '../models/userModel.js'
import notification from '../models/notificationModel.js'
import {sendConnectionAcceptedEmail} from '../lib/mailTrap/emails.js'

export const sendConnectionRequest = async(req, res)=>{
    try {
        const {userId} = req.params
        const senderId = req.user._id

        if(senderId.toString() === userId.toString()){
            res.status(400).json({message: 'You cannot send a request to Yourself'})
        }

        if(req.user.connections.includes(userId)){
            return res.status(400).json({message: 'You are already connected'})
        }

        const existingRequest = await connectionRequest.findOne({
            sender: senderId,
            recipient: userId,
            status: 'pending',
        })

        if(existingRequest){
            return res.status(400).json({message: 'A connection request already exists'})
        }

        const newRequest = new connectionRequest({
            sender: senderId,
            recipient: userId
        })

        await newRequest.save()

        res.status(201).json({message: 'Connection Request Sent Successfully'})
    } catch (error) {
        console.log('Error in sendConnectionRequest controller:', error.message)
        res.status(500).json({message: 'Server Error'})
    }
}

export const acceptConnectionRequest = async(req, res)=>{
    try {
        const {requestId} = req.params
        const userId = req.user._id

        const request = await connectionRequest.findById(requestId)
        .populate('sender', 'name, username')
        .populate('recipient', 'name username')

        if(!request){
            return res.status(404).json({message: 'Connection Request Not Found'})
        }

        if(request.recipient._id.toString() !== userId.toString()){
            return res.status(403).json({message: 'Not Authorized to Accept This Request'})
        }

        if(request.status !== 'pending'){
            return res.status(400).json({message: 'Request has already been processed'})
        }

        request.status = 'accepted'
        await request.save()

        await User.findByIdAndUpdate(request.sender._id, {$addToSet: {connections: userId}})
        await User.findByIdAndUpdate(userId, {$addToSet: {connections: request.sender._id}})

        const Notification = new notification({
            recipient: request.sender._id,
            type: 'connectionAccepted',
            relatedUser: userId
        })

        await Notification.save()

        res.json({message: 'connection accepted sucessfully'})

        const senderEmail = request.sender.email
        const senderName = request.sender.name
        const recipientName = request.recipient.name
        const profileUrl = `${process.env.CLIENT_URL}/profile/${request.recipient.username}`
        
        try {
            sendConnectionAcceptedEmail(senderEmail, senderName, recipientName, profileUrl)
            
        } catch (error) {
            console.log('Error in sending Connection Accepted Email:', error.message)
        }
    } catch (error) {
        console.log('Error in acceptConnectionRequest:', error.message)
        res.status(500).json({message: 'Internal server error'})
    }
}

export const rejectConnectionRequest = async(req, res)=>{
    try {
        const {requestId} = req.params
        const userId = req.user._id
    
        const request = await connectionRequest.findById(requestId)
    
        if(request.recipient._id.toString() !== userId.toString()){
            return res.status(403).json({message: 'Not Authorized to reject this request'})
        }
    
        if(request.status !== pending){
            return res.status(400).json({message: 'This Request Has Already Been Processed'})
        }
    
        request.status = 'rejected'
        await request.save()
    
        res.json({message: 'Connection request Rejected'})
        
    } catch (error) {
        console.log('Error in rejectConnectionRequest controller:', error.message)
        res.status(500).json({message:'Server Error'})
    }
}

export const getConnectionRequests = async(req, res)=>{
    try {
        const userId = req.user._id

        const requests = await connectionRequest.find({recipient: userId, status: 'pending'})
        .populate('sender', 'name username profilePicture headline connections')

        if(!requests){
            return res.json({message:'No connection Request Found'})
        }
        res.json(requests)
    } catch (error) {
        res.status(500).json({message: 'Server Error'})
    }
}

export const getUserConnections = async(req, res)=>{
    try {
        const userId = req.user._id

        const user = await User.findById(userId)
        .populate('connections', 'name username profilePicture headline connections')

        res.json(user.connections)
    } catch (error) {
        console.log('Error in getUserConnections controller:', error.message)
        res.status(500).json({message: 'Server Error'})
    }
}

export const removeConnection = async(req, res)=>{
    try {
        const myid = req.user._id
        const {userId} = req.params

        await User.findByIdAndUpdate(myid, {$pull: {connections: userId}})
        await User.findByIdAndUpdate(userId, {$pull: {connections: myid}})

        res.json({message:'connections removed sucessfully'})
    } catch (error) {
        console.log('Error in removeConnection controller:', error.message)
        res.status(500).json({message: 'server error'})
    }
}

export const getConnectionStatus = async(req, res)=>{
    try {
        const targetUserId = req.params.userId
        const currentUserId = req.user._id

        const currentUser = req.user

        if(currentUser.connections.includes(targetUserId)){
            return res.json({status: 'connected'})
        }

        const pendingRequest = await connectionRequest.findOne({
            $or:[
                {sender: currentUserId, recipient:targetUserId},
                {sender: targetUserId, recipient: currentUserId},
            ],
            status: 'pending'
        })

        if(pendingRequest){
            if(pendingRequest.sender.toString() === currentUserId.toString()){
                return res.json({status: 'pending'})
            }else{
                return res.json({status: 'received',  requestId: pendingRequest._id})
            }
        }
        res.json({status: 'not_connected'})
    } catch (error) {
        console.log('Error in getConnectionStatus controller:', error.message)
        res.status(500).json({message: 'Server Error'})
    }
}