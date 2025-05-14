const mongoose= require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2')
const { Schema, model } = mongoose;


const postSchema = new Schema({
    title: { type: String },
    content: { type: String, required: true },
    userAccountId: Schema.Types.ObjectId,
}, { timestamps: true }
)

postSchema.plugin(mongoosePaginate)
postSchema.plugin(mongooseAggregatePaginate)

const Post= mongoose.model('Post', postSchema)
module.exports= Post