const express= require('express')
const { mongoose } = require('mongoose')

const router = express.Router()

router.get('/', async (req, res)=> {
    const resp= await mongoose.connection.db.command({ ping: 1 })
    res.send(
        {
            messagage: 'mensagem de retorno OK',
            ping: resp
        })
})


module.exports= router