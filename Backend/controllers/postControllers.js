import cloudinary from "../lib/cloudinary.js";
import post from "../models/postModel.js";
import notification from "../models/notificationModel.js";
import {sendCommentNotificationEmail} from '../lib/mailTrap/emails.js'

export const getFeedPosts = async (req, res)=>{
    try {
        const posts = await post.find({author: {$in: [...req.user.connections, req.user._id]}})
        .populate('author', 'name username profilePicture headline')
        .populate('comments.user', 'name profilePicture')
        .sort({createdAt: -1})

        res.status(200).json(posts)
    } catch (error) {
        console.log('Error in getFeedPosts controller:', error.message)
        res.status(500).json({message: 'Internal Server Error'})
    }
}

export const createPost = async (req, res)=>{
    try {
        const {content, image} = req.body

        let newPost

        if(image){
            const imgResult = await cloudinary.uploader.upload(image)
            newPost = new post({
                author: req.user._id,
                content,
                image: imgResult.secure_url
            })
        }else{
            newPost = new post({
                author: req.user._id,
                content
            })
        }

        await newPost.save()

        res.status(201).json(newPost)
    } catch (error) {
        console.log('Error in createPost controller:', error.message)
        res.status(500).json({message: 'Server Error'})
    }
}
export const deletePost = async (req, res)=>{
    try {
        const postId = req.params.id
        const userId = req.user._id

        const Post = await post.findById(postId)

        if(!Post){
            return res.status(404).json({message: 'Post Not Found'})
        }

        if(Post.author.toString() !== userId.toString()){
            return res.status(403).json({message: 'You are not authorized to delete this post'})
        }
        if(Post.image){
            await cloudinary.uploader.destroy(Post.image.split('/').pop().split('.')[0])
        }

         await post.findByIdAndDelete(postId)

         res.status(200).json({message: 'Post Deleted Sucessfully'})
    } catch (error) {
        console.log('Error in deletePost Controller:', error.message)
        res.status(500).json({message: 'Server Error'})
    }
}

export const getPostById = async(req, res)=>{
    try {
        const postId = req.params.id
        const Post = await post.findById(postId)
        .populate('author', 'name username profilePicture headline')
        .populate('comments', 'name profilePicture username headline')

        if(!Post){
            return res.status(400).json({message: 'Post Does Not Exist'})
        }
        
        res.status(200).json(Post)
    } catch (error) {
        console.log('Error in getPostById controller', error.message)
        res.status(500).json({message: 'Server Error'})
    }
}

export const createComment = async(req, res)=>{
    try {
        const postId = req.params.id
        const {content} = req.body

        const Post = await post.findByIdAndUpdate(postId, {$push: {comments: {user:req.user._id, content}}}, {new: true})
        .populate('author', 'name username email headline profilePicture')

        if(Post.author._id.toString() !== req.user.id.toString()){
            const newNotification = new notification({
                recipient: Post.author, 
                type: 'comment',
                relatedUser: req.user._id,
                relatedPost: postId
            })

            await newNotification.save()

            try {
                const postUrl = `${process.env.CLIENT_URL}/post/${postId}`
                await sendCommentNotificationEmail(Post.author.email, Post.author.name, req.user.name, postUrl, content)
            } catch (error) {
                console.log('Error in sending Notification Email:', error)
            }
        }
        res.status(200).json(Post)
    } catch (error) {
        
    }
}

export const likePost = async(req, res)=>{
    try {
        const postId = req.params.id
        const Post =  await post.findById(postId)
        const userId = req.user._id
        
        if(Post.likes.includes(userId)){
            Post.likes = Post.likes.filter(id => id.toString() !== userId.toString())
        }else{
            Post.likes.push(userId)

            if(Post.author.toString() !== userId.toString()){
                const newNotification = new notification({
                    recipient: Post.author,
                    type: 'like',
                    relatedUser: userId,
                    relatedPost: postId
                })
                await newNotification.save()
            }
        }
            await Post.save()

            res.status(200).json(Post)
        
    } catch (error) {
        console.log('Error in likePost controller:', error)
        res.status(500).json({message: 'Server Error'})
    }
}