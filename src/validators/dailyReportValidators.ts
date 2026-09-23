import {z}from "zod";
const objectId=(fieldName:string)=>
    z
.string()
.regex(/^[0-9a-fA-F]{24}$/, `Invalid ${fieldName}`);

export const createDailyReportSchema=z
.object({
    projectId:objectId("project ID"),

    reportDate:z.string().datetime(),

    weather:z
    .enum(["sunny","cloudy","rainy","Stormy","windy"])
    .optional(),

    workersPresent:z
    .number()
    .int()
    .min(0)
    .max(10000),

    workCompleted:z
    .string()
    .trim()
    .min(2)
    .max(5000),

    workPlanned:z
    .string()
    .trim()
    .max(5000)
    .optional(),

    materialsUsed:z
    .string()
    .trim()
    .max(5000)
    .optional(),

    equipmentUsed:z
    .string()
    .trim()
    .max(5000)
    .optional(),

    delays:z
    .string()
    .trim()
    .max(5000)
    .optional(),

    notes:z
    .string()
    .trim()
    .max(5000)
    .optional(),
})
.refine(
    (data)=>{
        const reportDate=new Date (data.reportDate);
        const now=new Date();
        //Do not allow reports more than 1 a day into the future

        const maximumDate=new Date(
            now.getTime()+ 24* 60 * 1000
        );
        return reportDate <=maximumDate;
        },
        {
            message:"Report date cannot be more than one day in the future",
            path:["reportDate"],
        }
);
export const updateDailyReportSchema=z
.object({
    reportDate:z.string().datetime().optional(),

    weather:z
    .enum(["sunny","cloudy","rainy","stormy","windy"])
    .optional(),

    workersPresent:z
    .number()
    .int()
    .min(0)
    .max(10000)
    .optional(),

    workCompleted:z
    .string()
    .trim()
    .max(5000)
    .optional(),

    materialsUsed:z
    .string()
    .trim()
    .max(5000)
    .optional(),

    equipmentUsed:z
    .string()
    .trim()
    .max(5000)
    .optional(),

    delays:z
    .string()
    .trim()
    .max(5000)
    .optional(),

    safetyIncidents:z
    .string()
    .trim()
    .max(5000)
    .optional(),

    notes:z
    .string()
    .trim()
    .max(5000)
    .optional(),

})
.refine(
    (data)=>
        Object.values(data).some(
(value)=> value !== undefined
        ),
        {
            message:"At least one field must be provided",
            path:["reportDate"],
        }
);