const mongoose= require('mongoose')
const bcrypt= require('bcrypt')
const { Schema, model } = mongoose;


const UserAccountSchema = new Schema({
    userName: { type: String, required: true },
    password: String,
    email: String,
    firstName: String,
    lastName: String,
    birthDate: Date,
    avatarImage: String,
    type: String,
    googleId: String,
}, { timestamps: true }
)

UserAccountSchema.methods.validatePassword= async function(password) {
    return await bcrypt.compare(password, this.password)
}

const UserAccount= model('UserAccount', UserAccountSchema)
module.exports= UserAccount