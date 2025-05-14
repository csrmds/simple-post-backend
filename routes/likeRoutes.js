const express= require('express')
const { 
    insertLike, 
    checkLike, 
    removeLike, 
    listLikesByPost, 
    listLikesByComment } = require('../controllers/likeController')


const router= express.Router()

router.post('/insert', insertLike)
router.post('/check', checkLike)
router.post('/remove', removeLike)
router.use('/post', listLikesByPost)
router.post('/comment', listLikesByComment)

module.exports= router 