import mongoose, {Document, Schema} from "mongoose";

export type UserRole=

| "admin"
|"project_manager"
|"site_supervisor"
|"accountant"
|"storekeeper";

export interface IUser extends Document{
    name:string;
    email:string;
    phone:string;
    language:"en"|"sw";
    timezone:string;
    currency:"KES"| "USD";
    profilePhoto:string | null ;
    profilePhotoPublicId:string | null;
    password:string;
    role:UserRole;
    company: mongoose.Types.ObjectId;
    isActive: boolean;

    emailVerified:boolean;
    emailVerificationToken:string | null;
    emailVerificationExpires:Date | null;

    passwordResetToken:string |null;
    passwordResetExpires:Date |null;
    passwordChangedAt:Date |null;
    termsAcceptedAt:Date | null;
    termsVersion:string |null;
}

const userSchema=new Schema<IUser>(
    {
        name:{
            type:String,
            required:true,
            trim:true,
        },

        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,

        },
        language: {
    type: String,
    enum: ["en", "sw"],
    default: "en",
},
timezone: {
    type: String,
    enum: ["Africa/Nairobi", "UTC"],
    default: "Africa/Nairobi",
},
currency: {
    type: String,
    enum: ["KES", "USD"],
    default: "KES",
},
        profilePhoto: {
    type: String,
    default: null,
},
profilePhotoPublicId: {
    type: String,
    default: null,
},

        password:{
            type:String,
            required:true,
            minlength:8,
            select:false,
        },

        company:{
            type:Schema.Types.ObjectId,
            ref:"Company",
            required:true,
        },

        role:{
            type:String,
            enum:["admin","project_manager","site_supervisor","accountant","storekeeper"],
            default: "site_supervisor",
        },

        isActive:{
            type:Boolean,
            default:true,
        },

        emailVerified:{
            type:Boolean,
            default:false,
        },
        emailVerificationToken:{
            type:String,
            default:null,
        },

        emailVerificationExpires:{
            type:Date,
            default:null,
        },
        passwordResetToken: {
  type: String,
  default: null,
},

passwordResetExpires: {
  type: Date,
  default: null,
},

passwordChangedAt: {
  type: Date,
  default: null,
},
termsAcceptedAt:{
    type:Date,
    default:null,
},
termsVersion:{
    type:String,
    default:null,
},
    },



        {
            timestamps:true,
        }

    
)
const User=mongoose.model<IUser>("User", userSchema);
export default User;