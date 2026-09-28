import crypto from "crypto";

export interface UploadedFile{
    originName:string;
    mimeType:string;
    size:number;
    buffer:Buffer;
}

//Generate a unique storage key for a file
//Example/ Project ID /documents/random-id-contract.pdf
export const generateStorageKey=(
    projectId:string,
    originalName:string
):string=>{
    const extension=originalName.includes(".")
    ?originalName.substring(originalName.lastIndexOf("."))
    :"";
    const safeExtension=extension
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "");

    const uniqueId=crypto.randomUUID();
    return `projects/${projectId}/documents/${uniqueId}${safeExtension}`;
};