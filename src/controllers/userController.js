const userModel = require('../models/userModel')
const aws = require("aws-sdk")
const bcrypt = require('bcrypt');
const upload = require('../.aws/config')
const mongoose = require('mongoose');
const validation = require("../validations/validator.js")
const jwt = require("jsonwebtoken")




//====================================  Creating Users  ======================================//

const createUser = async function (req, res) {
   try{
    let data = req.body;

    const { fname, lname, email, phone, password, address } = data;

    if (!validation.isValidBody(data)) {
        return res.status(400).send({ status: false, msg: "Please provide data in the request body!" })
    }

    if(!fname) return res.status(400).send({status : false, message : "First Name is required!"})
    if (!validation.isValid(fname) && !validation.alphabetTestOfString(fname)) {
        return res.status(400).send({ status: false, msg: "fname is invalid" })
    }

    if(!lname) return res.status(400).send({status : false, message : "Last Name is required!"})
    if (!validation.isValid(lname) && !validation.alphabetTestOfString(lname)) {
        return res.status(400).send({ status: false, msg: "lname is invalid" })
    }

    if(!email) return res.status(400).send({status : false, message : "Email is required!"})
    if (!validation.isValidSyntaxOfEmail(email)) {
        return res.status(400).send({ status: false, msg: "Email is invalid!" })
    }
    let userEmail = await userModel.findOne({ email : email })
    if (userEmail)
        return res.status(401).send({ status: false, msg: "This email address already exists, please enter a unique email address!" })


    if(!phone) return res.status(400).send({status : false, message : "Phone number is required!"})
    if (!validation.isValidMobileNum(phone)) {
        return res.status(400).send({ status: false, msg: "Phone is invalid" })
    }
    let userNumber = await userModel.findOne({ phone: phone })
    if (userNumber)
        return res.status(409).send({ status: false, msg: "This phone number already exists, please enter a unique phone number!" })

    if(!password) return res.status(400).send({status : false, message : "Password is required!"})
    if (!validation.isValidPassword(password)) {
        return res.status(400).send({ status: false, msg: "Password should be strong, please use one number, one upper case, one lower case and one special character and characters should be between 8 to 15 only!" })
    }

    const salt = await bcrypt.genSalt(10)
    data.password = await bcrypt.hash(data.password, salt)


    if(!address.shipping.street) return res.status(400).send({status : false, message : "Shipping Street is required!"})
    if (!validation.isValid(address.shipping.street)) {
        return res.status(400).send({ status: false, msg: "Invalid shipping street!" })
    }

    if(!address.shipping.city) return res.status(400).send({status : false, message : "Shipping City is required!"})
    if (!validation.isValid(address.shipping.city)) {
        return res.status(400).send({ status: false, msg: "Invalid shipping city!" })
    }

    if(!address.shipping.pincode) return res.status(400).send({status : false, message : "Shipping Pincode is required!"})
    if (!validation.isValidPinCode(address.shipping.pincode)) {
        return res.status(400).send({ status: false, msg: "Invalid shipping pincode!" })
    }

    if(!address.billing.street) return res.status(400).send({status : false, message : "Billing Street is required!"})
    if (!validation.isValid(address.billing.street)) {
        return res.status(400).send({ status: false, msg: "Invalid billing street!" })
    }

    if(!address.billing.city) return res.status(400).send({status : false, message : "Billing City is required!"})
    if (!validation.isValid(address.billing.city)) {
        return res.status(400).send({ status: false, msg: "Invalid billing city!" })
    }

    if(!address.billing.pincode) return res.status(400).send({status : false, message : "Billing Pincode is required!"})
    if (!validation.isValidPinCode(address.billing.pincode)) {
        return res.status(400).send({ status: false, msg: "Invalid billing pincode!" })
    }



    let files = req.files
    if (files && files.length > 0) {
      
        let uploadedFileURL = await upload.uploadFile(files[0])
      
        data.profileImage = uploadedFileURL;
    }
    else {
        res.status(400).send({ msg: "Files are required!" })
    }
    const document = await userModel.create(data)
    res.status(201).send({ status: true, data: document })

}catch(error){
    res.status(500).send({message : error.message})
}
}






//========================================  Logging In The User  ==========================================//

const loginUser = async function (req, res) {
    try {
        let data = req.body
        let email = req.body.email;
        let password = req.body.password;

        if (!validation.isValidBody(data)) {
            return res.status(400).send({ status: false, Msg: "Body cannot be empty" })
        }


        if(!email){
            return res.status(400).send({status : false, message : "Email is required!"})
        }
        if(!validation.isValidSyntaxOfEmail(email)){
            return res.status(400).send({status : false, message : "Invalid email format!"})
        }
        let userE = await userModel.findOne({ email: email});
        if (!userE) {
            return res.status(401).send({ status: false, message: "Email Is incorrect!" });
        }



        if (!password) {
            return res.status(400).send({ status: false, message: "Password is required!" })
        }
        if(!validation.isValidPassword(password)){
            return res.status(400).send({status : false, message : "Invalid password format!"})
        }
        

        let iat = Math.floor(Date.now() / 1000)
        let exp = iat + (60 * 60)
        let token = jwt.sign(
            { _id: userE._id.toString(), 
            iat: iat, 
            exp: exp 
        }, "Group-58");
        res.setHeader("x-api-key", token);

        res.status(200).send({status: true, message: "User login successfull", data: {userId : userE._id,token: token}});

    } catch (err) {
        res.status(500).send({ staus: false, msg: err.message })
    }
}






//===========================================  Getting User By UserId  =========================================//

const getUser = async function (req, res) {
    try {
        const userParams = req.params.userId.trim()
        if (!validation.idMatch(userParams)) {
            return res.status(400).send({ status: false, message: "Invalid userId, please enter a correct objectId" })
        }
       
        const findUser = await userModel.findOne({ _id: userParams })
        if (!findUser) {
            return res.status(404).send({ status: false, message: `User does not exists!` })
        }
        
        if (findUser) { 
            return res.status(200).send({ status: true, msg: "User profile details", data: findUser })

        }
        else {
            return res.status(403).send({ Status: false, msg: "User not authorized to access requested id" })
        }

    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}






    
//==========================================  Updating User  =========================================//

const updateUser = async function(req, res){
    try{
    let userId =req.params.userId;
    let data = req.body;
    let files = req.files
    
    let{
       fname, lname, email, phone, password, address
    } = data
    
    if(!validation.idMatch(userId)) return res.status(400).send({status :false,message: "UserId is invalid"});
    
    let verifyUser= await userModel.findOne({_id :userId})
    if (!verifyUser)  return res.status(404).send({status :false, message:`This userId: ${userId} doesn't exist`});
    
    if (userId!=verifyUser._id)return res.status(401).send({status :false,message: "User is not Authorized"});
    
    if (!validation.isValidBody(data)) {
        return res.status(400).send({ status: false, msg: "Please provide data in request body" })
    }

       if(files){
        if (files && files.length!= 0) {
          
            let uploadedFileURL = await upload.uploadFile(files[0])
          verifyUser.profileImage = uploadedFileURL;
    } 
}

    if (fname) {
        if (!validation.isValid(fname)) {
            return res.status(400).send({ status: false, message: "First name is not Valid" })
        }
    }
       verifyUser.fname = fname
    
    if (lname) {
        if (!validation.isValid(lname)) {
            return res.status(400).send({ status: false, msg: "Last name is not Valid" })
        }
    }  verifyUser.lname = lname
    
    if (email) {
        if (!validation.isValidSyntaxOfEmail(email)) {
            return res.status(400).send({ status: false, msg: "Email is invalid" })
        }
        let uniqueEmail = await userModel.findOne({ email: email })
        if (uniqueEmail) {
            return res.status(409).send({ status: false, msg: "This email already exists, please try another one." })
        }
    } verifyUser.email = email
    
    
    
    if (phone) {
        if (!validation.isValidMobileNum(phone)) {
            return res.status(400).send({ status: false, msg: "phone is invalid" })
        }
        let uniquePhone = await userModel.findOne({ phone: phone })
        if (uniquePhone) {
            return res.status(409).send({ status: false, message: "This phone number already exists, please try another one." })
        } verifyUser.phone = phone
    }
    
        if (password) {
            if (!validation.isValidPassword(password)) {
                return res.status(400).send({ status: false, message: "Password should be strong. Please use one digit, one upper case, one lower case, one special character, an in between 8 to 15 characters only!" })
                
            }
            else {let saltRounds = await bcrypt.genSalt(10)
                password = await bcrypt.hash(password, saltRounds)
                verifyUser.password = password
               
    
            }
        }
    
            if (address) {
                if (validation.isValidBody(address)) return res.status(400).send({ status: false, message: "Please enter address and it should be in object!" })       
                if (address.shipping) {
                    if (address.shipping.street) {
                        if (!validation.streetRegex) {
                            return res.status(400).send({ status: false, message: "Invalid Shipping street" })
                        } verifyUser.address.shipping.street = address.shipping.street
                    }
    
                    if (address.shipping.city) {
                        if (!validation.cityRegex(address.shipping.city)) {
                            return res.status(400).send({ status: false, message: "Invalid Shipping city" })
                        } verifyUser.address.shipping.city = address.shipping.city
                    }
    
                    if (address.shipping.pincode) {
                        if (!validation.isValidPinCode(address.shipping.pincode)) {
                            return res.status(400).send({ status: false, message: "Invalid Shipping pincode" })
                        }verifyUser.address.shipping.pincode = address.shipping.pincode
                    }
                }
    
                if (address.billing) {
                    if (address.billing.street) {
                        if (!validation.streetRegex(address.billing.street)) {
                            return res.status(400).send({ status: false, message: "Invalid billing street" })
                        } verifyUser.address.billing.street = address.billing.street
                    }
    
                    if (address.billing.city) {
                        if (!validation.cityRegex(address.billing.city)) {
                            return res.status(400).send({ status: false, message: "Invalid billing city" })
                        } verifyUser.address.billing.city = address.billing.city
                    }
    
                    if (address.billing.pincode) {
                        if (!validation.isValidPinCode(address.billing.pincode)) {
                            return res.status(400).send({ status: false, message: "Invalid billing pincode" })
                        } verifyUser.address.billing.pincode = address.billing.pincode
                    }
                }
            }
            verifyUser.save()
            res.status(200).send({ status: true, message: "User profile details", data: verifyUser })
        }
    
        catch(error) {
            console.log(error)
            res.status(500).send({ status: false, message: error.message })
    
        
    
    }
    }


module.exports = {createUser, loginUser, getUser, updateUser}