import mongoose from "mongoose";

/****************************************************************
--------------------------Database Connection--------------------
****************************************************************/
export let conn:any; //:Promise<void>;
export const connectDb = async () => {
    const URI: string = process.env.MONGODB_URI || ""
    if(!URI) {
        throw new Error("Mongo db uri not defined!")
    }
    const options = {}
    conn = mongoose.connect(URI, options).then(() => console.log("Mongo Database Connected!")).catch((err) => console.log("MongoDB connection error ", err));
    return conn;
}










