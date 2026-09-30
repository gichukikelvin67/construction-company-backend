import{Request,Response,NextFunction}from "express";
export const errorHandler=(
    error:unknown,
    _req:Request,
    res:Response,
    _next:NextFunction
):void=>{
    console.error("Unhandled application error:",error);
    if(res.headersSent){
        return;
    }
    res.status(500).json({
        success:false,
        message:"An unexpected server error occurred",
    })
}