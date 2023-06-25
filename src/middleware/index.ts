import { Router,Request, Response, NextFunction,  } from "express";
import logger from "../utils/logger";

/****************************************************************
------------------------------Global------------------------------
****************************************************************/
export const globalMiddleware = (req:Request, res:Response, next:NextFunction)=>{
    console.log(`Logging in global middleware!\nRequest url:${req.originalUrl} \nTime: ${Date.now()} `);
    logger.log("info", `'${req.originalUrl}' requested by '${req?.ip}'` );
    if(req.query.admin=="true") {
        //do something , modify req
        console.log("user is admin!"); 
        next()
    } else{
        //send error res or
        next();
    }
    
    //some more code if required!
   
};

/****************************************************************
----------------------------WEB '/'------------------------------
****************************************************************/
export const webMiddleware = (req:Request, res:Response, next:NextFunction)=>{
    console.log("Logging in '/' middleware: ", Date.now());
    next();
}



/****************************************************************
------------------------ADMIN: '/admin'---------------------------
****************************************************************/
export const adminMiddleware = (req:Request, res:Response, next:NextFunction)=>{
    console.log("Logging in '/admin' middleware: ", Date.now());
    const auth = "admin"
    if(auth==="admin") {
        next();
    } else {
        res.send("Not Authorized")
    }
    
}


/****************************************************************
---------------------------API: '/api'---------------------------
****************************************************************/
export const apiMiddleware =  (req:Request, res:Response, next:NextFunction)=>{
    console.log("Logging in '/api' middleware: ", Date.now());
    next();
}







/**************************OVERKILLS******************************/
/****************************************************************
------------------------WEB: '/users'---------------------------
****************************************************************/
// export const userMiddleware = (req:Request, res:Response, next:NextFunction)=>{
//     console.log("Logging in '/users' middleware: ", Date.now());
//     next();
// }

/****************************************************************
------------------------WEB: '/todos'---------------------------
****************************************************************/
// export const todoMiddleware = (req:Request, res:Response, next:NextFunction)=>{
//     console.log("Logging in '/todos' middleware: ", Date.now());
//     next();
// }


/****************************************************************
------------------------API: '/api/users'------------------------
****************************************************************/
// export const apiUserMiddleware = (req:Request, res:Response, next:NextFunction)=>{
//     console.log("Logging in '/api/users' middleware: ", Date.now());
//     next();
// }

/****************************************************************
------------------------API: '/api/todos'------------------------
****************************************************************/
// export const apiTodoMiddleware = (req:Request, res:Response, next:NextFunction)=>{
//     console.log("Logging in '/api/todos' middleware: ", Date.now());
//     next();
// }




