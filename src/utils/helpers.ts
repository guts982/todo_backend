// import { Error } from "mongoose";
import { CustomError } from "../errors";
import { Model } from "mongoose";
import User, {IUser} from "../models/user";
import Todo, {ITodo} from "../models/todo";


//error types
export const CValidationError = "CValidationError";    //custom vaidation
export const InvalidIdError = "InvalidIdError";         //invalid id object
export const NotFoundError = "NotFoundError";           //model not found
export const BadRequestError = "BadRequestError"; //body ont found


export const errorResponse = (message: string = "", err: any = {}, code:number=400) => (
    { status: err?.statusCode || code, statusText:"error" , message: message, error: err.name == "ValidationError" ? err.errors : { name: err?.name || "Error", message: err.message, path: err?.path }, data: {} }
);

export const successResponse = (message: string = "", data: any = {}, code:number=200) => ({ status:code, statusText: "success", message: message, error: {}, data: data });

//not to use : defect piece
// export const paginateArray = (limit: number, page: number, offset: number, data = []) => {
//     const startIndex = (page - 1) * limit;
//     const endIndex = page * limit;
//     const totalCount = data.length
//     const results = {
//         data: [],
//         next: {},
//         previous: {},
//     }
//     if (endIndex < data.length) {
//         results.next = {
//             page: (page + 1),
//             limit: limit
//         }
//     }
//     if (startIndex > 0) {
//         results.previous = {
//             page: page - 1,
//             limit: limit
//         }
//     }
//     results.data = data.slice(startIndex, endIndex)
// }


export const paginate = async <T extends typeof Model> (model: T,
    options: {
        page: number,
        limit: number,
        query?: string | null,
        url: string,
        completed?: string | boolean,
    } = {
            page: 1,
            limit: 5,
            query: null,
            url: "/"
        }) => {

    const { page, limit, url } = options;
    const query = String(options?.query || "").trim();
    const skip = (page - 1) * limit;

    type modelType = T extends typeof User ? IUser : T extends typeof Todo ? ITodo : never;

    const pipeline: any[] = [];
    if (query) {
        //model specific filters
        if(model==Todo) {
            pipeline.push({
                $match: {
                    $or: [
                        //custom: dependent on model
                        { title: { $regex: new RegExp(`.*${query}.*`, 'i') } },
                        { 'user.name': { $regex: query, $options: 'i' } },
                    ],
                    //TODO: further filters 
                    // $and:[
                    //     // {completed:{completed:completed=="true"}},
                    // ]
                }
            })
        } 
        else if(model==User) {
            pipeline.push({
                $match: {
                    $or: [
                        //custom: dependent on model
                       { name: { $regex: new RegExp(`.*${query}.*`, 'i') } },
                       { email: { $regex: new RegExp(`.*${query}.*`, 'i') } },
                    ],
                }
            })
        } else {

        }

    }

    //perform count operation on this count pipeline stage where pagination has not been applied yet
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: 'total' });

    //get data after applying pagination
    pipeline.push({ $sort: { createdAt: -1 } })
    pipeline.push({ $skip: skip })
    pipeline.push({ $limit: limit })

    const resultPipeline = [
        { $facet: { data: pipeline, count: countPipeline } },
        { $unwind: '$count' },
        { $project: { data: '$data', total: '$count.total' } },
    ];

    const filteredData = await model.aggregate(resultPipeline);
    const totalCount = filteredData.length > 0 ? filteredData[0].total : 0;
    const result : modelType[] = filteredData.length > 0 ? filteredData[0].data : [];

    const pageCount = Math.ceil(totalCount / limit);
    const hasNext = page < pageCount;
    const hasPrevious = page > 1;

    return {
        result: result,
        _metadata: {
            page: page,
            per_page: limit,
            page_count: pageCount,
            total_count: totalCount,
            has_next: hasNext,
            has_previous: hasPrevious,
            is_first: page == 1,
            is_last: page == pageCount,
            links:
            {
                self: `${url}?page=${page}&limit=${limit}${query ? '&query=' + query : null}`,
                first: `${url}?page=1&limit=${limit}${query ? '&query=' + query : null}`,
                previous: hasPrevious ? `${url}?page=${page - 1}&limit=${limit}${query ? '&query=' + query : null}` : null,
                next: hasNext ? `${url}?page=${page + 1}&limit=${limit}${query ? '&query=' + query : null}` : null,
                last: `${url}?page=${pageCount}&limit=${limit}${query ? '&query=' + query : null}`,
            }
        }
    }

}