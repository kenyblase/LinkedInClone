import { sender, transport } from "./mailTrapConfig.js"
import { createCommentNotificationEmailTemplate, createConnectionAcceptedEmailTemplate, createWelcomeEmailTemplate } from "./emailTemplates.js"

export const sendWelcomeEmail = async (email, name, profileUrl)=>{
    const recipient = [email]
    try {
       const response = await transport.sendMail({
        from: sender,
        to: recipient,
        subject: "Welcome To LinkedIn",
        html: createWelcomeEmailTemplate(name, profileUrl),
        category:"Welcome Email"
       }) 

       console.log('Welcome Email Sent Successfully', response)
    } catch (error) {
        console.error(`Error sending Verification: ${error}`)
        throw new Error (`Error Sending Verification Email: ${error}`)
    }
}

export const sendCommentNotificationEmail = async(recipientEmail, recipientName, commenterName, postUrl,commentContent)=>{
    const recipient = [recipientEmail]

    try {
       const response = await transport.sendMail({
        from: sender,
        to: recipient,
        subject: "New Comment On Your Post",
        html: createCommentNotificationEmailTemplate(recipientName, commenterName, postUrl, commentContent),
        category:"Comment Notification Email"
       }) 

       console.log('Comment Notification Email Sent Successfully', response)
    } catch (error) {
        console.error('Error sending Verification:', error)
        throw new Error (`Error Sending Verification Email: ${error}`)
    }

}
export const sendConnectionAcceptedEmail = async(senderEmail, senderName, recipientName, profileUrl)=>{
    const recipient = [senderEmail]

    try {
       const response = await transport.sendMail({
        from: sender,
        to: recipient,
        subject: `${recipientName} accepted your connection request`,
        html: createConnectionAcceptedEmailTemplate(senderName, recipientName, profileUrl),
        category:"Accepted Connection Email"
       }) 

       console.log('Accepted Connection Email Sent Successfully', response)
    } catch (error) {
        console.error('Error sending Verification:', error)
        throw new Error (`Error Sending Verification Email: ${error}`)
    }

}
