const express= require('express')

const router = express.Router()

router.get('/rota', (req, res)=> {
    res.send({type: 'ab', messagage: 'mensagem de retorno OK'})
})




module.exports= router