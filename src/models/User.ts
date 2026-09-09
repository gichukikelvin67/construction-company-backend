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
    password:string;
    role:UserRole;
    company: mongoose.Types.ObjectId;
    isActive: boolean;

    emailVerified:boolean;
    emailVerificationToken:string | null;
    emailVerificationExpires:Date | null;
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

        password:{
            type:String,
            required:true,
            minlength:8,
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
        }
    },



        {
            timestamps:true,
        }

    
)
const User=mongoose.model<IUser>("User", userSchema);
export default User;