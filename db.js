const mongoose = require("mongoose")
const connection = mongoose.connection

const connectdb = async ()=>{
    connection.on("connected",()=>{
        console.log("Succesfully connected to database")
    })
    connection.on("error",(err)=>{
        console.log("An error occured:",err)
    })
    connection.on("disconneted",()=>{
        console.log("Disconnected from database")
    })
  await mongoose.connect(process.env.MONGODB_CONNECT_URL).catch((err) => {console.error(err)})
}
module.exports={ connectdb }
