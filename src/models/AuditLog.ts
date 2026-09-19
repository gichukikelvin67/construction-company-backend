import mongoose,{Document,Schema}from "mongoose";
export type AuditAction=
|"create"
|"update"
|"delete"
|"approve"
|"reject"
|"cancel"
|"receive"
|"login"
|"logout"
|"activate"
|"deactivate"

export interface IAuditLog extends Document{
    company: mongoose.Types.ObjectId;
    user:mongoose.Types.ObjectId;

    action:AuditAction;
    resource:string;
    resourceId?:mongoose.Types.ObjectId;
    ipAddress?:string;
    description:string;
    metadata?:Record<string,unknown>;
    userAgent?:string;
}
const auditLogSchema=new Schema<IAuditLog>(
    {
        company:{
            type:Schema.Types.ObjectId,
            ref:"Company",
            required:true,
            index:true,
        },
        user:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true,
            index:true,
        },
        action:{
            type:String,
            enum:[
            "create",
            "update",
            "delete",
            "approve",
            "reject",
            "cancel",
            "receive",
            "login",
            "logout",
            "activate",
            "deactivate",
            ],
            required:true,
            index:true,
        },
        resource:{
            type:String,
            required:true,
            trim:true,
            maxlength:100,
        },
          resourceId: {
      type: Schema.Types.ObjectId,
      index: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    metadata: {
      type: Schema.Types.Mixed,
    },

      ipAddress: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    userAgent: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({
  company: 1,
  createdAt: -1,
});

auditLogSchema.index({
  company: 1,
  user: 1,
  createdAt: -1,
});

auditLogSchema.index({
  company: 1,
  resource: 1,
  resourceId: 1,
  createdAt: -1,
});

const AuditLog = mongoose.model<IAuditLog>(
  "AuditLog",
  auditLogSchema
);

export default AuditLog;
    
