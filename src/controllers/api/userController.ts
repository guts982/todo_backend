import { Request, Response } from "express";
import User, { IUser } from "../../models/user";;
import { CustomError } from "../../errors";
import { errorResponse, successResponse, CValidationError, InvalidIdError, NotFoundError, BadRequestError } from '../../utils/helpers';
import { isValidObjectId } from "mongoose";
import { paginate } from "../../utils/helpers";


/**************************************************************
---------------------------Get all users------------------------
****************************************************************/
export const getAll = async (req: Request, res: Response) => {
    
    try {
        const totalUsers = await User.countDocuments().exec();
        const users = await User.find({}).sort({ createdAt: -1 });
        return res.status(200).json(successResponse(`All ${totalUsers} Users!`, users, 200))
    } catch (err: any) {
        return res.status(err?.statusCode || 500).json(errorResponse("Users Not Found!", err, err?.statusCode || 500))
    }
}


/**************************************************************
---------------------------Get filtered/paginated users------------------------
****************************************************************/
export const getFiltered = async (req: Request, res: Response) => {
    const query =  req.query;
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 5;
    const q = query?.q?.toString()
    const url = req.originalUrl.split("?")[0];
   
    try {
        const paginatedResult = await paginate(User,{page:page,limit:limit,query:q,url:url});
        return res.status(200).json(successResponse(`Showing ${paginatedResult.result.length} Users!`, paginatedResult, 200))
    } catch (err: any) {
        return res.status(err?.statusCode || 500).json(errorResponse("Users Not Found!", err, err?.statusCode || 500))
    }
}

/**************************************************************
-------------------------Find one user------------------------
****************************************************************/
export const findOne = async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
        if (!isValidObjectId(id)) throw new CustomError(400, InvalidIdError, "Invalid id for user!", "id", id);
        const user = await User.findById(id);
        if (user) {
            return res.status(200).json(successResponse("User Found!", user, 200))
        }
        throw new CustomError(404, NotFoundError, "User Not Found!");

    } catch (err: any) {
        console.log("Error encountered:", err);
        return res.status(err?.statusCode || 500).json(errorResponse("User Not Found!", err, err?.statusCode || 500))
    }
}

/**************************************************************
-----------------------Create new user------------------------
****************************************************************/
export const createOne = async (req: Request, res: Response) => {
    const body = req.body;

    try {
        if (!body) throw new CustomError(400, BadRequestError, "Request body not found!");
        //check if email already exists
        const existingUser = await User.findOne({ email: body?.email }).exec();
        if (existingUser) throw new CustomError(422, CValidationError, "User with this email already exists!", "email", body?.email);
        //create new user
        const user = await User.create({ name: body?.name, email: body?.email });
        return res.status(201).json(successResponse("New user created successfully!", user, 201))
    } catch (err: any) {
        if (err.name == "ValidationError" || err.name == CValidationError) {
            return res.status(422).json(errorResponse("Could not create user!", err, 422))
        }
        console.log("Error encountered:", err);
        return res.status(err?.statusCode || 500).json(errorResponse("Could not create user!", err, err?.statusCode || 500))
    }
}

/**************************************************************
-----------------------Update one user------------------------
****************************************************************/
export const updateOne = async (req: Request, res: Response) => {
    const body = req.body;
    const id = req.params?.id

    try {
        if (!body) throw new CustomError(400, BadRequestError, "Request body not found!");
        if (!isValidObjectId(id)) throw new CustomError(400, InvalidIdError, "Invalid id for user!", "id", id);
        let user = await User.findByIdAndUpdate(id, { name: body?.name });
        user = await User.findById(id);
        return res.status(200).json(successResponse("User updated successfully!", user, 200))
    } catch (err: any) {
        if (err.name == "ValidationError") {
            return res.status(422).json(errorResponse("Could not update user!", err, 422))
        }
        console.log("Error encountered:", err);
        return res.status(err?.statusCode || 500).json(errorResponse("Could not update user!", err, err?.statusCode || 500))
    }
}



/**************************************************************
-------------------------Delete one user------------------------
****************************************************************/
export const deleteOne = async (req: Request, res: Response) => {
    const id = req.params?.id;
    try {
        if (!isValidObjectId(id)) throw new CustomError(400, InvalidIdError, "Invalid id for user!", "id", id);
        const user = await User.findByIdAndDelete(id);
        if (user) {
            return res.status(200).json(successResponse("User Deleted!", user, 200))
        }
        throw new CustomError(404, NotFoundError, "User not found!", "id", id);

    } catch (err: any) {
        console.log("Error encountered:", err);
        return res.status(err?.statusCode || 500).json(errorResponse("Could not update user!", err, err?.statusCode || 500))
    }
} 