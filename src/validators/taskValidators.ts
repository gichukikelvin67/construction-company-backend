import {z}from "zod";
const objectId=(fieldName:string)=>
    z
.string()
.regex(/^[0-9a-fA-F]{24}$/, `Invalid ${fieldName}`);
export const createTaskSchema=z
.object({
    title:z
    .string()
    .trim()
    .min(2, "Task title must be at least 2 characters")
    .max(200, "Task title is too long"),

    description:z
    .string() 
    .trim()
    .max(2000,"Description is too long")
    .optional(),
    projectId:objectId("project ID"),
    assignedTo:objectId("assigned user ID").optional(),

    status:z
    .enum([
        "todo",
        "in_progress",
        "completed",
        "blocked",
        "cancelled",
    ])
    .optional(),
    priority:z
    .enum(["low","medium","high","urgent"])
    .optional(),

    progress:z
    .number()
    .min(0,"Progress cannot be below 0")
    .max(100, "Progress cannot exceed 100")
    .optional(),

    startDate:z.string().datetime().optional(),
    dueDate:z.string().datetime().optional(),
})
.refine(
    (data)=>{
        if(!data.startDate || !data.dueDate){
            return true;
        }
        return new Date(data.dueDate)>=new Date(data.startDate);
    },
    {
        message:"Due date cannot be before start date",
        path:["dueDate"],
    }
)
export const updateTaskSchema=z
.object({
    title:z
    .string()
    .trim()
    .min(2, "Task title must be at least 2 characters")
    .max(200,"Task title is too long")
    .optional(),

    description:z
    .string()
    .trim()
    .max(2000,"Description is too long")
    .optional(),

    assignedTo:objectId("assigned user ID").nullable().optional(),

    status:z
    .enum([
        "todo",
        "in_progress",
        "completed",
        "blocked",
        "cancelled",
    ])
    .optional(),
    priority:z
    .enum([
        "low","medium","high","urgent"
    ])
    .optional(),

    progress:z
    .number()
    .min(0,"Progress cannot be below 0")
    .max(100, "Progress cannot exceed 100")
    .optional(),

    startDate:z.string().datetime().nullable().optional(),
    dueDate:z.string().datetime().nullable().optional(),

})
 .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.assignedTo !== undefined ||
      data.status !== undefined ||
      data.priority !== undefined ||
      data.progress !== undefined ||
      data.startDate !== undefined ||
      data.dueDate !== undefined,
    {
      message: "At least one field must be provided",
      path: ["title"],
    }
  );

export const updateTaskProgressSchema = z.object({
  progress: z
    .number()
    .min(0, "Progress cannot be below 0")
    .max(100, "Progress cannot exceed 100"),
});
