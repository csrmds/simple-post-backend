const express= require('express')

const router = express.Router()

router.get('/', (req, res)=> {
    res.send({messagage: 'mensagem de retorno OK'})
})


module.exports= router