const cartModel = require("../models/cartModel")
const productModel = require("../models/productModel")
const userModel = require("../models/userModel")
const orderModel = require("../models/orderModel")
const validUrl = require("../validators/validUrl")


const createOrder = async (req, res) => {
    try{
        const userId = req.params.userId;

        const requestBody = req.body
        if(Object.keys(requestBody)==0){ return res.status(400).send({ status: false, message: 'Please provide request Body'})}
        const { items,cancellable,status,deletedAt } = requestBody

        const finalData = {}
        // user validation
        if(Object.keys(userId)==0) return res.status(400).send({ status: false, message: 'Please provide user Id'})
        if(!validUrl.isValidObjectId(userId)) return res.status(400).send({ status: false, message: 'Please provide a valid user Id'})

        const userMatch = await userModel.findOne({_id:userId})
        if(!userMatch) return res.status(404).send({ status: false, message: `No user found with this id ${userId}`})

        //  CHECK : is product available

        let totalPrice = 0
        let totalItems = items.length
        let totalQuantity = 0
        //itreating over items array and performing some validation
        for( let i=0 ; i<items.length ; i++){
            //validation of product id
            if(!validUrl.isValid(items[i].productId)) return res.status(400).send({ status: false, message: `Please provide productId at position ${i+1}`})
            if(!validUrl.isValidObjectId(items[i].productId)) return res.status(400).send({ status: false, message: `Please provide Valid productId at position ${i+1}`})

            let isProductAvailable = await productModel.findOne({_id : items[i].productId})
            //checking if the product is available os not
            if(!isProductAvailable) return res.status(400).send({ status: false, message: `Product doesn't Exist for ProductId ${items[i].productId} at position ${i+1}`})
            if(!isProductAvailable.installments > 0)  return res.status(400).send({ status: false, message: `Product with ProductId ${items[i].productId} at position ${i+1} is OUT OF STOCK`})

            if(!items[i].quantity > 0) return res.status(400).send({ status: false, message: `Please provide min 1 quantity at position ${i+1}`})

            if(!(isProductAvailable.installments >= items[i].quantity))  return res.status(400).send({ status: false, message: `Product with ProductId ${items[i].productId} at position ${i+1} has Not Such Quantity`})
            //calculating totalprice and totalquantity
            totalPrice = totalPrice + ( isProductAvailable.price * items[i].quantity)
            totalQuantity = totalQuantity + items[i].quantity
            //decreasing installments by 1 as the product is going to be order
            const updateProductDetails = await productModel.findOneAndUpdate(items[i].productId , {$inc: {installments: -items[i].quantity} })
        }
        //adding to keys and values to a new object
        finalData["userId"] = userId
        finalData["items"] = items
        finalData["totalPrice"] = totalPrice
        finalData["totalItems"] = totalItems
        finalData["totalQuantity"] = totalQuantity
        if(status != null){
            if(!validUrl.isValid(status)) return res.status(400).send({status:false,message:'please provide status'})
            if(!(status=="pending"|| status=="completed"||status=="cancelled")) return res.status(400).send({status:false,message:'please provide valid value in status'})
            finalData["status"]=status
        }
        else{
            finalData["status"] = "pending"
        }
        if(deletedAt!= null){
            if(!validUrl.isValid(deletedAt)) return res.status(400).send({status:false,message:'please provide deleted date'})
            finalData["deletedAt"]=deletedAt
        }
        
        finalData["isDeleted"] = false

        if(cancellable!=null) finalData["cancellable"] = cancellable
        
        const order = await orderModel.create(finalData)
        return res.status(201).send({status: true, message: "Order details", data: order})
     }
     catch(error){
         return res.status(500).send({ status: false, message: error.message })
     }
}


const updateOrder =async (req, res) => {
    try{
        userId = req.params.userId;
        const dataForUpdates = req.body
        let finalUpdates = {}
        //validation starts
        if(Object.keys(userId)==0){ return res.status(400).send({ status: false, message: 'Please provide user Id'})}

        if(Object.keys(dataForUpdates)==0){ return res.status(400).send({ status: false, message: 'Please provide some data for update'})}
        const {orderId, status, isDeleted} = dataForUpdates
        //validation start
        if(!validUrl.isValid(orderId)) return res.status(400).send({ status: false, message: 'Please provide an order Id'})
        if(!validUrl.isValidObjectId(userId)) return res.status(400).send({ status: false, message: 'Please provide a valid user Id'})
        if(!validUrl.isValidObjectId(orderId)) return res.status(400).send({ status: false, message: 'Please provide a valid orderId'})
        //checking user is exist or not
        const userMatch = await userModel.findOne({_id:userId})
        if(!userMatch) return res.status(404).send({ status: false, message: `No user found with this id ${userId}`})
        //checking order is exist or not
        const orderMatch = await orderModel.findOne({_id: orderId , isDeleted: false})
        if(!orderMatch) return res.status(404).send({ status: false, message: `No order found with this id ${orderId}`})
        //checking wheather user is the owner of the order or not
        const isUsersOrder = await orderModel.findOne({_id:orderId, userId: userId ,isDeleted: false})
        if(!isUsersOrder) return res.status(400).send({ status: false, message: "Login User is not the owner of the order"})

        if(status==null && isDeleted==null) return res.status(400).send({ status: false, message: "Please Provide Order Status or Order isDeleted to Update The Order"})
        //updating keys and  values with new object
        if (status != null) {
            if(!validUrl.isValid(status)) return res.status(400).send({ status: false, message: "Please Provide Order Status"})
            if(!(status=="pending"|| status=="completed"||status=="cancelled")) return res.status(400).send({ status: false, message: "Please Provide Valid Order Status"})
            finalUpdates["status"] = status
        }
        //if user want to change the value of the is deleted key
        if (isDeleted != null) {
       
            if(orderMatch.cancellable == true){
            finalUpdates["isDeleted"] = isDeleted
            finalUpdates["deletedAt"] = new Date()

            const order = await orderModel.findOneAndUpdate({_id: orderId}, {...finalUpdates}, {new: true})

            const items = orderMatch.items
            // user cancel the order so its increasing installments by 1
            for(let i=0 ; i<items.length ; i++){
                const updateProductDetails = await productModel.findOneAndUpdate(items[i].productId , {$inc: {installments: items[i].quantity} })
            }
            return res.status(200).send({status: true, message: "Order details Updated", data: order})
            }
        }
        return res.status(400).send({ status: false, message: "Cannot Cancel This Order, Because It's Not A Cancellable Order"})
    }
    catch(error){
        return res.status(500).send({ status: false, message: error.message })
    }
}

module.exports.createOrder = createOrder
module.exports.updateOrder = updateOrder