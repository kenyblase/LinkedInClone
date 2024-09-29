import notification from "../models/notificationModel.js"

export const getUserNotifications = async(req, res)=>{
    try {
        const notifications = await notification.find({recipient: req.user._id})
        .sort({createdAt: -1})
        .populate('relatedUser', 'name username profilePicture')
        .populate('relatedPost', 'content image')

        res.status(200).json(notifications)
    } catch (error) {
        console.log('Error in getUserNotifications Controller:', error)
        res.status(500).json({message: 'Server Error'})
    }   
}

export const markNotificationAsRead = async(req, res)=>{
    const notificationId = req.params.id
    try {
        const notifications = await notification.findByIdAndUpdate(
            {_id: notificationId, recipient: req.user._id},
            {read: true},
            {new: true}
        )

        res.status(200).json(notifications)
    } catch (error) {
        console.log('Error in markNotificationAsRead controller:', error.message)
        res.status(500).json({message: 'Internal Server Error'})
    }
}
export const deleteNotification = async(req, res)=>{
    const notificationId = req.params.id
    try {
         await notification.findByIdAndDelete(
            {_id: notificationId, recipient: req.user._id},
        )

        res.status(200).json({message: 'Notification Deleted Sucessfully'})
    } catch (error) {
        console.log('Error in deleteNotification controller:', error.message)
        res.status(500).json({message: 'Internal Server Error'})
    }
}