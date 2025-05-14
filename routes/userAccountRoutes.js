const express= require('express')
const { 
    insertUserAccount, 
    userLoginAttempt, 
    getUserAccounts, 
    getOneUserAccount, 
    verifyCredentials, 
    verifyGoogleAccountRegister,
    passwordUpdate
} = require('../controllers/userAccountController')


const router= express.Router()

router.use('/one', getOneUserAccount)
router.use('/password', verifyCredentials)
router.use('/password-update', passwordUpdate)
router.use('/verifygoogleaccount', verifyGoogleAccountRegister)
router.use('/', getUserAccounts)

module.exports= router 