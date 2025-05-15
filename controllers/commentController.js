const { default: mongoose } = require('mongoose')
const Comment= require('../models/comment')
const Like = require('../models/like')

const insertComment = async (req, res) => {
    try {
        console.log("\n\n=======CONTROLLER insertComment=======\n")
        //console.log(req.body)
        
        const newComment= new Comment(req.body)
        const savedComment= await newComment.save()

        res.status(200).json(savedComment)
    } catch (error) {
        console.log("Erro ao inserir comentario: ", error)
        res.status(500).json({ message: "Erro ao inserir comentario" });
    }

}

const deleteComment = async (req, res) => {

    let commentId = null

    if (req.body.commentId || req.query.commentId || req.params.commentId) {
        commentId = new mongoose.Types.ObjectId(req.body.commentId || req.query.commentId || req.params.commentId)
    }
    
    try {
        console.log("\n\n=======CONTROLLER Delete Comment=======\n")
        // console.log(commentId)
        // console.log('requisição: ', req.body.commentId, req.query.commentId, req.params.commentId)

        const responseLike = await Like.deleteMany( { foreignId: commentId })

        const responseComment = await Comment.findByIdAndDelete(commentId)
        res.status(200).json({ responseLike, responseComment})
    } catch (err) {
        console.log("Erro ao deletar comentario: ", err)
        res.status(500).json({ message: "Erro ao deletar comentario" });
    }
}

const updateComment = async (req, res) => {
    console.log("----updateComment Controller----")
    let commentId = null
    let options= {
        returnDocument: 'after'
    }

    if (req.body.comment._id) commentId = new mongoose.Types.ObjectId(req.body.comment._id)
    //console.log("req.body.comment: ", req.body.comment)

    try {
        const response = await Comment.findByIdAndUpdate(commentId, req.body.comment, options)
        res.status(200).json(response) 
    } catch (err) {
        console.log("Erro ao atualizar comentario: ", err)
        res.status(500).json({ message: "Erro ao atualizar comentario" });
    }

}

const getComments = async (req, res) => {
    console.log("\n\n--------GetComments Controller--------\nforeignId: ", foreignId)

    let pipeLine= []
    let commentId= null
    let foreignId= null
    let order= parseInt(req.body.order || req.query.order || req.params.order || 1) 

    if (req.body.postId || req.query.postId || req.params.postId) {
        foreignId= new mongoose.Types.ObjectId(req.body.postId || req.query.postId || req.params.postId)
        pipeLine.push({
            $match: {foreignId: foreignId}
        })
    }

    if (req.body.commentId || req.query.commentId || req.params.commentId) {
        commentId= new mongoose.Types.ObjectId(req.body.commentId || req.query.commentId || req.params.commentId)
        pipeLine.push({
            $match: { _id: commentId }
        })
    }


    try {
        
        pipeLine.push(
            { //lookup para usuário do comentário
                $lookup: {
                    from: "useraccounts",
                    localField: "userAccountId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { //lookup para likes do comentário
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "foreignId",
                    as: "likes"
                }
            },
            { //lookup para usuários dos likes
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
                                foreignId: "$$likes.foreignId",
                                userAccountId: "$$likes.userAccountId",
                                createdAt: "$$likes.createdAt",
                                user: {
                                    $arrayElemAt: [{
                                        $filter: {
                                            input: "$likeUser",
                                            as: "user",
                                            cond: { $eq: ["$$user._id", "$$likes.userAccountId"] },
                                        }
                                    },0]
                                }
                            }
                        }
                    },
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
                    foreignId: 1,
                    text: 1,
                    type: 1,
                    likes: {
                        _id: 1,
                        foreignId: 1,
                        user: {
                            _id: 1,
                            userName: 1,
                            email: 1,
                            avatarImage: 1,
                        },
                    },
                    user: {
                        _id: 1,
                        firstName: 1,
                        lastName: 1,
                        userName: 1,
                        email: 1,
                        avatarImage: 1,
                    },
                    createdAt: 1,
                    updatedAt: 1,
                }
            },
            { $sort: { createdAt: order } },
        )


        const comments = await Comment.aggregate(pipeLine)
        //console.log("comments response: ",comments)
        res.status(200).json(comments)
    } catch (error) {
        console.log("\nErro ao buscar comentarios: ", error)
        res.status(500).json({ message: "Erro ao buscar comentarios", error });
    }
}

module.exports= {
    insertComment,
    deleteComment,
    updateComment,
    getComments
}