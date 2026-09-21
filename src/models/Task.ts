import mongoose,{Document,Schema}from "mongoose";

export type TaskStatus=
|"todo"
|"in_progress"
|"completed"
|"blocked"
|"cancelled"

export type TaskPriority=
|"low"
|"medium"
|"high"
|"urgent"

export interface ITask extends Document{
    title:string;
    description?:string;
    project:mongoose.Types.ObjectId;
    company:mongoose.Types.ObjectId;
    assignedTo?:mongoose.Types.ObjectId;
    status:TaskStatus;
    priority:TaskPriority;

    progress:number;
    startDate?:Date;
    dueDate?:Date;
    completedAt?:Date;
    createdBy:mongoose.Types.ObjectId;
    updatedBy?:mongoose.Types.ObjectId;
}
const taskSchema=new Schema<ITask>(
    {
        title:{
            type:String,
            required:true,
            trim:true,
            maxlength:200,
        },
        description:{
            type:String,
            trim:true,
            maxlength:2000,
        },
        project:{
            type:Schema.Types.ObjectId,
            ref:"Project",
            required:true,
            index:true,
        },
        company:{
            type:Schema.Types.ObjectId,
            ref:"Company",
            required:true,
            index:true,
        },
        assignedTo:{
            type:Schema.Types.ObjectId,
            ref:"User",
            index:true,
        },
        status:{
            type:String,
            enum:[
                "todo",
                "in_progress",
                "completed",
                "blocked",
                "cancelled",
            ],
            default:"todo",
            index:true,
        },
        priority:{
            type:String,
            enum:[
                "low","medium","high","urgent"
            ],
            default:"medium",
            index:true,
        },

        progress:{
            type:Number,
            min:0,
            max:100,
            default:0,
        },
        startDate:{
            type:Date,
        },
        dueDate:{
            type:Date,
            index:true,
        },
        completedAt:{
            type:Date,
        },
        createdBy:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
        updatedBy:{
            type:Schema.Types.ObjectId,
            ref:"User",
        }
    },
    {
        timestamps:true,
    }
)

taskSchema.index({
  company: 1,
  project: 1,
  status: 1,
});

taskSchema.index({
  company: 1,
  project: 1,
  dueDate: 1,
});

taskSchema.index({
  company: 1,
  assignedTo: 1,
  status: 1,
});

const Task = mongoose.model<ITask>("Task", taskSchema);

export default Task;
