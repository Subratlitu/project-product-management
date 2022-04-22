const jwt=require("jsonwebtoken")
const validUrl=require('../validators/validUrl')

const authUser=async function(req,res,next){
    try{
    let token = req.headers['authorization']
    
    token=token && token.split(" ")[1]
    if(!token){
        return res.status(400).send({status:false, msg: "Token is Missing!"});
    }
    const userId=req.params.userId
    if(Object.keys(userId)==0){
        return res.status(400).send({status:false,message:"please provide user id in params"})
    }
    if(!validUrl.isValidObjectId(userId)){
        return res.status(400).send({status:false,message:"please provide valid user id in params"})
    }

    let decodedToken = jwt.verify(token,'product-management-project');
    
     if(!decodedToken){
        return res.status(401).send({status:false,message:"invalid token"})
     }
     let time = Math.floor(Date.now() / 1000)
        if (decodedToken.exp < time) {
            return res.status(401).send({ status: false, message: "token expired, please login again" });
        }
     if(userId !==decodedToken.userId){
        return res.status(403).send({status:false,message:"you have not authorised to access this"})
     }
     next()
    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: error.message })
    }

}
module.exports={authUser}