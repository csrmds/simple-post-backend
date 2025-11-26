const { mongoose } = require('mongoose')
const Like= require('../models/like')

const insertLike= async (req, res) => {
    const like= {
      from: req.body.like.from,
      foreignId: new mongoose.Types.ObjectId(req.body.like.foreignId),
      userAccountId: req.body.like.userAccountId
    }

    try {
        const newLike= new Like(like)
        const savedLike= await newLike.save()

        res.status(200).json(savedLike)
    } catch (err) {
        console.error("Erro ao inserir like: ", err)
        res.status(500).json({ message: "Erro ao inserir like" });
    }
}

const checkLike= async (req, res) => {
    const {from, foreignId, userAccountId} = req.body.like

    try {
        const response= await Like.findOne({
            from: from,
            foreignId: new mongoose.Types.ObjectId(foreignId),
            userAccountId: new mongoose.Types.ObjectId(userAccountId)
        })

        res.status(200).json(response)

    } catch (err) {
        console.error("Erro ao verificar like: ", err)
        res.status(500).json({ message: "Erro ao verificar like" });
    }
}

const removeLike= async (req, res) => {
    console.log("\n\n=======LIKE CONTROLLER remove=======\n")
    const likeId= new mongoose.Types.ObjectId(req.body.likeId)
    
    try {
        const response= await Like.findByIdAndDelete(req.body.likeId)
        res.status(200).json(true)
    } catch (err) {
        console.log("Erro ao remover like: ", err)
        res.status(500).json({ message: "Erro ao remover like" });
    }
}


const listLikesByPost = async (req, res) => {
    console.log("\n\n=======LIKE CONTROLLER listLikesByPost=======\n")

    let pipeLine = []
    let postId = null
    let order= parseInt(req.body.order || req.query.order || req.params.order || 1) 

    if (req.body.postId || req.query.postId || req.params.postId) {
        postId = new mongoose.Types.ObjectId(req.body.postId || req.query.postId || req.params.postId)
        pipeLine.push({
            $match: { foreignId: postId }
        })
    }

    try {

        pipeLine.push(
            {//lookup para adicionar usuário do like
                $lookup: {
                    from: "useraccounts",
                    localField: "userAccountId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $addFields: {
                    user: {
                        $arrayElemAt: [{
                            $filter: {
                                input: "$user",
                                as: "user",
                                cond: { $eq: ["$$user._id", "$userAccountId"] }
                            }
                        },0]
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    foreigndId: 1,
                    userAccountId: 1,
                    createdAt: 1,
                    user: {
                        _id: 1,
                        firstName: 1,
                        lastName: 1,
                        avatarImage: 1,
                        email: 1,
                    }
                }
            },
            { $sort: { createdAt: order } },
        )

        const likes= await Like.aggregate(pipeLine)
        res.status(200).json(likes)
        
    } catch (err) {
        console.error("Erro ao listar likes por post: ", err)
        res.status(500).json({ message: "Erro ao listar Likes do post", error: err })
    }
}

const listLikesByComment= async (req, res) => {
    try {
        console.log("\n\n=======LIKE CONTROLLER listLikesByComment=======\n")
        const commentId= new mongoose.Types.ObjectId(req.body.commentId)

        const response= await Like.find({
            from: "comment",
            foreignId: commentId
        })
        res.status(200).json(response)
    } catch (err) {
        console.log("Erro ao listar likes: ", err)
        res.status(500).json({ message: "Erro ao listar likes:" });
    }
}


module.exports= {
    insertLike,
    checkLike,
    removeLike,
    listLikesByPost,
    listLikesByComment
}