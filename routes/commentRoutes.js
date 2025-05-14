const express= require('express')
const { insertComment, getComments, deleteComment, updateComment }= require('../controllers/commentController')


const router= express.Router()

router.post('/insert', insertComment)
router.post('/delete', deleteComment)
router.post('/update', updateComment)
router.use('/', getComments)

module.exports= router 