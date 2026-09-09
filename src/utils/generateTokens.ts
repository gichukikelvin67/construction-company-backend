import jwt from "jsonwebtoken";

const getAccessTokenSecret=(): string =>{
    const secret=process.env.JWT_SECRET;

    if(!secret){
        throw new Error("JWT_SECRET is not defined");
    }

    return secret;
}
const getRefreshTokenSecret= (): string =>{
    const secret =process.env.JWT_REFRESH_SECRET;

    if(!secret){
        throw new Error("JWT_REFRESH_SECRET is not defined");
    }

    return secret;
}

export const generateAccessToken=(userId:string): string =>{
    const secret =getAccessTokenSecret();

    console.log("Access token secret loaded:",Boolean(secret));
    return jwt.sign(
        {
            userId,
        },
        secret,
        {
            expiresIn:"15m",
        }

    )
}


export const generateRefreshToken=(userId: string): string =>{
    return jwt.sign(
        {
            userId,

        },
        getRefreshTokenSecret(),
        {
            expiresIn:"7d",
        }
    )
}