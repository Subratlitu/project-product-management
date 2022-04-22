const express = require('express');
const router = express.Router();

const userController=require('../controllers/userController')
const userAuthentication=require('../middlewares/userAuthentication')
const productController=require('../controllers/productController')
const cartController=require('../controllers/cartController')
const orderController=require('../controllers/orderController')

///////////////////
router.post('/register',userController.userRegister)
router.post('/login',userController.userLogin)
router.get('/user/:userId/profile',userAuthentication.authUser,userController.getUserDetails)
router.put('/user/:userId/profile',userAuthentication.authUser,userController.updatedUser)


///////////////////
router.post('/products',productController.createProduct)
router.get('/products',productController.getProductByFilter)
router.get('/products/:productId',productController.getProductById)
router.put('/products/:productId',productController.updateProducts)
router.delete('/products/:productId',productController.deleteProduct)

///////////////////
router.post('/users/:userId/cart',userAuthentication.authUser,cartController.addCart)
router.put('/users/:userId/cart',userAuthentication.authUser,cartController.removeFromCart)
router.get('/users/:userId/cart',userAuthentication.authUser,cartController.getCartData)
router.delete('/users/:userId/cart',userAuthentication.authUser,cartController.deleteAllDataFromCart)

///////////////////

router.post('/users/:userId/orders',userAuthentication.authUser,orderController.createOrder)
router.put('/users/:userId/orders',userAuthentication.authUser,orderController.updateOrder)
module.exports=router