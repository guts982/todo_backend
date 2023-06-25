


export class CustomError extends Error {
    statusCode: number | string;
    path: string;
    value: string | number | boolean;
    name: string;
    message:string;
    custom:boolean;
    constructor(statusCode: number = 422, name: string = "ValidationError", message: string = "", path: string = "", value: string | number | boolean = "") {
        super(message);
        this.message = message
        this.statusCode = statusCode;
        this.path = path;
        this.value = value;
        this.name = name;
        this.custom = true;
        Error.captureStackTrace(this, this.constructor);
    }

    // if(this.name=="ValidationError") {
    toObject() {
        return {
            statusCode: this.statusCode,
            name: this.name,
            message: this.message,
            value: this.value,
            path: this.path,
            custom:this.custom
        }

    }
    // }

}