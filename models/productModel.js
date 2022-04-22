const mongoose=require('mongoose')

const productModel=new mongoose.Schema(
    {
        title:{type:String,required:"title is required",unique:true},
        description:{type:String,required:"description is required"},
        price:{type:Number,required:"price is required"},
        currencyId:{type:String,required:"currency id is required",default:"INR"},
        currencyFormat:{type:String,required:true,default:"₹"},
        isFreeShipping:{type:Boolean,default:false},
        productImage:{type:String,required:"image is required"},
        style:{type:String},
        availableSizes:{type:[String],enum:["S","XS","M","X","L","XXL","XL"]},
        installments:{type:Number,default:0},
        deletedAt:{type:Date,default:null},
        isDeleted:{type:Boolean,default:false},

    },{timestamps:true}
)
module.exports=mongoose.model("product",productModel)