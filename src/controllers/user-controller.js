import { asyncHandler } from "../utils/asyncHandler.js";
import {apiError} from "../utils/ApiError.js"
import {User} from "../models/user-models.js"
import { uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler(async(req,res)=>{
    
    const {fullname , email , username , password } = req.body 

    console.log("email",email)

    if([
        fullname,
        email,
        username,
        password
    ].some((field)=> field?.trim()=== "")){
        throw apiError(400,"all fields are required")
    }
   const existedUser =  User.findOne({
        $or:[{username},{email}]
    })

    if(existedUser){
        throw new apiError(409,"user with email or username is already exusted")
    }
        const avatarLocalPath = req.files?.avatar[0]?.path;
        const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw  new apiError(400,"avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new apiError(400,"avatar file is required")
    }
    const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url|| "",
        email,
        password,
        username:username.toLowerCase()
    })

   const createUser = await User.findById(user._id).select(
    "-password -refreshToken"
   )

   if(!createUser){
    throw new apiError(500,"something went wrong while registriting new user")
   }

   return res.status(201).json(
    new ApiResponse(200,createUser,"user registred successfully")
   )
})

export {registerUser}