const mongoose=require('mongoose')
const { required } = require('nodemon/lib/config')
const objectId=mongoose.Schema.Types.ObjectId
const cartModel=new mongoose.Schema(
    {
    userId:{
        type:objectId,
        required:'user id is required',
        refs:'user'
    },
    items:[
        {
            productId:{type:objectId,required:"product id is required",refs:"product"},
            quantity:{type:Number,required:"quantity is required",min:1}
        }
    ],
    totalPrice:{type:Number,required:"total price is required"},
    totalItems:{type:Number,required:"total items is required"},
    },{timestamps:true}
)

module.exports=mongoose.model('cart',cartModel)