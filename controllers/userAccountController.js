const { default: mongoose } = require('mongoose')
const UserAccount= require('../models/userAccount')
const bcrypt= require('bcrypt')

const insertUserAccount = async (req, res) => {
    try {
        console.log("\n\n=======CONTROLLER inserUserAccount=======\n")
        console.log(req.body)
        
        const newUserAccount= new UserAccount(req.body)
        const savedUserAccount= await newUserAccount.save()

        res.status(200).json(savedUserAccount)
    } catch (error) {
        console.log("Erro ao cadastrar usuario: ", error)
        res.status(500).json({ message: "Erro ao cadastrar usuário" });
    }

}

const userLoginAttempt= async (req, res) => {
    
    try {

    } catch (error) {
        console.log("Erro ao logar: ", error)
        res.status(500).json({ message: "Erro ao logar" });
    }
}

const getUserAccounts = async (req, res) => {
    try {
        const userAccounts= await UserAccount.find()
        res.status(200).json(userAccounts)
        //res.status(200).json(userAccounts)
    } catch (error) {
        console.log("Erro ao listar usuarios [getUserAccounts]: ", error)
        res.status(500).json({ message: "Erro ao listar usuarios [getUserAccounts]" });
    }
}

const getOneUserAccount = async (req, res) => {
    //console.log('\n\n----CONTROLLER getOneUserAccount----\n')
    var resp= { error: false, message: "" }
    var search= {}
    if (Object.keys(req.body).length > 0) var search= req.body

    try {
        const userAccount= await UserAccount.findOne(search)
        //console.log('userAccount: ', userAccount)
        if (!userAccount || Object.keys(userAccount).length== 0) {
            resp.error= true
            resp.message= "Não foi encontrado nenhum usuário"
        }
        
        res.status(200).json({userAccount, resp})
    } catch (error) {
        console.log("Erro listar usuarios: [getOneUserAccount]", error)
        res.status(500).json({ message: "Erro listar usuarios [getOneUserAccount]" });
    }
}

const verifyCredentials = async (req, res) => {
    console.log('\n\n----CONTROLLER verifyCredentialsUserAccount----\n')
    var resp= { error: false, message: "" }
    var userCredentials= {}
    if (Object.keys(req.body).length > 0) var userCredentials= req.body

    try {
        const userAccount= await UserAccount.findOne({firstName: userCredentials.firstName})
        const check= await userAccount.validatePassword(userCredentials.password)
        //console.log(userAccount, "typeOf: ", typeof(userAccount))

        res.status(200).json({userAccount, check})
    } catch (err) {
        console.log("Erro ao validar a senha: ", err)
        res.status(500).json({ message: "Erro ao validar a senha: " });
    }
}

const verifyGoogleAccountRegister = async (req, res) => {
    console.log('\n\n----CONTROLLER verifyGoogleAccountRegister----\n')

    var googleAccount= {}
    if (Object.keys(req.body).length > 0) var googleAccount= req.body
    console.log('req.body: ',req.body)

    try {
        const userAccount= await UserAccount.findOne({ googleId: googleAccount.googleId })
        console.log("userAccountResult: ",userAccount)
        if (!userAccount || userAccount.length== 0) {
            console.log("faça aqui um cadastro do usuario google, depois direcione para home page")
            try {
                const newUserAccount= new UserAccount(googleAccount)
                const savedUserAccount= await newUserAccount.save()
                res.status(200).json({savedUserAccount, error: false})
            } catch (err) {
                res.status(500).json({error: true, info: err})
            }
 
        } else {
            console.log("conta verificada, direcionar para home page")
        }
        res.status(200).json({message: "conta do google validada."})
    } catch (err) {
        console.log("Erro ao verificar a conta do google: ", err)
        res.status(500).json({ message: "Erro ao verificar a conta do google." });
    }
}

const passwordUpdate = async (req, res) => {
    console.log('\n----CONTROLLER passwordUpdate----\n')

    console.log("req.bodyL: ", req.body)

    const userId = new mongoose.Types.ObjectId(req.body.userId) 
    const salt = await bcrypt.genSalt(10)
    const newPassword = await bcrypt.hash("PostProject!", salt)
    const options = { returnDocument: 'after' }

    try {
        const response = await UserAccount.findOneAndUpdate(userId, { password: newPassword }, options)

        res.status(200).json(response.data)
    } catch(err) {
        console.error("Erro ao atualizar senha do usuário: ", err)
        res.status(500).json("Erro ao atualizar senha do usuário: ", err)
    }
}


module.exports= {
    insertUserAccount,
    userLoginAttempt,
    getUserAccounts,
    getOneUserAccount,
    verifyCredentials,
    verifyGoogleAccountRegister,
    passwordUpdate
}