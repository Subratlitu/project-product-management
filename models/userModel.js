const mongoose=require('mongoose');

const userModel=new mongoose.Schema({
    fname:{type:String,required:"first name is required"},
    lname:{type:String,required:"Last name is required"},
    email:{type:String,required:"email is required",trim:true,unique:true,lowercase:true},
    profileImage:{type:String,required:"profile picture is required"},
    phone:{type:String,required:"mobile number is required",unique:true},
    password:{type:String,required:"password is required",unique:true},
    address:{
        shipping:{
            street:{type:String,required:"street is required"},
            city:{type:String,required:"city is required"},
            pincode:{type:Number,required:"pincode is required"}
        },
        billing:{
            street:{type:String,required:"street is required"},
            city:{type:String,required:"city is required"},
            pincode:{type:Number,required:"pincode is required"}
        }
    }
},{timestamps:true})

module.exports=mongoose.model('user',userModel)