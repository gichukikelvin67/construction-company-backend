import Invoice from "../models/Invoice.js";
import User from "../models/User.js";
import { createNotification } from "./notificationService.js";
export const processOverdueInvoices=async():Promise<void>=>{
    const now=new Date();
    const invoices=await Invoice.find({
        dueDate:{$lt:now},
        status:{$in:["issued","partially_paid"]},
        amountDue:{$gt:0},
        isArchived:false,
    });
    console.log(`Found ${invoices.length} overdue invoice(s)`);
    for(const invoice of invoices){
        const usersToNotify=await User.find({
            company:invoice.company,
            role:{
                $in:["admin","accountant","project_manager"],
            },
            isActive:true,

        }).select("_id");
        
        for(const user of usersToNotify){
            const notificationKey = `invoice-overdue-${invoice._id.toString()}-${user._id.toString()}`;
            try{
                await createNotification({
                    companyId:invoice.company,
                    userId:user._id,
                    type:"invoice",
                    title:"Overdue Invoice",
                     message: `Invoice ${invoice.invoiceNumber} is overdue. Amount due: KES ${invoice.amountDue.toLocaleString()}.`,
          resource: "invoice",
          resourceId: invoice._id,
          notificationKey,
                })
            }catch(error:any){
                //Duplicate notification means it was already created.
                if(error?.code===11000){
                    continue;
                }
                throw error;
            }
        }
    }
}