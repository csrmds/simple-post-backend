const cloudinary = require('../config/cloudinary.js')
const fs = require('fs')
const PostImage = require('../models/postImage.js')
const { lastImageOrder } = require ('../utils/commonFunctions.js')
//const { cloudinaryRenameOrderFiles } = require('../utils/commonFunctions')



const uploadPostImage = async (req, res) => {
    console.log("-----cloudinaryController uploadPostImage-----")
    if (!req.files.length || !req.body.postId ) {
        console.log("Não foi identificado postId ou arquivos anexados")
        return
    }

    try {        
        const uploadResults= []
        const postId= req.body.postId
        //let order= 0
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
        
        //res.status(200).json({url: response.secure_url, public_id: result.public_id})
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
    //const asset_id= req.body.assetId
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
    //const publicId= req.body.postId
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



// async function cloudinaryRenameOrderFiles(postId) {
//     console.log("-----CloudinaryRenameOrderFiles-----")
//     console.log("PostId: ", postId)
//     try {
//         const images= await PostImage.find({postId: postId}).sort({order: 1})
//         let listFile= []
//         let listNewFileName= []

//         for (const image of images) {
//             if (image.source!= "cloudinary") return
//             console.log("rename file: ", image.public_id)
//             const tempName= `${postId}_${image.order}_temp`
//             const response= await cloudinary.uploader.rename(image.public_id, tempName, {overwrite: true, invalidate: true})
//             //console.log("response: ", response)
//             listFile.push({
//                 public_id: response.public_id,
//                 id: image._id.toString()
//             })
//         }

//         console.log("ListFileTemp: ", listFile)

//         order=0
//         for (const file of listFile) {
//             const newName= `${postId}_${order}`
//             const response= await cloudinary.uploader.rename(file.public_id, newName, {overwrite: true, invalidate: true})
//             console.log(response)

//             const imageUpdated = await PostImage.findByIdAndUpdate(
//                 file.id,
//                 { address: response.url, order: order},
//                 { new: true }
//             )

//             listNewFileName.push({ address: response.url, imageId: file.id, order: order })
//             order++
//         }

//         console.log("ImageListUpdated: ", listNewFileName)
        
//         return {listFile, listNewFileName}
//     } catch (err) {
//         console.log("Erro ao renomar os arquivos: ", err)
//         return { message: "Erro ao renomear arquivos: ", error: err}
//     }
// }




const renameTeste = async (req, res) => {
    console.log("-----cloudinaryController busca por public_id-----")

    const postId= req.body.postId

    const response= await cloudinary.search
        .expression(`public_id STARTS_WITH "${postId}*"`)
        .sort_by('created_at', 'asc')
        .max_results(20)
        .execute()
    // const response= await cloudinaryRenameOrderFiles(req.body.postId)

    res.json(response)

}

const teste2 = async (req, res) => {
    console.log("-----cloudinaryController teste2-----")
    const postId= req.body.postId

    let order= await lastImageOrder(postId)
    console.log("order: ", order)

    res.json(order)
}

module.exports = {
    uploadPostImage, 
    deletePostImage, 
    renameTeste, 
    listImagesByPostId,
    getImageByPublicId,
    teste2
}