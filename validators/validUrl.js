const mongoose=require('mongoose')
const ObjectId=mongoose.Types.ObjectId

const isValid=function(value){
    if(typeof value==='undefined' || value===null)return false
    if(typeof value==='string'&& value.trim().length===0)return false
    return true;
}
// const isValidRequestBody=function(requestBody){
//     return Object.keys(requestBody).length>0
// }
const isValidEmail=function(email){
   return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)
}
const isValidMobile=function(phone){
    return /^(?:(?:\+|0{0,2})91(\s*|[\-])?|[0]?)?([6789]\d{2}([ -]?)\d{3}([ -]?)\d{4})$/.test(phone)
}
const isValidPassword=function(password){
    return (password.length>=8 && password.length<=15)
}
const isValidObjectId= function (a){
    if((ObjectId.isValid(a)))//checking for 12 bytes id in input value 
    {  
        let b =  (String)(new ObjectId(a))//converting input value in valid object Id
        
        if(b == a) //comparing converted object Id with input value
        {       
            return true;
        }else{
                return false;
            }
    }else{
        return false;
    }
}
const isNumber=function(str){
    return (/^\d+$/.test(str));
}
const isArray=function(arr){
    return Array.isArray(arr)
}
const isValidSize=function(arr){
    let enumValue = ["S","XS","M","X","L","XXL","XL"]
    for (let x of arr) {
        if (enumValue.includes(x) == false)  return false
    }
    return true;
}
module.exports={
isValid,
isValidEmail,
isValidMobile,
isValidPassword,
isValidObjectId,
isNumber,
isArray,
isValidSize
}