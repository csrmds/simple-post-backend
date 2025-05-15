const fs = require('fs/promises')
const path = require('path')
const PostImage= require('../models/postImage')
const cloudinary = require('../config/cloudinary.js')


function getPathInfo(address) {

    let extension= path.extname(address)
    let name= path.basename(address, extension)
    let directory= address.replace(name+extension, "")

    return { directory, name, extension }
}


async function fileListRenameOrder(postId) {
   
    try {
        const images= await PostImage.find({postId: postId}).sort({order: 1})
        let listFile= []
        let listNewFileName= []
        
        //laço para renomear os arquivos para um nome temporario
        images.map(async (image)=> {
            if (image.source== "cloudinary") return

            const fileAddress= getPathInfo(image.address)
            console.log("file address: ", fileAddress)
            const tempFileName= `${fileAddress.directory}${fileAddress.name}_temp${fileAddress.extension}`
            listFile.push({
                address: tempFileName, 
                id: image._id.toString()
            })
            await fs.rename(image.address, tempFileName)
        })
        console.log("ListFileTemp: ", listFile)

        //renomeia os arquivos para um nome correto e atualiza no banco de dados
        listFile.map(async (file, i) => {
            const fileAddress= getPathInfo(file.address)
            let fileNewName = `${fileAddress.directory}image_${i}${fileAddress.extension}`
            // console.log("Origem: ", file.address)
            // console.log("Destin: ", fileNewName)
            await fs.rename(file.address, fileNewName)
            
            const imageUpdated = await PostImage.findByIdAndUpdate(
                file.id, 
                { address: fileNewName, order: i }, 
                { new: true }
            )
            
            listNewFileName.push({ address: fileNewName, id: file.id, order: i })
            console.log("ImageUpdated: ", imageUpdated)
        })
        console.log("listNewFileName: ", listNewFileName)

        return {listFile, listNewFileName}
    } catch(err) {
        console.log("Erro ao testar arquivo: ", err)
        return { message: "Erro ao testar arquivo: ", error: err}
    }

}

async function cloudinaryRenameOrderFiles(postId) {
    console.log("-----CloudinaryRenameOrderFiles-----")
    console.log("PostId: ", postId)
    try {
        const images= await PostImage.find({postId: postId}).sort({order: 1})
        let listFile= []
        let listNewFileName= []

        for (const image of images) {
            if (image.source!= "cloudinary") return
            const tempName= `${postId}_${image.order}_temp`
            const response= await cloudinary.uploader.rename(image.public_id, tempName, {overwrite: true, invalidate: true})
            console.log("\nResponse rename temp: ", {
                asset_id: response.asset_id,
                public_id: response.public_id,
                display_name: response.display_name,
                url: response.url
            })
            listFile.push({
                public_id: response.public_id,
                id: image._id.toString()
            })
        }

        //console.log("ListFileTemp: ", listFile)

        order=0
        for (const file of listFile) {
            console.log("Laço rename New:", file, order)
            const newName= `${postId}_${order}`
            
            const responseDisplayName= await cloudinary.api.update(file.public_id, { display_name: newName })
            console.log("\nResponse rename displayName: ", {
                asset_id: responseDisplayName.asset_id,
                public_id: responseDisplayName.public_id,
                display_name: responseDisplayName.display_name,
                url: responseDisplayName.url
            })
            
            const response= await cloudinary.uploader.rename(file.public_id, newName, {overwrite: true, invalidate: true})
            console.log("\nResponse rename publicId new: ", {
                asset_id: response.asset_id,
                public_id: response.public_id,
                display_name: response.display_name,
                url: response.url
            })

            const imageUpdated = await PostImage.findByIdAndUpdate(
                file.id,
                { 
                    address: response.url, 
                    order: order,
                    description: newName,
                    public_id: response.public_id,
                },
                { new: true }
            )

            listNewFileName.push({ address: response.url, imageId: file.id, order: order })
            order++
        }

        console.log("ImageListUpdated: ", listNewFileName)
        
        return {listFile, listNewFileName}
    } catch (err) {
        console.log("Erro ao renomar os arquivos: ", err)
        return { message: "Erro ao renomear arquivos: ", error: err}
    }
}


async function cloudinaryRenameFile(publicId, newName, newOrder) {
    try {
        console.log("cloudinaryRenameFile")
        const newPublicName= `${newName}_${newOrder}`
        const response = await cloudinary.uploader.rename(publicId, newName, {overwrite: true, invalidade: true})
        console.log(response)
    } catch(err) {
        console.log("Erro ao renomear o arquivo: ", err)
        return { message: "Erro ao renomear o arquivo: ", error: err}
    }
}


async function lastImageOrder(postId) {
    console.log("-----lastImageOrder-----")
    try {
        const images= await PostImage.find({postId: postId}).sort({order: 1})
        const lastOrder= images[images.length -1].order +1
        //console.log("LastOrder: ", lastOrder)
        return parseInt(lastOrder) 
    } catch(err) {
        //console.log("Erro ao pegar informações dos arquivos: ", err)
        return parseInt(0)
    }
}


module.exports= {
    getPathInfo,
    fileListRenameOrder,
    lastImageOrder,
    cloudinaryRenameOrderFiles
}