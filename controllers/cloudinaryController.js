const cloudinary = require('../config/cloudinary.js')
const fs = require('fs')
const PostImage = require('../models/postImage.js')
const { lastImageOrder } = require ('../utils/commonFunctions.js')



const uploadPostImage = async (req, res) => {
    console.log("-----cloudinaryController uploadPostImage-----")
    if (!req.files.length || !req.body.postId ) {
        console.log("Não foi identificado postId ou arquivos anexados")
        return
    }

    try {        
        const uploadResults= []
        const postId= req.body.postId
        let order= await lastImageOrder(postId)
        console.log("order: ", order)
        

        for (const file of req.files) {
            const filePath = file.path
            const response = await cloudinary.uploader.upload(filePath, {
                asset_folder: 'post-images',
                public_id: `${postId}_${order}`
            })
            order++
            uploadResults.push(response)
            console.log("\nCloudinary.uploader response: ", {
                asset_id: response.asset_id,
                public_id: response.public_id,
                display_name: response.display_name,
                url: response.url,
                asset_folder: response.asset_folder,
            })
        }

        for (const file of req.files) {
            fs.unlinkSync(file.path)
        }
        
        res.status(200).json(uploadResults)
    } catch (err) {
        res.status(500).json({ error: 'Erro no upload da imagem', details: err });
    }
}

const deletePostImage = async (req, res) => {
    console.log("-----cloudinaryController deletePostImage-----")
    if (!req.body.publicId ) {
        console.log("Não foi identificado id da imagem\nReqBody: ", req.body)
        return
    }
    
    const public_id = req.body.publicId
    console.log("public_id: ", public_id)

    try {
        const response= await cloudinary.uploader.destroy(public_id, {notification_url: true})      
        const imageDbDelete = await PostImage.findOneAndDelete({public_id: public_id})

        res.status(200).json({cloudinary: response, imageDbDeleted: imageDbDelete})
    } catch(err) {
        console.log('Erro ao deletar imagem', err)
        res.status(500).json({ error: 'Erro ao deletar imagem', details: err });
    }
        
}

const listImagesByPostId = async (req, res) => {
    console.log("-----cloudinaryController getImagesByPostId-----\nreqbody: ", req.body)
    if (!req.body.postId) {
        console.error("postId não identificado.\nreq.body:", req.body)
        return
    }
    
    const postId= req.body.postId

    try {
        const response= await cloudinary.search
            .expression(`public_id:post-images/${postId}*`)
            .sort_by('created_at', 'asc')
            .max_results(20)
            .execute()

        res.status(200).json(response)
    } catch(err) {
        console.error("Nao foi possível listar imagens: ", err)
        res.status(500).json({ msg: "Nao foi possível listar imagens: ", error: err })
    }

}



const getImageByPublicId = async (req, res) => {
    console.log("-----CloudinaryGetImageByPublicId-----")
    console.log("req.body: ", req.body)
    const publicId= req.body.postId

    

    try {
        const response= await cloudinary.search
            .expression("")
            .sort_by('created_at', 'desc')
            .max_results(10)
            .execute()
        console.log("resources: ", response.resources)
        res.status(200).json(response)
    } catch(err) {
        console.error("Nao foi possível listar imagens: ", err)
        res.status(500).json({ msg: "Nao foi possível listar imagens: ", error: err })
    }

}





module.exports = {
    uploadPostImage, 
    deletePostImage, 
    listImagesByPostId,
    getImageByPublicId,
}