const cartModel = require("../models/cartModel.js")
const userModel = require("../models/userModel")
const productModel = require("../models/productModel")
const validation = require("../validations/validator.js")
const { findOne } = require("../models/cartModel.js")


// ========================================  Creating a Cart  ============================================//
const createCart = async function (req, res){
    try{
       let userId = req.params.userId
       let body = req.body
       let {cartId, productId} = body

       if(!validation.isValidBody(body)) return res.status(400).send({status : false, message : "Body cannot be empty!"})

       if(!validation.idMatch(userId)) return res.status(400).send({status : false, message : "Invalid UserId!"})
       let uniqueUser = await userModel.findOne({_id : userId})
       if(!uniqueUser) return res.status(404).send({status : false, message : "No user with such userId was found!"})


       if(!productId) return res.status(400).send({status : false, message : "Please provide with a productId!"})
       if(!validation.idMatch(productId)) return res.status(400).send({status : false, message : "ProductId is invalid!"})
       let uniqueProduct = await productModel.findOne({_id : productId})
       if(!uniqueProduct) return res.status(404).send({status : false, message : "No product with such productId was found!"})


       let cart = await cartModel.findOne({userId : userId})

       if(cartId){
        if(!validation.idMatch(cartId)) return res.status(400).send({status : false, message : "Invalid cartId!"})
        if(cart._id != cartId) return res.status(400).send({status : false, message : "The cartId in the request body doesn't match with cartId made by the user!"})
      }

      let data = {userId : userId, items : [], totalPrice : 0, totalItems : 0}
      if(!cart){

      let obj = {}
      obj["productId"] = productId
      obj["quantity"] = 1
      data.items.push(obj)
      data["totalPrice"] = uniqueProduct.price
      data["totalItems"] = 1
      
      let createCart = await cartModel.create(data)
      res.status(201).send({status : true, message : "Successfully created a cart!", data : createCart})
      }

      let items = cart.items
      for(let i=0; i<items.length; i++){
        if(items[i].productId == productId){
          items[i].quantity += 1
          cart.totalPrice = items[i].quantity*uniqueProduct.price  
          let updated = await cartModel.findOneAndUpdate({_id : cart._id}, {$set : {items : items, totalPrice : cart.totalPrice}}, {new : true})
          return res.status(200).send({status : true, message : "Successfully updated the cart, increased quantity!", data : updated})
        }
      }
         

      let newObj = {}
      newObj["productId"] = productId
      newObj["quantity"] = 1
      items.push(newObj)
      cart.totalPrice += uniqueProduct.price
      cart.totalItems += 1

      let finalData = await cartModel.findOneAndUpdate({_id : cart._id}, {$set : {items : items, totalPrice : cart.totalPrice, totalItems : cart.totalItems}}, {new : true})
      return res.status(200).send({status : true, message : "Product has been added in the cart!", data : finalData})

    }catch(error){
        res.status(500).send({message : error.message})
    }
}










// ========================================  Getting Cart Details  ============================================//

const getCart =async function(req, res){
    try{
    
    let userId = req.params.userId;
    if(!validation.idMatch(userId)) return res.status(400).send({status :false, message: "UserId is invalid"});
    
    let cartData = await cartModel.findOne({userId: userId, isDeleted: false}) //isDeleted ask Aaditya
    if(!cartData) return res.status(404).send({status: false, message: "No such cart found!"})
    else {
    return res.status(200).send ({status :true, message:"User product details", data: cartData})
    }
    }
    catch(error){
    
        res.status(500).send({status :false, message :error.message})
    }
    }






//========================================  Deleting Cart  ============================================//

const deleteCart = async function (req, res) {
    try {
      let userId = req.params.userId
  
      if (!validation.idMatch(userId)) {
        return res.status(400).send({ Status: false, msg: "Please provide valid userId!" })
      }
  
      let user = await userModel.findById(userId)
  
      if (!user) {
        return res.status(404).send({ Status: false, msg: "User not found!" })
      }
  
      let cart = await cartModel.findOne({userId})
      if (!cart) {
        return res.status(404).send({ Status: false, message: "No cart exists for this user!" })
      }
      if (cart.items.length == 0) {
        return res.status(400).send({ status: false, message: "Cannot delete empty cart!" });
      }
  
      let updatedCart = await cartModel.findOneAndUpdate({ userId }, { $set: { items: [], totalItems: 0, totalPrice: 0 } }, {new : true})
      return res.status(204).send({ status: true, message: "Cart deleted successfuly"})
  
  
    }
    catch (err) {
      return res.status(500).send({ Status: false, msg: err.message })
    }
  
  }
  
module.exports = {createCart, getCart, deleteCart}