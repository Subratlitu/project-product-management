const validUrl=require('../validators/validUrl')
const productModel=require("../models/productModel")
const aws = require("aws-sdk")
const jwt = require('jsonwebtoken');
const awsUploads=require("../awsUploads/imageUpload")


const createProduct=async function(req,res){
    try {
        const data = req.body
        const productImage = req.files
        const product = {}
        
        const { title,description,currencyId,currencyFormat,isFreeShipping,style} = data

        //  CHECK : if request body is empty
        if (!Object.keys(data).length > 0) return res.status(400).send({ status: false, error: "Please enter data" })

        //  CHECK : if any data field is empty
        if (!validUrl.isValid(title)) return res.status(400).send({ status: false, message: 'please provide title' })
        product['title'] = title

        if (!validUrl.isValid(description)) return res.status(400).send({ status: false, message: 'please provide description' })
        product['description'] = description

        if (!validUrl.isValid(data.price)) return res.status(400).send({ status: false, message: 'please provide price' })
        if(!validUrl.isNumber(data.price) ) return res.status(400).send({ status: false, message: 'please provide price in digits' })
        product['price'] = data.price


        if (isFreeShipping != null) {
            if (!(isFreeShipping == "true" || isFreeShipping == "false")) return res.status(400).send({ status: false, message: 'please provide valid isFreeShipping(true / false)' })
            if (isFreeShipping == "true") newData['isFreeShipping'] = true
            else newData['isFreeShipping'] = false
        }
        if (style != null) {
            if (!validUrl.isValid(style)) return res.status(400).send({ status: false, message: 'please provide style' })
            product['style'] = style
        }
        if (data.installments != null) {
            if (!validUrl.isValid(data.installments)) return res.status(400).send({ status: false, message: 'please provide installments' })
            if (!validUrl.isNumber(data.installments)) return res.status(400).send({ status: false, message: 'please provide installments in digits' })
            product['installments'] = data.installments
        }
        if (currencyId != null) {
            if (!validUrl.isValid(currencyId)) return res.status(400).send({ status: false, message: 'please provide currencyId' })
            if (currencyId != "INR") return res.status(400).send({ status: false, message: 'please provide valid currencyId' })
            product['currencyId'] = currencyId
        }
        else product['currencyId'] = "INR"
        if (currencyFormat != null) {
            if (!validUrl.isValid(currencyFormat)) return res.status(400).send({ status: false, message: 'please provide currencyFormat' })
            if (currencyFormat != "₹") return res.status(400).send({ status: false, message: 'please provide valid currencyFormat' })
            product['currencyFormat'] = currencyFormat
        }
        else product['currencyFormat'] = "₹"

        if (!data.availableSizes) return res.status(400).send({ status: false, message: 'please provide Sizes'})
        availableSizes = JSON.parse(data.availableSizes)
        if (!validUrl.isArray(availableSizes)) return res.status(400).send({ status: false, message: 'please provide Sizes in Array ' })
        if (!validUrl.isValidSize(availableSizes)) return res.status(400).send({ status: false, message: 'please provide valid Sizes' })
        product['availableSizes'] = availableSizes

        const isTitleAlreadyUsed = await productModel.findOne({ title })
        if (isTitleAlreadyUsed) return res.status(400).send({ status: false, message: "This  is title already in use,please provide another title" })

        //  Create : aws link for profile image
        if (productImage && productImage.length > 0) var uploadedFileURL = await awsUploads.uploadFile(productImage[0])
        else return res.status(400).send({ status: false, message: 'please provide product image' })
        product['productImage'] = uploadedFileURL

        //  SETTING : defaults
        // product['isDeleted'] = false
        // product['deletedAt'] = ""

        const createdUser = await productModel.create(product)
        res.status(201).send({ status: true, message: "User created successfully", data: createdUser })
    }
    catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }

}

const getProductByFilter = async (req, res) => {
    try {
        const filters = req.query
        const finalFilters = {isDeleted:false }

        const { name, size, priceGreaterThan, priceLessThan, priceSort } = filters

        if (name != null) {
            if (!validUrl.isValid(name)) return res.status(400).send({ status: false, message: "Please enter Product name" })
            //console.log( {$regex: `.${name.trim()}.`})
            finalFilters['title'] = {$regex: `${name.trim()}`}
        }
        if (size != null) {
            if (!validUrl.isValid(size)) return res.status(400).send({ status: false, message: "Please enter size" })
            if (!validUrl.isValidSize(size)) return res.status(400).send({ status: false, message: "Please enter valid size" })
            finalFilters['availableSizes'] = { $in: [size.toLowerCase(), size.toUpperCase()] }
        }

        if (priceLessThan != null && priceGreaterThan != null) {
            if (!validUrl.isValid(priceLessThan)) return res.status(400).send({ status: false, message: "Please enter priceLessThan" })
            if (!validUrl.isNumber(priceLessThan)) return res.status(400).send({ status: false, message: "Please enter priceLessThan in digits" })
            if (!validUrl.isValid(priceGreaterThan)) return res.status(400).send({ status: false, message: "Please enter priceGreaterThan" })
            if (!validUrl.isNumber(priceGreaterThan)) return res.status(400).send({ status: false, message: "Please enter priceGreaterThan in digits" })
            if (priceGreaterThan > priceLessThan) return res.status(400).send({ status: false, message: "priceGreaterThan cannot be greater than priceLessThan" })
            finalFilters['price'] = { $lte: priceLessThan, $gte: priceGreaterThan }
        }
        else if (priceGreaterThan != null) {
            if (!validUrl.isValid(priceGreaterThan)) return res.status(400).send({ status: false, message: "Please enter priceGreaterThan" })
            if (!validUrl.isNumber(priceGreaterThan)) return res.status(400).send({ status: false, message: "Please enter priceGreaterThan in digits" })
            let x = parseInt(priceGreaterThan)
            finalFilters['price'] = { $gte: x }
        }
        else if (priceLessThan != null) {
            if (!validUrl.isValid(priceLessThan)) return res.status(400).send({ status: false, message: "Please enter priceLessThan" })
            if (!validUrl.isNumber(priceLessThan)) return res.status(400).send({ status: false, message: "Please enter priceLessThan in digits" })
            finalFilters['price'] = { $lte: priceLessThan }
        }

        if (priceSort != null) {
            if (!(priceSort == "1" || priceSort == "-1")) return res.status(400).send({
                status: false,
                message: "Please enter valid input for sorting in price ....... 1 : for ascending order or -1 : for descending order "
            })

            if (priceSort == "1") {
                const allProducts = await productModel.find(finalFilters).select({
                    title: 1, description: 1, price: 1, currencyFormat: 1, currencyId: 1, isFreeShipping: 1, productImage: 1, style: 1, availableSizes: 1, installments: 1, _id: 0
                }).sort({ price: 1 })
                if (allProducts.length == 0) return res.status(404).send({ status: false, message: "Product not Found" })
                return res.status(200).send({ status: true, message: "Product List", data: allProducts })
            }
            else if (priceSort == "-1") {
                const allProducts = await productModel.find(finalFilters).select({
                    title: 1, description: 1, price: 1, currencyFormat: 1, currencyId: 1, isFreeShipping: 1, productImage: 1, style: 1, availableSizes: 1, installments: 1, _id: 0
                }).sort({ price: -1 })
                if (allProducts.length == 0) return res.status(404).send({ status: false, message: "Product not Found" })
                return res.status(200).send({ status: true, message: "Product List", data: allProducts })
            }
        }

        const allProducts = await productModel.find(finalFilters).select({
            title: 1, description: 1, price: 1, currencyFormat: 1, currencyId: 1, isFreeShipping: 1, productImage: 1, style: 1, availableSizes: 1, installments: 1, _id: 0
        }).sort({ price: 1 })

        if (allProducts.length == 0) return res.status(404).send({ status: false, message: "Product not Found" })

        return res.status(200).send({ status: true, message: "Product List", data: allProducts })

    }
    catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}

const getProductById=async function(req,res){
    try{
    let params=req.params
    if(params == null){
        return res.status(400).send({status:false,message:"please enter id in params"})
    }
    let {productId}=params
    if(!validUrl.isValid(productId)){
        return res.status(400).send({status:false,message:"please enter product id in params"})
    }
    if(!validUrl.isValidObjectId(productId)){
        return res.status(400).send({status:false,message:"enter a valid object id"})
    }
    let product=await productModel.findOne({_id:productId,isDeleted:false})
    if(!product){
        return res.status(404).send({status:false,message:"product is not found"})
    }
    return res.status(200).send({ status: true, message: "Product", data:product })

}
catch (err) {
    console.log(err)
    res.status(500).send({ status: false, message: err.message })
}

}

const updateProducts=async function(req,res){
    try{
    let params=req.params

    let {productId}=params
    if (Object.keys(productId) == 0) return res.status(400).send({ status: false, message: "Please enter productId in path param....." })
    
    if(!validUrl.isValidObjectId(productId)){
        return res.status(400).send({status:false,message:"enter a valid object id"})
    }
    let product=await productModel.findOne({_id:productId,isDeleted:false})
    if(!product){
        return res.status(404).send({status:false,message:"product is not exist in our database"})
    }
    let updatedData={}
    //extracting product picture and request body from request
    let productPicture=req.files
    let requestBody=req.body
    
    if (productPicture && productPicture.length > 0) {
        var profileImage = await awsUploads.uploadFile(productPicture[0])
        updatedData['profileImage']=profileImage
    }
    let {title,description,price,currencyId,currencyFormat,isFreeShipping,style,availableSizes,installments,deletedAt,isDeleted}=requestBody

    if(title != null){
        if(!validUrl.isValid(title)){
            return res.status(400).send({ status: false, message: 'please provide title' })
        }
        let isTitle=await productModel.findOne({title:title})
        if(isTitle){
            return res.status(400).send({ status: false, message: 'title is already exist' })
        }
        updatedData['title']=title
    }
    if(description != null){
        if(!validUrl.isValid(description)){
            return res.status(400).send({ status: false, message: 'please provide description' })
        }
        updatedData['description']=description
    }
    if(price != null){
        if(!validUrl.isValid(price)){
            return res.status(400).send({ status: false, message: 'please provide price' })
        }
        if(!validUrl.isNumber(price)){
            return res.status(400).send({status:false,message:"please enter price in number"})
        }
        updatedData['price']=price
    }
    if(currencyId != null){
        if(!validUrl.isValid(currencyId)){
            return res.status(400).send({ status: false, message: 'please provide currency id' })
        }
        updatedUserData['currencyId']=currencyId
    }
    if(currencyFormat != null){
        if(!validUrl.isValid(currencyFormat)){
            return res.status(400).send({ status: false, message: 'please provide currency format' })
        }
        updatedData['currencyFormat']=currencyFormat
    }
    if(isFreeShipping != null){
        if(!validUrl.isValid(isFreeShipping)){
            return res.status(400).send({ status: false, message: 'please provide is free shipping' })
        }
        if(!(isFreeShipping==true || false)){
            return res.status(400).send({status:false,message:"please provide a boolean value in free shipping"})
        }
        updatedData['isFreeShipping']=isFreeShipping
    }
    if(style != null){
        if(!validUrl.isValid(style)){
            return res.status(400).send({ status: false, message: 'please provide style' })
        }
        updatedData['style']=style
    }
    if(availableSizes != null){
        if(!validUrl.isValid(availableSizes)){
            return res.status(400).send({ status: false, message: 'please provide available size' })
        }
        availableSizes = JSON.parse(availableSizes)
        if (!validUrl.isArray(availableSizes)) return res.status(400).send({ status: false, message: 'please provide Sizes in Array ' })
        if (!validUrl.isValidSize(availableSizes)) return res.status(400).send({ status: false, message: 'please provide valid Sizes' })
        updatedData['availableSizes']=availableSizes
    }
    if(installments != null){
        if(!validUrl.isValid(installments)){
            return res.status(400).send({ status: false, message: 'please provide installments' })
        }
        updatedData['installments']=installments
    }
    if(deletedAt != null){
        if(!validUrl.isValid(deletedAt)){
            return res.status(400).send({ status: false, message: 'please provide style' })
        }
        updatedData['deletedAt']=deletedAt
    }
    if(isDeleted != null){
        if(!validUrl.isValid(isDeleted)){
            return res.status(400).send({ status: false, message: 'please provide style' })
        }
        if(!(isDeleted==true || false)){
            return res.status(400).send({status:false,message:"please provide a boolean value in is deleted"})
        }
        updatedData['isDeleted']=isDeleted
    }

    let newData=await productModel.findByIdAndUpdate({_id:productId},{...updatedData},{new:true})
    //console.log(newData)
    return res.status(200).send({status:true,message:"data updated successfully",data:newData})
}
catch (err) {
    console.log(err)
    res.status(500).send({ status: false, message: err.message })
}

}

const deleteProduct=async function(req,res){
    try{
    let params=req.params
    if(params == null){
        return res.status(400).send({status:false,message:"please enter product id in params"})
    }
    let {productId}=params
    if(!validUrl.isValid(productId)){
        return res.status(400).send({status:false,message:"please enter product id in params"})
    }
    if(!validUrl.isValidObjectId(productId)){
        return res.status(400).send({status:false,message:"enter a valid object id"})
    }
    let deleteData=await productModel.findOneAndUpdate({_id:productId},{isDeleted:true})
    return res.status(200).send({status:true,message:"deleted successfully",data:deleteData})
}
catch (err) {
    console.log(err)
    res.status(500).send({ status: false, message: err.message })
}
}


module.exports={
    createProduct,
    getProductByFilter,
    getProductById,
    updateProducts,
    deleteProduct
}
