import { Request, Response } from "express";
import Todo, { ITodo } from "../../models/todo";
import logger from "../../utils/logger";

export const index = async (req: Request, res: Response) => {

    try {
        const todos = await Todo.find({}).exec();
        const content =  { title: "Todos Page", layout:"./layouts/admin", todos:todos }
        return res.render("./front/index", content )
    } catch (err: any) {
        res.status(err.status || 500)
        const content = {title:err.name, status: err.status || 500,
        message: err.message,}
        logger.log("error",`Error, couldn't fetch todos ${err.message}`)
        return res.render("./front/error", content )
    }
}