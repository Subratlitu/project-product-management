const cartModel=require("../models/cartModel")
const validUrl=require('../validators/validUrl')
const userModel=require('../models/userModel')
const productModel=require('../models/productModel')
const jwt=require("jsonwebtoken")





const addCart=async function(req,res){
    try {
        const userId = req.params.userId
        const requestBody = req.body
        const { productId, cartId } = requestBody

        if (Object.keys(requestBody).length == 0) return res.status(400).send({ status: false, message: "Plaes enter some data in request body" })

        if (!validUrl.isValid(productId)) return res.status(400).send({ status: false, message: "Plaes enter productId" })
        if (!validUrl.isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Plaes enter valid productId" })

        // Searching : user details 
        const isUserExist = await userModel.findOne({_id: userId })
        if (!isUserExist) return res.status(404).send({ status: false, message: "No user Found" })

        // Searching : Product details 
        const isProductExist = await productModel.findOne({_id:productId,isDeleted:false })
        if (!isProductExist) return res.status(400).send({ status: false, message: "Product Doesn't Exist" })

        // Searching : Cart details for user
        if (cartId) {
            if (!validUrl.isValid(cartId)) return res.status(400).send({ status: false, message: "Please enter cartId" })
            if (!validUrl.isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "Please enter valid cartId" })

            const isCartExist = await cartModel.findOne({_id: cartId })
            if (!isCartExist) return res.status(404).send({ status: false, message: "Cart Doesn't Exist" })

            //  CHECK : Logined User is Owner if the Cart or not
            if (isCartExist.userId != userId) return res.status(400).send({ status: false, message: "You are not owner of this Cart , please try with right cartId" })

        }

        //  CHECK : is product available
        if ( !isProductExist.installments > 0) return res.status(400).send({ status: false, message: "Product is out of stock" })

        //  Seaching in cart
        const isUserHasCart = await cartModel.findOne({ userId: userId })
        //if user having already a cart
        if (isUserHasCart) {
            let flag = false
            const price = await productModel.findOne({ _id: productId })
            // itreating over item array and checking wheather product is in items array or not
            for (let i = 0; i < isUserHasCart.items.length; i++) {
                if (isUserHasCart.items[i].productId == productId) {
                    flag = true
                    isUserHasCart.items[i].quantity = isUserHasCart.items[i].quantity + 1

                    if(isUserHasCart.items[i].quantity > isProductExist.installments) return res.status(400).send({ status: true, message: "No such Quantity Exist"})
                    const updateCart = {}
                    updateCart['items'] = isUserHasCart.items
                    updateCart['totalPrice'] = isUserHasCart.totalPrice + price.price
                    updateCart['totalItems'] = isUserHasCart.items.length

                    let cartData = await cartModel.findOneAndUpdate({ userId }, updateCart, { new: true })
                    return res.status(200).send({ status: true, message: "Cart already Exist : Adding item to Cart", data: cartData })
                }
            }
            //if product is not exist in items array
            if (flag == false) {

                const items = [{ productId, quantity: 1 }]
                const updateCart = { $addToSet: { items: items } }
                updateCart['$inc'] = {}
                updateCart['$inc']['totalPrice'] = price.price
                updateCart['$inc']['totalItems'] = 1

                let cartData = await cartModel.findOneAndUpdate({ userId }, updateCart, { new: true })
                return res.status(200).send({ status: true, message: "Cart already Exist : Adding item to Cart", data: cartData })
            }
        }
        //if cart is not exist for user
        if (!isUserHasCart) {
            const price = await productModel.findOne({ _id: productId })
            const newCart = {
                userId: userId,
                items: {
                    productId: productId,
                    quantity: 1
                },
                totalPrice: price.price,
                totalItems: 1
            }
            const createdCart = await cartModel.create(newCart)
            return res.status(200).send({ status: false, message: "Product is added in cart", data: createdCart })
        }
    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: err.message })
    }
}

const removeFromCart = async function(req,res) {
    try {
        const userId = req.params.userId
        const requestBody = req.body
        let { cartId, productId, removeProduct } = requestBody
        //validation of cart id
        if (!validUrl.isValid(cartId)) return res.status(400).send({ status: false, message: "Plaes enter cartId" })
        if (!validUrl.isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "Plaes enter valid cartId" })
        const isCartExist = await cartModel.findOne({ _id: cartId })
        if (!isCartExist) return res.status(404).send({ status: false, message: "Cart Doesn't Exist" })
        //validation of product id
        if (!validUrl.isValid(productId)) return res.status(400).send({ status: false, message: "Plaes enter productId" })
        if (!validUrl.isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Plaes enter valid productId" })
        const isProductExist = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!isProductExist) return res.status(400).send({ status: false, message: "Product Doesn't Exist" })

        if (!validUrl.isValid(removeProduct)) return res.status(400).send({ status: false, message: "Plaes enter removeProduct" })

        // Searching : user details 
        const userDetails = await userModel.find({ _id: userId })
        if (!userDetails.length > 0) return res.status(404).send({ status: false, message: "No user Found" })
        if (isCartExist.userId != userId) return res.status(404).send({ status: false, message: "You are not owner of this Cart , please try with right cartId" })
        // storing the product data in price variable
        const price = await productModel.findOne({ _id: productId })
        //if user want to reduce his quantity by 1
        if (removeProduct == "1") {
        for (let i = 0; i < isCartExist.items.length; i++) {
            if (isCartExist.items[i].productId == productId) {
                //if product is already in cart then decreasing its quantiy by 1
                isCartExist.items[i].quantity = isCartExist.items[i].quantity - 1
                //if the quantity of the product is zero then removing that product from whole cart
                    if (isCartExist.items[i].quantity == 0) {
                        let newItem = []
                        for (let i = 0; i < isCartExist.items.length; i++) {
                            if (isCartExist.items[i].productId == productId) continue
                            else {
                                let item = isCartExist.items[i]
                                newItem.push(item)
                            }
                        }
                        const updateCart = {}
                        updateCart['items'] = newItem
                        updateCart['totalPrice'] = isCartExist.totalPrice - price.price
                        updateCart['totalItems'] = isCartExist.items.length - 1
        
                        let cartData = await cartModel.findOneAndUpdate({ userId }, updateCart, { new: true })
                            return res.status(200).send({ status: true, message: "Product Removed From Your Cart", data: cartData })
                    }
                    const updateCart = {}
                    updateCart['items'] = isCartExist.items
                    updateCart['totalPrice'] = isCartExist.totalPrice - price.price
                    updateCart['totalItems'] = isCartExist.items.length

                    let cartData = await cartModel.findOneAndUpdate({ userId }, updateCart, { new: true })
                    return res.status(200).send({ status: true, message: "Product Quantity Decreased From Your Cart", data: cartData })
                }
            }
        }
        //if user want to remove the product
        if (removeProduct == "0") {
        for (let i = 0; i < isCartExist.items.length; i++) {
            if (isCartExist.items[i].productId == productId) {
            
                let newItem = []
                for (let i = 0; i < isCartExist.items.length; i++) {
                    if (isCartExist.items[i].productId == productId) continue
                    else {
                        let item = isCartExist.items[i]
                        newItem.push(item)
                    }
                }
                const updateCart = {}
                updateCart['items'] = newItem
                updateCart['totalPrice'] = isCartExist.totalPrice - (price.price) * ( isCartExist.items[i].quantity )
                updateCart['totalItems'] = isCartExist.items.length - 1

                let cartData = await cartModel.findOneAndUpdate({ userId }, updateCart, { new: true })
                return res.status(200).send({ status: true, message: "Product Removed From Your Cart", data: cartData })
            }
        }}
        return res.status(400).send({ status: true, message: "Product Doesn't Exist In Your Cart" })
    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: err.message })
    }
}
const getCartData = async (req, res) => {
    try {
        userId = req.params.userId

        // Searching : user details 
        const isUserExist = await userModel.findOne({ _id: userId, isDeleted: false })
        if (!isUserExist) return res.status(404).send({ status: false, message: "No user Found" })

        // Searching : user details 
        const CartDetails = await cartModel.findOne({ userId: userId, isDeleted: false })
        if (!CartDetails) return res.status(404).send({ status: false, message: "Cart Not Found" })

        return res.status(200).send({ status: false, message: "User's Cart details", data: CartDetails })
    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ status:true, message: err.message })
    }
}

//--- Add to Cart -------------------------------------------------------------------------------------------------------------------------------------------

const deleteAllDataFromCart = async (req, res) => {
    try {
        userId = req.params.userId

        // Searching : user details 
        const isUserExist = await userModel.findOne({ _id: userId, isDeleted: false })
        if (!isUserExist) return res.status(404).send({ status: false, message: "No user Found" })

        // Searching : user details 
        const isCartExist = await cartModel.findOne({ userId: userId, isDeleted: false })
        if (!isCartExist) return res.status(404).send({ status: false, message: "Cart Not Found" })

        const upadtes = {
            items: [],
            totalPrice: 0,
            totalItems: 0
        }
        const newCart = await cartModel.findOneAndUpdate({ userId }, upadtes, { new: true })
        return res.status(200).send({ status:true, message: "Cart Data Deleted ", data: newCart })
    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: err.message })
    }
}


module.exports={
    addCart,
    removeFromCart,
    getCartData,
    deleteAllDataFromCart
}