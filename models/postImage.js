const mongoose= require('mongoose')
const { Schema, model } = mongoose;


const postImageSchema = new Schema({
    postId: Schema.Types.ObjectId,
    address: String,
    description: String,
    type: String,
    mimeType: String,
    size: Number,
    width: Number,
    height: Number,
    order: Number,
    source: String,
    public_id: String,
    asset_id: String,
}, { timestamps: true }
)


const PostImage= model('PostImage', postImageSchema)
module.exports= PostImage