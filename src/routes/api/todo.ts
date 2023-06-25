import { Router, Request, Response, NextFunction, } from "express";
import { createOne, deleteOne, findOne, getAll, moveTodo, updateOne, testFunc, getFiltered, getTodoQueue } from "../../controllers/api/todoController";


/**************************************************************
--------------------------Init Route:api/todos/------------------
****************************************************************/
const todoRouter = Router();


/**************************************************************
--------------------------Routes-------------------------------
****************************************************************/
/** Route:api/todos **/
// todoRouter.get('/',getAll);
todoRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
    const { page, limit, q } = req.query;
    if (page || limit || q) {
        getFiltered(req, res);
    } else {
        getAll(req, res);
    }
});
/** Route:api/todos/create **/
todoRouter.post('/create', createOne);

/** Route:api/todos/test **/
todoRouter.get('/test', testFunc);

/** Route:api/todos/queue **/
todoRouter.get('/queue', getTodoQueue);

/** Route:api/todos/:id **/
todoRouter.get('/:id', findOne);

/** Route:api/todos/:id **/
todoRouter.delete('/:id', deleteOne);

/** Route:api/todos/:id **/
todoRouter.put('/:id', updateOne);

/** Route:api/todos/:id **/
todoRouter.patch('/shift/:id', moveTodo);




export default todoRouter;

