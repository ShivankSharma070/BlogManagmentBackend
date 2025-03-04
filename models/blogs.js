const mongoose = require("mongoose")
const blogSchema = new mongoose.Schema({
    title:{type:String,required:true},
    content:{type:String,required:true},
    comment:{type:[String],default:[]},
    like:{type:Number,default:0}
})

module.exports=blogSchema
