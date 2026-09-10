import mongoose,{Document,Schema} from "mongoose";

export interface ISession extends Document{

    user:mongoose.Types.ObjectId;
    refreshTokenHash:string;
    expiresAt: Date;
    revokedAt:Date |null;

}

const sessionSchema=new Schema<ISession>(
    {
        user:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true,
            index: true,
                },

                refreshTokenHash:{
                    type: String,
                    required:true,
                    unique:true,

                },

                expiresAt:{
                    type: Date,
                    required: true,
                    index: true,

                },

                revokedAt:{
                    type:Date,
                    default:null,
                },
    },
    {
        timestamps:true,
    }

)

const Session= mongoose.model<ISession>(
    "Session",
    sessionSchema
);

export default Session;