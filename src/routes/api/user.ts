import { Router,Request, Response, NextFunction,  } from "express";
import { createOne, deleteOne, findOne, getAll, getFiltered, updateOne } from "../../controllers/api/userController";


/**************************************************************
--------------------------Init Route:api/users/------------------
****************************************************************/
const userRouter = Router();


/**************************************************************
--------------------------Routes-------------------------------
****************************************************************/
/** Route:api/users **/
// userRouter.get('/',getAll);
userRouter.get('/',(req:Request,res:Response,next:NextFunction)=>{
    const {page, limit, q} = req.query;
    if(page || limit || q) {
        getFiltered(req,res);
    } else {
        getAll(req,res);
    }
});
/** Route:api/users/create **/
userRouter.post('/create', createOne );
/** Route:api/users/:id **/
userRouter.get('/:id', findOne );
/** Route:api/users/:id **/
userRouter.delete('/:id', deleteOne );
/** Route:api/users/:id **/
userRouter.put('/:id', updateOne );


export default userRouter;

