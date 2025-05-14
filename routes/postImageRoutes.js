const express = require('express')
const multer= require('multer')
const { insertPostImage, deletePostImage, updatePostImage, getPostImage, getImageById, getLastImageOrder } = require('../controllers/postImageController')
const { 
    uploadPostImage: cloudinaryUpload, 
    deletePostImage: cloudinaryDelete,
    listImagesByPostId: cloudinaryListByPostId,
    renameTeste: teste,
    getImageByPublicId,
    teste2
    } = require('../controllers/cloudinaryController')


const router= express.Router()
const upload= multer({dest: './src/backend/files/temp/'})



router.use('/insert', insertPostImage)
router.use('/delete', deletePostImage)
router.use('/update', updatePostImage)
router.use('/post', getPostImage)
router.use('/id', getImageById)
router.use('/lastOrder', getLastImageOrder)
router.use('/cloudinary/upload', upload.array('post-image'), cloudinaryUpload)
router.use('/cloudinary/delete', cloudinaryDelete)
router.use('/cloudinary/teste', teste)
router.use('/cloudinary/teste2', teste2)
router.use('/cloudinary/listByPostId', cloudinaryListByPostId)
router.use('/cloudinary/getImageByPublicId', getImageByPublicId)


module.exports= router