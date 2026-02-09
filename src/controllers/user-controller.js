import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/ApiError.js";
import { User } from "../models/user-models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";



const generateAccessAndRefrshToken = async(userId)=>{
    try{
        const user= await User.findById(userId)

        const accessToken = user.generateAccessAndRefrshToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false});

        return {accessToken , refreshToken}
    }
    catch(error)
    {
        throw new apiError(500 , "something went worng while generating refresh and access token")
    }
}


const registerUser = asyncHandler(async (req, res) => {

    const { fullname, email, username, password } = req.body;

    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    if ([fullname, email, username, password].some(field => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new apiError(409, "User with email or username already exists");
    }

    console.log(req.files)

     
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;



    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path     
    }


    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar?.url) {
        throw new apiError(400, "Avatar upload failed");
    }

    let coverImage;
    if (coverImageLocalPath) {
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user");
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});


const loginUser = asyncHandler(async(req,res)=>{

    const {email , username , password} = req.body

    if(!username || !email){
        throw new apiError (400,"username or email is required")
    }
    const user = await User.findOne({
        $or :[{username},{email}]
    })
    
    if(!user){
        throw new apiError(404 , "user does not exist")
    }

   const ispasswordValid =  await user.isPasswordCorrect(password)

   if(!ispasswordValid){
    throw new apiError(401,"incorrect password")
   }
   const {accessToken,refreshToken} = await generateAccessAndRefrshToken(user._id)

   const loggedInUser = User.findById(user._id).select("-password -refreshToken")

    const options ={
        httpOnly:true,
        secure:true,
    }
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "user logged in successfully"
        )

    )
})

const logoutUser = asyncHandler(async(req,res)=>{
     User.findByIdAndUpdate(req.user._id,{
        $set:{
            refreshToken:undefined
        }
    },
    {
        new : true
    }
)
const options ={
    httpOnly:true,
    secure:true
}
return res
.status(200)
.clearCookie("accessToken",options)
.clearCookie("refreshToken",options)
.json(new ApiResponse(200,{},"user logged out"))
})
export { registerUser,
         loginUser,
         logoutUser
 };
