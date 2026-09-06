import mongoose, {Document, Schema} from "mongoose";

export type UserRole=

| "admin"
|"project_manager"
|"site_supervisor"
|"accountant"
|"storekeeer";

export interface IUser extends Document{
    name:String;
    email:String;
    password:String;
    role:UserRole;
    isActive: boolean;
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

        role:{
            type:String,
            enum:["admin","project_manager","site_supervisor","accountant","storekeeper"],
            default: "site_supervisor",
        },

        isActive:{
            type:Boolean,
            default:true,
        },
    },

        {
            timestamps:true,
        }

    
)
const User=mongoose.model<IUser>("User, userSchema");
export default User;