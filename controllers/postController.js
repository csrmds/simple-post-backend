const { default: mongoose } = require('mongoose')
const fs= require('fs/promises')
const path= require('path')
const Post= require('../models/post.js')
const PostImage= require('../models/postImage.js')
const Like = require('../models/like.js')
const Comment = require ('../models/comment.js')
const { getPathInfo, fileListRenameOrder, lastImageOrder } = require ('../utils/commonFunctions.js')
const dotenv= require('dotenv')
const axios = require('axios')

dotenv.config()

const url = process.env.BACKEND_URL


const insertPost = async (req, res) => {
    try {
        console.log("\n\n=======CONTROLLER insertPost=======\n")
        const newPost = new Post(req.body)
        const savedPost = await newPost.save()
        console.log("Post criado com sucesso: ", savedPost)


        // if (files) {
        //     const pathImages= process.env.NEXT_PUBLIC_POST_IMAGE_PATH

        //     try {
        //         //cria a pasta com postId para salvar as fotos
        //         await fs.mkdir(pathImages+savedPost._id)
        //         let order= 0
                
        //         for (const [i, file] of files.entries()) {
        //             console.log("for file: ", i)
        //             const extension = path.extname(pathImages+file.filename)
        //             const newFileName= `image_${i}${extension}`
        //             const fileOrigin= pathImages+file.filename
        //             const fileDestination= `${pathImages}${savedPost._id}/${newFileName}`
        //             await fs.rename(fileOrigin, fileDestination)

        //             const newPostImage = new PostImage({
        //                 postId: savedPost._id,
        //                 address: fileDestination,
        //                 description: file.filename,
        //                 order: i,
        //                 source: "local",
        //                 mimetype: file.mimetype,
        //                 size: file.size,
        //             })
        //             const savedPostImage = await newPostImage.save()
        //             console.log(`Imagem salva order[${i}]`, savedPostImage)
        //         }
        //     } catch (err) {
        //         console.log("Erro ao salvar imagem: ", err)
        //         res.status(500).json({ message: "Erro ao salvar imagem", error: err })
        //     }
        // }
        

        res.status(200).json({error: false, message: "Post criado com sucesso.", postId: savedPost._id})
    } catch (error) {
        console.log("Erro ao criar post: ", error)
        res.status(500).json({ error: true, message: "Erro ao criar post" })
    }
}

const getPosts = async (req, res) => {
    try {
        const posts = await Post.find()
        res.status(200).json(posts)
    } catch (error) {
        console.log("Erro ao listar posts: ", error)
        res.status(500).json({ message: "Erro ao listar posts" });
    }
}

const getPostsFilter = async (req, res) => {
    try {
        var order = req.body.order || 1
        var limit = req.body.limit || 15

        const posts = await Post.find()
            .sort({createdAt: order})
            .limit(limit)
        res.status(200).json(posts)
    } catch (error) {
        console.log("Erro ao listar posts: ", error)
        res.status(500).json({ message: "Erro ao listar posts" });
    }
}

const getPostById = async (req, res) => {
    console.log("\n\n----getPostById Controller----")
    //console.log("body: ",req.body, "\nQuery: ", req.query, "\nParams:", req.params)

    let pipeLine= []
    let postId= ""

    if (req.body.postId || req.query.postId || req.params.postId) {
        postId= new mongoose.Types.ObjectId(req.body.postId || req.query.postId || req.params.postId)
    }

    try {
        pipeLine.push(
            {
                $match: { _id: postId}
            },            
            {
                $lookup: {
                    from: "postimages",
                    localField: "_id",
                    foreignField: "postId",
                    as: "images"
                }
            },
            {
                $lookup: {
                    from: "useraccounts",
                    localField: "userAccountId",
                    foreignField: "_id",
                    as: "author"
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "foreignId",
                    as: "likes"
                }
            },
            {
                $lookup: {
                    from: "useraccounts",
                    localField: "likes.userAccountId",
                    foreignField: "_id",
                    as: "likeUser"
                }
            },
            {
                $addFields: {
                    likes: {
                        $map: {
                            input: "$likes",
                            as: "likes",
                            in: {
                                _id: "$$likes._id",
                                createdAt: "$$likes.createdAt",
                                user: {
                                    $arrayElemAt: [{
                                        $filter: {
                                            input: "$likeUser",
                                            as: "user",
                                            cond: { $eq: ["$$user._id", "$$likes.userAccountId"] }
                                        }
                                    }, 0]
                                }
                            }
                        }
                    },
                    author: {
                        $arrayElemAt: [{
                            $filter: {
                                input: "$author",
                                as: "author",
                                cond: { $eq: ["$$author._id", "$userAccountId"] }
                            }
                        }, 0]
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    author: {
                        _id: 1,
                        email: 1,
                        firstName: 1,
                        lastName: 1,
                        avatarImage: 1
                    },
                    likes: {
                        _id: 1,
                        createdAt: 1,
                        user: {
                            _id: 1,
                            email: 1,
                            firstName: 1,
                            lastName: 1,
                            avatarImage: 1
                        }
                    },
                }
            }
        )

        const post= await Post.aggregate(pipeLine)
        //console.log(post[0])
        res.status(200).json(post[0])
    } catch(err) {
        console.error("Erro ao buscar post por Id: ", err)
        res.status(500).json({ message: "Erro ao buscar post por Id", erro: err })
    }

}

const getPostsPaginate = async (req, res) => {
    console.log("\n\n------Controller getPostsAggregate------")
    //console.log("body: ",req.body, "\nQuery: ", req.query, "\nParams:", req.params)
    let pipeLine= []
    let postId= null

    if (req.body.postId || req.query.postId || req.params.postId) {
        postId= new mongoose.Types.ObjectId(req.body.postId || req.query.postId || req.params.postId)
        pipeLine.push({
            $match: { _id: postId }
        })
    }

    const order= parseInt(req.body.order || req.query.order || req.params.order || -1) 
    const limit= parseInt(req.body.limit || req.query.limit || req.params.limit || 10) 
    const page= parseInt(req.body.page || req.query.page || req.params.page || 1)
    //const postId= new mongoose.Types.ObjectId(req.body.postId || req.query.postId || req.params.postId)

    try {
        pipeLine.push(
            //lookup para imagens do post
            { 
                $lookup: {
                    from: "postimages",
                    localField: "_id",
                    foreignField: "postId",
                    as: "images"
                },
            },
            
            //lookup para comentarios do post
            {
                $lookup: {
                    from: "comments",
                    localField: "_id",
                    foreignField: "foreignId",
                    as: "comments"
                },    
            },
            
            //lookup para usuário dos comentarios
            {
                $lookup: {
                    from: "useraccounts",
                    localField: "comments.userAccountId",
                    foreignField: "_id",
                    as: "commentUser"
                }
            },

            //lookup para likes dos comentários
            {
                $lookup: {
                    from: "likes",
                    localField: "comments._id",
                    foreignField: "foreignId",
                    as: "commentLikes"
                }
            },

            //lookup para usuario dos likes dos comentarios
            {
                $lookup: {
                    from: "useraccounts",
                    localField: "commentLikes.userAccountId",
                    foreignField: "_id",
                    as: "commentLikeUser"
                }
            },

            //lookup para usuario do post
            {
                $lookup: {
                    from: "useraccounts",
                    localField: "userAccountId",
                    foreignField: "_id",
                    as: "author"
                }
            },

            //lookup para likes do post
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "foreignId",
                    as: "likes"
                }
            },

            //lookup para usuarios dos likes do post
            {
                $lookup: {
                    from: "useraccounts",
                    localField: "likes.userAccountId",
                    foreignField: "_id",
                    as: "postLikeUser"
                }
            },

            //adicionando autor e os likes dos comenatarios
            {
                $addFields: {
                    comments: {
                        $map: {
                            input: "$comments",
                            as: "comment",
                            in: {
                                _id: "$$comment._id",
                                foreignId: "$$comment.foreignId",
                                text: "$$comment.text",
                                type: "$$comment.type",
                                userAccountId: "$$comment.userAccountId",
                                createdAt: "$$comment.createdAt",
                                updatedAt: "$$comment.updatedAt",
                                user: {
                                    $arrayElemAt: [
                                        //arrayElemAt -> tranforma o array em um objeto. user: [{...}] > user: {...}
                                        {
                                            $filter: {
                                                input: "$commentUser",
                                                as: "user",
                                                cond: { $eq: ["$$user._id", "$$comment.userAccountId"] }
                                            }
                                        }, 0
                                    ]
                                },
                                likes: {
                                    $map: {
                                        input: {
                                            $filter: {
                                                input: "$commentLikes",
                                                as: "likes",
                                                cond: { $eq: ["$$likes.foreignId", "$$comment._id"] }
                                            }
                                        },
                                        as: "likes",
                                        in: {
                                            _id: "$$likes._id",
                                            foreignId: "$$likes.foreignId",
                                            userAccountId: "$$likes.userAccountId",
                                            createdAt: "$$likes.createdAt",
                                            user: {
                                                $arrayElemAt: [{
                                                    $filter: {
                                                        input: "$commentLikeUser",
                                                        as: "user",
                                                        cond: { $eq: ["$$user._id", "$$likes.userAccountId"] }
                                                    }
                                                },0]
                                            }
                                        },
                                        
                                    }
                                }
                            }
                        }
                    },

                    likes: {
                        $map: {
                            input: "$likes",
                            as: "likes",
                            in: {
                                _id: "$$likes._id",
                                createdAt: "$$likes.createdAt",
                                user: {
                                    $arrayElemAt: [{
                                        $filter: {
                                            input: "$postLikeUser",
                                            as: "user",
                                            cond: { $eq: ["$$user._id", "$$likes.userAccountId"] }
                                        }
                                    }, 0]
                                }
                            }
                        }
                    }
                }
            },
            
            //retorna apenas os campos desejados
            { 
                $project: {
                    _id: 1,
                    title: 1,
                    content: 1,
                    //images: { address: 1, description: 1, source: 1 },
                    images: 1,
                    comments: { 
                        _id: 1,
                        foreignId: 1,
                        text: 1,
                        type: 1,
                        likes: { 
                            _id: 1,
                            foreignId: 1,
                            user: {
                                _id: 1,
                                firstName: 1,
                                userName: 1,
                                email: 1,
                            }
                        },
                        user: { 
                            _id: 1, 
                            avatarImage: 1, 
                            firstName: 1,
                            lastName: 1 
                        },
                        createdAt: 1,
                        updatedAt: 1,
                    },
                    author: { 
                        _id: 1, 
                        avatarImage: 1, 
                        firstName: 1, 
                        lastName: 1 
                    },
                    likes: { 
                        _id: 1,
                        foreignId: 1,
                        user: {
                            _id: 1,
                            avatarImage: 1, 
                            firstName: 1, 
                            lastName: 1,
                        },
                        createdAt: 1 
                    },
                    createdAt: 1,
                    updatedAt: 1
                } 
            },
            { $sort: { createdAt: order } },
        )

        const options = { page, limit }
        const posts = await Post.aggregatePaginate(Post.aggregate(pipeLine), options)
        res.status(200).json(posts)
    } catch (error) {
        console.log("Erro ao buscar post: ", error)
        res.status(500).json({ message: "Erro ao buscar post" })
    }
}

const getPostsAggregate = async (req, res) => {
    // console.log("\n\n------Controller getPostsAggregate------")
    // console.log('req: ', "body: ",req.body.limit, "\nQuery: ", req.query.limit, "\nParams:", req.params.limit)
    const order= parseInt(req.body.order || req.query.order || req.params.order || -1) 
    const limit= parseInt(req.body.limit || req.query.limit || req.params.limit || 10) 
    const page= 1

    try {
        const posts = await Post.aggregate([
            {
                $lookup: {
                    from: "postimages",
                    localField: "_id",
                    foreignField: "postId",
                    as: "images"
                },
            },
            {
                $lookup: {
                    from: "comments",
                    localField: "_id",
                    foreignField: "foreignId",
                    as: "comments"
                }
            },
            {
                $unwind: {  path: "$comments", preserveNullAndEmptyArrays: true  }
            },
            {
                $lookup: {
                    from: "useraccounts",
                    localField: "comments.userAccountId",
                    foreignField: "_id",
                    as: "comments.author"
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "comments._id",
                    foreignField: "foreignId",
                    as: "comments.likes"
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "foreignId",
                    as: "likes"
                }
            },
            {
                $group: {
                    _id: "$_id",
                    title: { $first: "$title" },
                    content: { $first: "$content" },
                    images: { $first: "$images" },
                    comments: { $push: "$comments" },
                    likes: { $first: "$likes" },
                    userAccountId: { $first: "$userAccountId" },
                    createdAt: { $first: "$createdAt" },
                }
            },
            {
                $lookup: {
                    from: "useraccounts",
                    localField: "userAccountId",
                    foreignField: "_id",
                    as: "author"
                }
            },
            { $sort: {createdAt: order} },
            { $limit: limit }
        ])
        //console.log("Lista de posts...", posts)
        res.status(200).json(posts)
    } catch (error) {
        console.log("Erro ao buscar post: ", error)
        res.status(500).json({ message: "Erro ao buscar post" })
    }
}

const updatePost = async (req, res) => {
    console.log("-----updatePost Controller-----")
    //console.log("body: ",req.body, "\nQuery: ", req.query, "\nParams:", req.params, "\nFiles: ", req.files)

    try {
        const {postId, content} = req.body
        const files = req.files
        const updatedPost= await Post.findByIdAndUpdate(postId, {content: content}, {new: true})
        console.log("Post atualizado com sucesso.", postId)

        if (files) {
            console.log("files...")
            const pathImages= process.env.NEXT_PUBLIC_POST_IMAGE_PATH
            let order= await lastImageOrder(postId)
            console.log("Last Order: ", order)
            
            
            try {
                for (const file of files) {
                    console.log("FileMapOrder iteration: ", order)
                    const extension = path.extname(pathImages+file.filename)
                    const newFileName= `image_${order}${extension}`
                    const tempAddress= pathImages+file.filename
                    const newAddress= `${pathImages}${postId}/${newFileName}`
                    
                    await fs.rename(tempAddress, newAddress)

                    const newPostImage = new PostImage({
                        postId: updatedPost._id,
                        address: newAddress,
                        description: file.filename,
                        order: order,
                        source: "local",
                        mimetype: file.mimetype,
                        size: file.size,
                    })

                    const savedPostImage = await newPostImage.save()
                    console.log(`Imagem salva order[${order}]`, savedPostImage.address)
                    order++
                    console.log("NextOrder: ", order)
                }
            } catch(err) {
                console.error("Erro ao salvar imagem: ", err)
                res.status(500).json({message: "Erro ao salvar imagem", error: err})
            }

        }

        res.status(200).json(updatedPost)
    } catch (error) {
        console.log("Erro ao atualizar post: ", error)
        res.status(500).json({ message: "Erro ao atualizar post" })
    }

}

const deletePost = async (req, res) => {
    console.log("\n\n------Controller Delete Post------\nPostId: ",req.body.postId)
    const postId = new mongoose.Types.ObjectId(req.body.postId)
    const imageFolderAddress= `${process.env.NEXT_PUBLIC_POST_IMAGE_PATH}${postId}`
    let deletedLikes= ""

    try {
        //const deletedLikes = await Like.deleteMany({ foreignId: postId })
        const comments = await Comment.find({ foreignId: postId })
        console.log("\nDeletedLikes: ")
        comments.map( async (comment)=> {
            deletedLikes = await Like.deleteMany({ foreignId: comment._id })
            console.log(deletedLikes)
        })

        const deletedComments = await Comment.deleteMany({ foreignId: postId })
        console.log("deletedComments: ", deletedComments)

        const deletedLikesPost = await Like.deleteMany({ foreignId: postId })
        console.log("\n\nDeleted Likes Post:", deletedLikesPost)

        console.log("\n\nDeletando imagens do post:")
        const postImages = await PostImage.find({ postId: postId })
        for (const image of postImages) {
            if (image.source== "cloudinary") {
                console.log("chamada cloudinaryDelete")
                const resp= await axios.post(`${url}/image/cloudinary/delete`, {publicId: image.public_id})
                console.log(resp.data)
            } else {
                fs.unlink(image.address)
            }
        }
        
        const deletedImages = await PostImage.deleteMany({ postId: postId }) 
        console.log("deletedImagesDB: ", deletedImages)

        const deletedPost = await Post.findByIdAndDelete(postId)
        console.log("\n\nDeleted post:", deletedPost)

        console.log("\ndeletedPostFolder..")
        fs.access(imageFolderAddress)
            .then(() => {
                fs.rm(imageFolderAddress, {recursive: true, force: true})
                console.log("Diretório deletado")
            })
            .catch(() => console.log("Diretório não existe"))
        
        res.status(200).json({ deletedLikes, deletedComments, deletedLikesPost, deletedImages, deletedPost })
    } catch(err) {
        console.log("Erro ao deletar post: ", err)
        res.status(500).json({ message: "Erro ao deletar post" })
    }

}

const testFile = async (req, res) => {
    console.log("\n\n=====TesteFile=====")
    const postId= req.body.postId

    try {
        const pathImages= process.env.NEXT_PUBLIC_POST_IMAGE_PATH
        const listFiles = await fs.readdir(pathImages)
        const file = await fs.stat(pathImages + listFiles[0])

        let listFile= []
        let listNewFileName= []

        const images= await PostImage.find({postId: postId}).sort({_id: 1})
        //renomeia os arquivos do post para um nome temporario
        images.map(async (image) => {
            let fileName= path.basename(image.address, path.extname(image.address))
            let extension= path.extname(image.address)
            let tempFileName= `${pathImages}${fileName}_temp${extension}`
            listFile.push({
                address: tempFileName, 
                id: image._id.toString()
            })
            let rename= await fs.rename(image.address, tempFileName)
            console.log("renameTemp: ", rename )
        })
        console.log("ListFileTemp: ", listFile)


        //renomeia os arquivos para um nome correto e atualiza no banco de dados
        listFile.map(async (filePath, i) => {
            console.log("chamou listFile.map")
            let extension= path.extname(filePath.address)
            let fileNewName= `${pathImages}${postId}_${i}${extension}`
            let rename= await fs.rename(filePath.address, fileNewName)
            console.log("rename: ", rename)
            const imageUpdated= await PostImage.findByIdAndUpdate(filePath.id, {address: fileNewName}, {new: true})
            listNewFileName.push({address: fileNewName, id: filePath.id})
            console.log("ImageUpdated: ", imageUpdated)
        })
        console.log("listNewFileName: ", listNewFileName)
      
        
        res.status(200).json({ message: "Arquivo lido com sucesso", listFiles, images, listFile, listNewFileName})
        
    } catch (error) {
        console.log("Erro ao testar arquivo: ", error)
        res.status(500).json({ message: "Erro ao testar arquivo" })
    }
}

async function getLastAddressByPostId (postId) {

    try {
        const id = new mongoose.Types.ObjectId(postId)
        const imageList = await PostImage.find({ postId: id }).sort({ _id: 1 })
        let imageAddressList = []

        imageList.map(image => {
            imageAddressList.push(image.address)
        })
        imageAddressList.sort()

        const last= imageAddressList[imageAddressList.length - 1]

        return last

    } catch(err) {
        console.log(err)
        return false
    }
    
}


const testeGenerico = async (req, res) => {
    console.log("\n\n=====TesteFile=====")
    const postId= new mongoose.Types.ObjectId(req.body.postId) 
    console.log(postId)

    try {
        const lastOrder= await lastImageOrder(postId)
        console.log("Last Order: ", lastOrder)
    } catch(err) {
        console.log("Erro ao testar arquivo: ", err)
        res.status(500).json({ message: "Erro ao testar arquivo" })
    }

}

const testeInsertOrderImages = async (req, res) => {
    console.log("\n\n=====TesteInsertOrder=====")

    //const postId= new mongoose.Types.ObjectId(req.body.postId)
    const pathImages= process.env.NEXT_PUBLIC_POST_IMAGE_PATH

    try {
        const posts= await Post.find()
        //console.log("Post: ", post._id)

        posts.map(async post => {
            
            try {
                //console.log("PostId: ", post._id)
                const images= await PostImage.find({postId: post._id})
        
                if (!images || images.length=== 0) {
                    console.log("PostID: ", post._id, "\nnenhuma imagem para ser atualizada")
                    return
                }

                images.map(async (image, i) => {
                    let extension = path.extname(image.address)
                    let newFileName= pathImages+post._id+"/image_"+i+extension

                    console.log("new Address: ", newFileName)
                    
                    if (image.source== "local") {
                        image.address= newFileName
                        image.save()
                    } else {
                        console.log("web image")
                    }
                    
                })
        
                // images.map(async (image, i) => {
                //     image.order= i
                //     //await image.save()
                //     console.log("updateOrder: ", {postId: image.postId, order: image.order, address: image.address})
                // })
        
                //res.status(200).json(images)
            } catch(err) {
                console.log("Erro ao inserir order em postImages: ", err)
                res.status(500).json({ message: "Erro ao inserir order em postImages", error: err })
            }

        })


    } catch(err) {
        console.log("Erro ao buscar posts: ", err)
        res.status(500).json({ message: "Erro ao buscar posts", error: err })
    }

    
}


module.exports= {
    insertPost, 
    getPosts, 
    getPostById, 
    getPostsFilter,
    getPostsPaginate,
    getPostsAggregate, 
    updatePost, 
    testFile,
    testeGenerico,
    testeInsertOrderImages,
    deletePost
}