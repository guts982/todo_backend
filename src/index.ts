
import express, { Request, Response, NextFunction, ErrorRequestHandler, Application } from "express";
import { Server } from 'http'
import createHttpError from "http-errors";
import { config } from 'dotenv';
import bodyParser from "body-parser";
import cors from 'cors';
import expressLayouts from 'express-ejs-layouts';
import path from "path";
import userRouter from "./routes/api/user";
import todoRouter from "./routes/api/todo";
import webRouter from './routes/web';
import  { connectDb }  from './utils/connectDb';
import { globalMiddleware, webMiddleware,  apiMiddleware, adminMiddleware } from './middleware';
import logger from "./utils/logger";

/**************************************************************
--------------------------App Setup + Cors----------------------
****************************************************************/
config(); //Loads all the env vars present in .env
const app: Application = express() //Create application
const corsOption = {
    methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH'],
    allowedOrigins: process.env.ALLOWED_ORIGINS // process.env.NODE_ENV==="production" ? process.env.ALLOWED_ORIGINS : ["http://127.0.0.1:5173, localhost:5173,"]
}
app.use(cors(corsOption));  //Cors
app.use(bodyParser.json()) //or app.use(express.json())
app.use(bodyParser.urlencoded({extended: false}))
app.set("views",path.join(__dirname,'../views')) //Set views directory
app.use('/',express.static(path.join(process.cwd(),'public'))) //Serve static files
// app.use('/',express.static('../public')) //Serve static files
app.use(expressLayouts);        //layouting for  ejs
app.set('layout', './layouts/front')
app.set('view engine', 'ejs'); // Set EJS as the view engine



/***************************************************************
---------------------Register Middlewares-----------------------
Application level middleware global and route specific 
****************************************************************/
app.use(globalMiddleware)   //Application level middleware
app.use("/", webMiddleware);
app.use("/api", apiMiddleware);
app.use("/admin", adminMiddleware);
// app.use("/users", userMiddleware);
// app.use("/todos", todoMiddleware);
// app.use("/api/users", apiUserMiddleware);



/****************************************************************
--------------------------Route Handlers-------------------------
****************************************************************/
/*------------------------Web Routes----------------------------*/
app.use("/",webRouter);
/*------------------------Api Routes----------------------------*/
app.use("/api/users",userRouter);
app.use("/api/todos",todoRouter);



// Error Handler, if route doesn't exist
app.use(( req:Request, res:Response, next:NextFunction ) =>{
    logger.log("warn", `404request ${req.originalUrl}!` )
    next(new createHttpError.NotFound())
})

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    res.status(err.status || 500)
    const content = {title:err.name, status: err.status || 500,
        message: err.message,}
    return res.render("./front/error", content )
}

app.use(errorHandler)


const PORT: Number = Number(process.env.PORT) || 4000
let server:Server
const bootServer = async () => {
    let conn
    try{
        conn = await connectDb();
    } catch(err:any) {
        console.log("Database connection error ",err?.message);
        logger.log("error", `Database connection error ${err?.message}` )
    }
    server = app.listen(PORT, () => {console.log(`listening to port ${PORT}!!`);logger.log("info", `Listening to PORT ${PORT}!` )});
}
bootServer()





//Extras
// const newUser =  new User({name:body.name,email:body.email});
// const error = newUser.validateSync()     //Pre validate data