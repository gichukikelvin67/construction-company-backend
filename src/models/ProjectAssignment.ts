import mongoose,{Document,Schema} from "mongoose";

export type AssignmentStatus=
|"active"
|"completed"
|"removed";

export interface IProjectAssingment extends Document{
    project: mongoose.Types.ObjectId;
    worker: mongoose.Types.ObjectId;
    company: mongoose.Types.ObjectId;

    role: string;
    dailyRate:number;

    startDate:Date;
    endDate?: Date;

    status:AssignmentStatus;

    assignedBy: mongoose.Types.ObjectId;
}

const projectAssignmentSchema=
new Schema<IProjectAssingment>(
{
    project:{
        type:Schema.Types.ObjectId,
        ref:"Project",
        required:true,
        index:true,
    },

    worker:{
        type:Schema.Types.ObjectId,
        ref:"Worker",
        required:true,
        index:true,
    },

    company:{
        type:Schema.Types.ObjectId,
        ref:"Company",
        required:true,
        index:true,
    },

    role:{
        type:String,
        required:true,
        trim:true,
        maxlength:100,
    },

    dailyRate:{
        type:Number,
        required:true,
        min:0,
    },

    startDate:{
        type:Date,
        required:true,
    },

    endDate:{
        type:Date,
    },

    status:{
        type: String,
        enum:[
            "active",
            "completed",
            "removed",
        ],

        default:"active",
        index:true,
    },

    assignedBy:{
        type:Schema.Types.ObjectId,
        ref: "User",
        required:true,
    },

},
{
    timestamps:true,
}
)

projectAssignmentSchema.index({
    company:1,
    project:1,
})

projectAssignmentSchema.index({
    company:1,
    worker:1,
});

projectAssignmentSchema.index({
    project:1,
    worker:1,
    status:1,
})

projectAssignmentSchema.index(
  {
    company: 1,
    project: 1,
    worker: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: "active",
    },
  }
);

const ProjectAssignment=
mongoose.model<IProjectAssingment>(
    "ProjectAssignment",
    projectAssignmentSchema
)

export default ProjectAssignment;