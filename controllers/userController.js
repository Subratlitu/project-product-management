const userModel=require('../models/userModel')
const validUrl=require('../validators/validUrl')
const awsUploads=require("../awsUploads/imageUpload")
const aws = require("aws-sdk")
const bcrypt=require('bcrypt')
const jwt = require('jsonwebtoken');



const userRegister=async function(req,res){
    try{
    let profilePicture=req.files
    let requestBody=req.body

    if (profilePicture && profilePicture.length > 0) {
        var profileImage = await awsUploads.uploadFile(profilePicture[0])
    }
    else{return res.status(400).send({status:false,message:"please upload your profile picture"})}
    
    let {fname,lname,email,phone,password}=requestBody
    let address=JSON.parse(requestBody.address)
    if(!validUrl.isValid(fname)){
        res.status(400).send({status:false,message:"first name is required"})
        return
    }
    if(!validUrl.isValid(lname)){
        res.status(400).send({status:false,message:"last name is required"})
        return
    }
    if(!validUrl.isValid(email)){
        res.status(400).send({status:false,message:"email is required"})
        return
    }
    if(!validUrl.isValidEmail(email)){
        res.status(400).send({status:false,message:"enter a valid email address"})
        return
    }
    if(!validUrl.isValid(phone)){
        res.status(400).send({status:false,message:"phone is required"})
        return
    }
    if(!validUrl.isValidMobile(phone)){
        res.status(400).send({status:false,message:"please enter valid indian mobile number"})
        return
    }
    if(!validUrl.isValid(password)){
        res.status(400).send({status:false,message:"password is required"})
        return
    }
    if(!validUrl.isValidPassword(password)){
        res.status(400).send({status:false,message:"enter a password in between 8 and 15"})
        return
    }
    if(!validUrl.isValid(address.shipping.street)){
        res.status(400).send({status:false,message:"street is required"})
        return
    }
    if(!validUrl.isValid(address.shipping.city)){
        res.status(400).send({status:false,message:"city is required"})
        return
    }
    if(!validUrl.isValid(address.shipping.pincode)){
        res.status(400).send({status:false,message:"pincode is required"})
        return
    }
    if(!validUrl.isValid(address.billing.street)){
        res.status(400).send({status:false,message:"street is required"})
        return
    }
    if(!validUrl.isValid(address.billing.city)){
        res.status(400).send({status:false,message:"street is required"})
        return
    }
    if(!validUrl.isValid(address.billing.pincode)){
        res.status(400).send({status:false,message:"street is required"})
        return
    }

    let isalreadyExistEmail=await userModel.findOne({email:email})
    if(isalreadyExistEmail){
        res.status(400).send({status:false,message:"email is already exist"})
        return
    }
    let isalreadyExistphone=await userModel.findOne({phone:phone})
    if(isalreadyExistphone){
        res.status(400).send({status:false,message:"phone is already exist"})
        return
    }
    //password masking
    let saltRounds=10
    let salt=await bcrypt.genSalt(saltRounds)
    let hash=await bcrypt.hash(password,salt)
    password=hash

    const newUser={fname,lname,email,profileImage,phone,password,address}
    let userData=await userModel.create(newUser)
    return res.status(201).send({status:true,message:"data created successfully",data:userData})
}
catch (err) {
    console.log(err)
    return res.status(500).send({ status: false, message: err.message })
}

}


//login user
const userLogin=async function(req,res){
    try{
    let requestBody=req.body
    let {email,password}=requestBody

    

    if(!validUrl.isValid(email)){
        res.status(400).send({status:false,message:"email is required"})
        return
    }
    if(!validUrl.isValidEmail(email)){
        res.status(400).send({status:false,message:"enter a valid email address"})
        return
    }
    if(!validUrl.isValid(password)){
        res.status(400).send({status:false,message:"password is required"})
        return
    }
 

    let user=await userModel.findOne({email:email})

    if(!user){
        res.status(404).send({status:false,message:"user does not exist"})
        return
    }
    //decrypting password
    let isValidPassword= await bcrypt.compare(password,user.password)
    if(!isValidPassword){
        return res.status(400).send({status:false,message:"wrong password"})
    }


    let userId=user._id
    const token = jwt.sign({
        userId: userId,
        iat:Math.floor(Date.now()/1000),
        exp:Math.floor(Date.now()/1000)+10*60*60
     },"product-management-project");
    //res.setHeader('x-api-key',token);
    let selectData={
        userId,
        token
    }
    res.status(200).json({status:true,message:"user login succesfully", data:selectData});
    }
    catch(err){
        console.log(err)
        return res.status(500).send({ status: false, message: err.message })
    }
}

//get user data
const getUserDetails=async function(req,res){
    try{
    let params=req.params
    let {userId}=params
    if(!userId){
        res.status(400).send({status:false,message:"enter userid in params"})
        return
    }
    if(!validUrl.isValidObjectId(userId)){
        res.status(400).send({status:false,message:"enter a valid user id"})
        return 
    }
 
    let isUserId=await userModel.findOne({userId:userId})
    if(!isUserId){
        res.status(404).send({status:false,message:"user is not exists in our database"})
        return
    }
    return res.status(201).send({status:true,message:"User profile details",data:isUserId})
}
catch(err){
    console.log(err)
    return res.status(500).send({status:false,message:err.message})
}

}
// update user
const updatedUser=async function(req,res){
    try{
    //extracting userid from params
    let params=req.params
    let {userId}=params
    //validation of user id
    if(!userId){
        res.status(400).send({status:false,message:"enter userid in params"})
        return
    }
    if(!validUrl.isValidObjectId(userId)){
        res.status(400).send({status:false,message:"enter a valid user id"})
        return 
    }
    // checking wheather user is exist in db or not
    let isUserId=await userModel.findOne({userId:userId})
    if(!isUserId){
        res.status(404).send({status:false,message:"user is not exists in our database"})
        return
    }
    // creating a new object to update
    const updatedUserData={}
    //extracting profile picture and request body from request
    let profilePicture=req.files
    let requestBody=req.body
    if(!(requestBody && profilePicture)){
        return res.status(400).send({ status: false, message: 'please provide some data for upadte profile' })
    }
    if (profilePicture && profilePicture.length > 0) {
        var profileImage = await awsUploads.uploadFile(profilePicture[0])
        updatedUserData['profileImage']=profileImage
    }

    let {fname,lname,email,phone,password}=requestBody
    let address=JSON.parse(requestBody.address)
    // validation of keys and push in to new object 
    if(fname != null){
    if(!validUrl.isValid(fname)){
        return res.status(400).send({ status: false, message: 'please provide first Name' })
    }
    updatedUserData['fname']=fname
    }
    if(lname != null){
        if(!validUrl.isValid(lname)){
            return res.status(400).send({ status: false, message: 'please provide last Name' })
        }
        updatedUserData['lname']=lname
    }
    if(email != null){
        if(!validUrl.isValid(email)){
            return res.status(400).send({ status: false, message: 'please provide email' })
        }
        if(!validUrl.isValidEmail(email)){
            return res.status(400).send({ status: false, message: 'please provide valid email' })
        }
        let isEmail=await userModel.findOne({email:email})
        if(isEmail){
            return res.status(400).send({ status: false, message: ' email is already exist please provide another email' })
        }
        updatedUserData['email']=email
    }
    if(phone != null){
        if(!validUrl.isValid(phone)){
            return res.status(400).send({ status: false, message: 'please provide phone' })
        }
        if(!validUrl.isValidMobile(phone)){
            return res.status(400).send({ status: false, message: 'please provide valid mobile number' })
        }
        let isMobile=await userModel.findOne({phone:phone})
        if(isMobile){
            return res.status(400).send({ status: false, message: 'this phone number is already exist please provide another email' })
        }
        updatedUserData['phone']=phone
    }
    if(password != null){
        if(!validUrl.isValid(password)){
            return res.status(400).send({ status: false, message: 'please provide password' })
        }
        if(!validUrl.isValidPassword(password)){
            return res.status(400).send({ status: false, message: 'please provide valid password' })
        }
        let saltRounds = 10;
        let salt = await bcrypt.genSalt(saltRounds);
        let hash = await bcrypt.hash(dataForUpdates.password, salt);
        updatedUserData['password']=hash
    }
    if(address != null){
        if(address.shipping != null) {
            if(address.shipping.street != null) {
                if(!validUrl.isValid(address.shipping.street)) {
                    return res.status(400).send({ status: false, message: ' Please provide shipping street' })
                }
                updatedUserData['address.shipping.street'] = address.shipping.street
            }
    }

    if(address.shipping != null) {
        if(address.shipping.city != null) {
            if(!validUrl.isValid(address.shipping.city)) {
                return res.status(400).send({ status: false, message: ' Please provide shipping city' })
            }
            updatedUserData['address.shipping.city'] = address.shipping.city
        }
    }
    if(address.shipping != null) {
        if(address.shipping.pincode != null) {
            if(!validUrl.isValid(address.shipping.pincode)) {
                return res.status(400).send({ status: false, message: ' Please provide shipping pincode' })
            }
            updatedUserData['address.shipping.pincode'] = address.shipping.pincode
        }
   }
   if(address.billing != null) {
    if(address.billing.street != null) {
        if(!validUrl.isValid(address.billing.street)) {
            return res.status(400).send({ status: false, message: ' Please provide billing street' })
        }
        updatedUserData['address.billing.street'] = address.billing.street
    }
    }
    if(address.billing != null) {
        if(address.billing.city != null) {
            if(!validUrl.isValid(address.billing.city)) {
                return res.status(400).send({ status: false, message: ' Please provide billing city' })
            }
            updatedUserData['address.billing.city'] = address.billing.city
        }
    }
    if(address.billing != null) {
        if(address.billing.pincode != null) {
            if(!validUrl.isValid(address.billing.pincode)) {
                return res.status(400).send({ status: false, message: ' Please provide billing pincode' })
            }
            updatedUserData['address.billing.pincode'] = address.billing.pincode
        }
    }
}

const dataUser = await userModel.findByIdAndUpdate({ _id:userId },{ ...updatedUserData},{ new: true })
        return res.status(200).send({ status: true, message: "User profile updated", data:dataUser })
}
catch(err){
    console.log(err)
    return res.status(500).send({status:false,message:err.message})
}
 
}
    




module.exports={
    userRegister,
    userLogin,
    getUserDetails,
    updatedUser
}