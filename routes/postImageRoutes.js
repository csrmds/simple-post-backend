const express = require('express')
const multer= require('multer')
const { insertPostImage, deletePostImage, getPostImage, getImageById, getLastImageOrder } = require('../controllers/postImageController')
const { 
    uploadPostImage: cloudinaryUpload, 
    deletePostImage: cloudinaryDelete,
    listImagesByPostId: cloudinaryListByPostId,
    getImageByPublicId,
    } = require('../controllers/cloudinaryController')


const router= express.Router()
const upload= multer({dest: './files/temp/'})



router.use('/insert', insertPostImage)
router.use('/delete', deletePostImage)
// router.use('/update', updatePostImage)
router.use('/post', getPostImage)
router.use('/id', getImageById)
router.use('/lastOrder', getLastImageOrder)
router.use('/cloudinary/upload', upload.array('post-image'), cloudinaryUpload)
router.use('/cloudinary/delete', cloudinaryDelete)
router.use('/cloudinary/listByPostId', cloudinaryListByPostId)
router.use('/cloudinary/getImageByPublicId', getImageByPublicId)


module.exports= router