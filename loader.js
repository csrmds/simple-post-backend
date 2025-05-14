const dotenv= require('dotenv')
const express= require('express')
const connectDB= require('./config/database')
//const routes= require('./routes/routes')
const postRoutes= require('./routes/postRoutes')
const commentRoutes= require('./routes/commentRoutes')
const userAccountRoutes= require('./routes/userAccountRoutes')
const likeRoutes= require('./routes/likeRoutes')
const imagesRoutes= require('./routes/postImageRoutes')
const allowCors= require('./config/cors')
const path= require('path')

dotenv.config()
const app= express()

connectDB()

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(allowCors)

//LOG PARA VERIFICAR OQ ESTÁ SENDO ENVIADO
// app.use((req, res, next) => {
//     console.log("Middleware LOG:");
//     console.log("Headers:", req.headers);
//     console.log("Body:", req.body);
//     console.log("Query:", req.query);
//     console.log("Params:", req.params);
//     next();
// });

app.use('/api/useraccount', userAccountRoutes)
app.use('/post', postRoutes)
app.use('/image', imagesRoutes)
app.use("/images", express.static(path.join(__dirname, "files", "postImages")));
app.use("/images/avatar", express.static(path.join(__dirname, "files", "userAvatar")));
app.use('/comment', commentRoutes)
app.use('/like', likeRoutes)


const PORT= process.env.PORT || 5000

app.listen(PORT, ()=> {
    console.log(`Server running on port: ${PORT}`)
})
