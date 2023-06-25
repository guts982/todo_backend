import { Request, Response } from "express";
import Todo, { ITodo } from ".././../models/todo";
import { isValidObjectId } from "mongoose";
import { CustomError } from "../../errors"
import { errorResponse, successResponse, CValidationError, InvalidIdError, NotFoundError, BadRequestError, paginate } from '../../utils/helpers'
import User from "../../models/user";

interface IDestination {
    parent?: string | null;
    siblings?: {
        previous?: string | null;
        next?: string | null;
    }
}

/**************************************************************
---------------------------Get all todos------------------------
****************************************************************/
export const getAll = async (req: Request, res: Response) => {
    try {
        const totalTodos = await Todo.countDocuments().exec();
        const todos = await Todo.find({});
        return res.status(200).json(successResponse(`All ${totalTodos} Todos!`, todos, 200))
    } catch (err: any) {
        return res.status(err?.statusCode || 500).json(errorResponse("Todos Not Found!", err, err?.statusCode || 500))
    }
}


/**************************************************************
---------------------------Get filtered/paginated todos------------------------
****************************************************************/
export const getFiltered = async (req: Request, res: Response) => {
    const query = req.query;
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 5;
    const q = query?.q?.toString()
    const url = req.originalUrl.split("?")[0];

    //further work : auth based search get user from auth or not if admin


    try {
        const paginatedResult = await paginate(Todo, { page: page, limit: limit, query: q, url: url });
        return res.status(200).json(successResponse(`Showing ${paginatedResult.result.length} Todos!`, paginatedResult, 200))
    } catch (err: any) {
        return res.status(err?.statusCode || 500).json(errorResponse("Todos Not Found!", err, err?.statusCode || 500))
    }

}

/**************************************************************
-------------------------Find one todo------------------------
****************************************************************/
export const findOne = async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
        if (!isValidObjectId(id)) throw new CustomError(400, InvalidIdError, "Invalid id for todo!", "id", id);
        const todo = await Todo.findById(id).lean() //One({id:id});
        if (todo) {
            return res.status(200).json(successResponse("Todo Found!", todo, 200))
        }
        throw new CustomError(404, NotFoundError, "Todo Not Found!");

    } catch (err: any) {
        console.log("Error encountered:", err.message);
        return res.status(err?.statusCode || 500).json(errorResponse("Todo Not Found!", err, err?.statusCode || 500))
    }
}

/**************************************************************
-----------------------Create new todo------------------------
****************************************************************/
export const createOne = async (req: Request, res: Response) => {
    const body = req?.body;

    const session = await Todo.startSession();
    try {
        if (!body) throw new CustomError(400, BadRequestError, "Request body not found!");
        if (!body?.user) body.user = "648b12ac8ccc7f471b99de98";
        if (!body?.user || !isValidObjectId(body?.user)) throw new CustomError(422, InvalidIdError, "Invalid id for user!", "id", body?.user);
        const user = await User.findById(body?.user)
        if (!user) throw new CustomError(422, CValidationError, `No user found for id ${body?.id} !`, "id", body?.id || "");

        session.startTransaction()
        const todo = await Todo.create({ title: body?.title, colmpleted: body?.completed, user: body?.user, parent: body?.parent });
        //Update the todo queue
        const updatedOrder = await enqueue(todo)
        await session.commitTransaction();
        session.endSession();
        return res.status(201).json(successResponse("New todo created successfully and added to the end of queue!", todo, 201))
    } catch (err: any) {
        await session.abortTransaction();
        session.endSession();
        if (err.name == "ValidationError" || err.name === CValidationError) {
            return res.status(422).json(errorResponse("Could not create todo!", err, 422))
        }
        console.log("Error encountered:", err);
        return res.status(err?.statusCode || 500).json(errorResponse("Could not create todo!", err, err?.statusCode || 500))
    }
}

/**************************************************************
-----------------------Update one todo------------------------
****************************************************************/
export const updateOne = async (req: Request, res: Response) => {
    const body = req.body;
    const id = req.params.id
    if (!body) throw new CustomError(400, BadRequestError, "Request body not found!");

    try {
        if (!isValidObjectId(id)) throw new CustomError(400, InvalidIdError, "Invalid id for todo!", "id", id);
        // let todo = await Todo.findByIdAndUpdate(id, { title: body?.title, completed: body?.completed });
        const filter = { _id: id }
        let todo = await Todo.findOneAndUpdate(filter, { title: body?.title, completed: body?.completed });
        todo = await Todo.findById(id);
        return res.status(200).json(successResponse("Todo updated successfully!", todo, 200))
    } catch (err: any) {
        if (err.name == "ValidationError") {
            return res.status(422).json(errorResponse("Could not update todo!", err, 422))
        }
        console.log("Error encountered:", err);
        return res.status(err?.statusCode || 500).json(errorResponse("Could not update todos!", err, err?.statusCode || 500))
    }
}

/**************************************************************
-------------------------Delete one todo------------------------
****************************************************************/
export const deleteOne = async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
        if (!isValidObjectId(id)) throw new CustomError(400, InvalidIdError, "Invalid id for todo!", "id", id);
        const todo = await Todo.findById(id);
        if (todo) {
            // console.log("calling remove from queue for first time with ",todo._id);
            const deleted = await removeFromQueue(todo);
            if (deleted) {
                return res.status(200).json(successResponse("Todo Deleted !", deleted, 200))
            }
        }
        throw new CustomError(404, NotFoundError, "Todo Not Found!", "id", id);

    } catch (err: any) {
        console.log("Error encountered:", err);
        return res.status(err?.statusCode || 500).json(errorResponse("Could not delete todos!", err, err?.statusCode || 500))
    }
}

/**************************************************************
-------------Shift todo to new position/level in queue--------------
****************************************************************/
export const moveTodo = async (req: Request, res: Response) => {
    const id = req.params.id;
    const body = req.body;

    const session = await Todo.startSession();
    try {
        if (!body) throw new CustomError(400, BadRequestError, "Request body not found!");
        const destination: IDestination = body?.destination;
        if (!destination) throw new CustomError(422, CValidationError, "Destination with parent and siblings are required to shift todo!", "id", id);
        if (!isValidObjectId(id)) throw new CustomError(400, InvalidIdError, "Invalid id for todo!", "id", id);
        //more validations
        if (destination?.parent && !isValidObjectId(destination.parent)) throw new CustomError(400, InvalidIdError, "Invalid id for parent!", "id", id);
        if (destination?.siblings?.previous && !isValidObjectId(destination.siblings?.previous)) throw new CustomError(400, InvalidIdError, "Invalid id for previous sibling!", "id", id);
        if (destination?.siblings?.next && !isValidObjectId(destination.siblings?.next)) throw new CustomError(400, InvalidIdError, "Invalid id for next sibling!", "id", id);


        const todo = await Todo.findById(id);
        if (todo) {

            session.startTransaction()
            const shiftedTodo = await shiftTodo(todo, destination);
            if (shiftedTodo) {
                await session.commitTransaction();
                session.endSession();
                return res.status(200).json(successResponse("Todo Shifted !", {}, 200))
            }
        }
        await session.abortTransaction();
        session.endSession();
        throw new CustomError(404, NotFoundError, "Todo not found!", "id", id);

    } catch (err: any) {
        await session.abortTransaction();
        session.endSession();
        if (err.name == "ValidationError" || err.name == CValidationError) {
            return res.status(422).json(errorResponse("Could not shift todo!", err, 422))
        }
        console.log("Error encountered:", err);
        return res.status(err?.statusCode || 500).json(errorResponse("Could not shift todo!", err, err?.statusCode || 500))
    }
}


/**************************************************************
-------------Returnss ordered todos in the queue--------------
****************************************************************/
export const getTodoQueue = async (req: Request, res: Response) => {
    try {
        const totalTodos = await Todo.countDocuments().exec();
        //TODO: further user filter to be added
        //get top level parent todos
        const todos: ITodo[] = []
        const firstTodo = await Todo.findOne({ parent: null, "siblings.previous": null }).lean().exec();
        //map todo to it's children recursively
        if (firstTodo) {
            const visited = new Set<string>();
            await orderTodos(todos, firstTodo, visited)
        }

        return res.status(200).json(successResponse(`All ${totalTodos} Todos!`, todos, 200))
    } catch (err: any) {
        return res.status(err?.statusCode || 500).json(errorResponse("Todos Not Found!", err, err?.statusCode || 500))
    }

}

//recursively order todos
const orderTodos = async (list: ITodo[] , todo: ITodo, visited: Set<string>) => {

    if (visited.has(todo._id.toString())) {
        return; // Skip if todo has already been visited
    }
    visited.add(todo._id.toString()); // Mark the todo as visited

    
    const childTodos: ITodo[] = await Todo.find({ parent: todo._id }).lean().exec();
    // console.log("TODO :", todo.title, " ,childrenTodos:", childTodos);
    if (childTodos.length > 0 ) {
        todo.children = [];
        for(let i=0;i<childTodos.length;i++) {
            await orderTodos(todo.children || [], childTodos[i], visited);
        }
    }
    list.push(todo);


    const next = await Todo.findById(todo.siblings.next).lean().exec();
    if (next) {
        await orderTodos(list, next, visited);
    }
}



/**************************************************************
--------------------Enque one todo to end----------------------
Adds a todo based on user, parent and places it at the end of queue
by modifying the next reference of any todo present in the same level
and the previous reference of its own
****************************************************************/
const enqueue = async (todo: ITodo) => {
    const lastTodo = await Todo.findOne({ parent: todo.parent, "siblings.next": null, user: todo.user, _id: { $ne: todo._id } })
    if (!lastTodo) {
        //do nothing since the new todo is the first entry in its level
        return
    }
    // Update the next reference of the latest todo to new todo
    await Todo.findByIdAndUpdate(lastTodo._id, { "siblings.next": todo._id });

    // Update the previous reference of the new todo to the latest todo
    await Todo.findByIdAndUpdate(todo._id, { "siblings.previous": lastTodo._id });
}


/**************************************************************
--------------Dequeue/remove todo with its childs----------------
if it has child, the function gets called recursively until all
the generation of the initally passed todo gets deleted, and finally
the siblings are also modified to point to skip the todo in the 
queue data structure
****************************************************************/
const removeFromQueue = async (todo: ITodo) => {
    //find children
    const childTodos = await Todo.find({ user: todo.user, parent: todo })

    if (childTodos.length > 0) {
        childTodos.forEach(async item => {
            await removeFromQueue(item);
        });
    }

    await unlinkFromSource(todo);

    //Finally delete the todo
    console.log("deleting todo ", todo._id);
    const deleted = await Todo.findByIdAndDelete(todo._id)
    return deleted
}



const shiftTodo = async (todo: ITodo, destination: IDestination) => {
    //detach from old position in the queue
    await unlinkFromSource(todo);

    let updated;
    //set new destination
    const parent = await Todo.findOne({ _id: destination?.parent || null, user: todo.user }).exec()
    const previous = await Todo.findOne({ _id: destination?.siblings?.previous || null, user: todo.user }).exec()
    const next = await Todo.findOne({ _id: destination?.siblings?.next || null, user: todo.user }).exec()

    if (previous && next) {  //todo in between
        console.log("prev & next");
        await Todo.findByIdAndUpdate(previous.id, { "siblings.next": todo })
        await Todo.findByIdAndUpdate(next.id, { "siblings.previous": todo })
        //update the todo
        updated = await Todo.findByIdAndUpdate({
            parent: parent,
            "siblings.previous": previous,
            "siblings.next": next
        })
    } else if (previous && !next) {  //todo in last with previous siblings in queue
        console.log("prev & !next");
        await Todo.findByIdAndUpdate(previous.id, { "siblings.next": todo })
        //update the todo
        updated = await Todo.findByIdAndUpdate({
            parent: parent,
            "siblings.previous": previous,
            "siblings.next": null
        })
    } else if (!previous && next) {  //todo in first with next siblings in queue
        console.log("!prev & next");
        await Todo.findByIdAndUpdate(next.id, { "siblings.previous": todo })
        //update the todo
        updated = await Todo.findByIdAndUpdate({
            parent: parent,
            "siblings.previous": null,
            "siblings.next": next
        })
    } else {    //!previous and !next => todo is the only one in queue
        console.log("!prev & !next");
        //update the todo
        updated = await Todo.findByIdAndUpdate(todo.id, {
            parent: parent,
            "siblings.previous": null,
            "siblings.next": null
        })
    }

    return updated;
}




const unlinkFromSource = async (todo: ITodo) => {
    //dequeue: connect the siblings
    const previous = await Todo.findOne({ _id: todo.siblings.previous, user: todo.user }).exec()
    const next = await Todo.findOne({ _id: todo.siblings.next, user: todo.user }).exec()
    console.log("unlinking", previous, next);
    if (previous && next) {  //todo in between
        await Todo.findByIdAndUpdate(previous.id, { "siblings.next": todo.siblings.next })
        await Todo.findByIdAndUpdate(next.id, { "siblings.previous": todo.siblings.previous })
    } else if (previous && !next) {  //todo in last with previous siblings in queue
        await Todo.findByIdAndUpdate(previous.id, { "siblings.next": null })
    } else if (!previous && next) {  //todo in first with next siblings in queue
        await Todo.findByIdAndUpdate(next.id, { "siblings.previous": null })
    } else {    //!previous and !next => todo is the only one in queue
        //do nothing
    }
}


export const testFunc = async (req: Request, res: Response) => {

    // const dest = req.body.destination;
    // const parent = await Todo.findOne({ id: dest?.parent });

    // return res.status(200).json({ status: "error", parent: parent })

    let todos: ITodo[] = []
    const firstTodo = await Todo.findOne({ parent: null, "siblings.previous": null }).lean().exec();
    console.log("first", firstTodo);
    //map todo to it's children
    if (firstTodo) {
        const visited = new Set<string>();
        await orderTodos(todos, firstTodo, visited)
    }


    return res.status(200).json({ status: "success", firstTodo: firstTodo, todos: todos })
}