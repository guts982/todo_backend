import { Router, Request, Response, NextFunction, } from "express";
import { index } from "../controllers/web/todoController";
/**************************************************************
--------------------------Init Route: / ----------------------------
****************************************************************/
const webRouter = Router();



/**************************************************************
--------------------------Routes-------------------------------
****************************************************************/
/*-------------------- Route: / -------------------------------*/
webRouter.get('/', (req: Request, res: Response) => {
    // return res.render("./front/index", { title: "Home Page : Todo App",layout:"./layouts/front" })
    return res.render("./front/index", { title: "Home Page : Todo App"}) //use default layout defined in app
});

/*-------------------- Route: /users -------------------------------*/
webRouter.get('/users', (req: Request, res: Response) => {
    return res.render("./front/index", { title: "Users Page"})
});

/*-------------------- Route: /todos -------------------------------*/
webRouter.get('/todos', index);


export default webRouter;
