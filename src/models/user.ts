import { models, Schema, model, Model, Document } from "mongoose";
import { DateTime } from "luxon";

export interface IUser extends Document {
    name: string;
    email: string;
    image?: string | null;
    dob?: Date | null; // DateTime;
}


const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: [true, "name field is required!"],
        min:3,
        max:30
    },
    email: {
        type: String,
        required: [true, "email field is required!"],
        unique: true,
    },
    image: {
        type:String,
        min:5,
        max:100
    },
    dob:{
        type:Schema.Types.Date,
        // default: () => DateTime.now().minus({years:12}).toJSDate(),
        // get:(value:Date) =>  DateTime.fromJSDate(value),
        // set:(value:DateTime) => value.toJSDate(),
    }
}, { timestamps: true })


//More email validations
userSchema.path("email").validate((email) => {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
},'Please enter a valid email address',)
userSchema.path("email").validate(async (email) => {
    const emailCount = await models.user.count({ email });
    return !emailCount;
},'Email already exists!',)


const User: Model<IUser> = model<IUser>("user", userSchema)
export default User



    // email: {
    //     type: String,
    //     required: [true, "email field is required!"],
    //     unique: true,
        // validate:  [
        //     {
        //       validator: function (value:string) {
        //         // Regular expression to validate email format
        //         const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        //         return emailRegex.test(value);
        //       },
        //       message: 'Please enter a valid email address',
        //     },
        //     // {
        //     //   validator:  function (value:string) {
        //     //     return this.constructor;
        //     //     // const user = await this.constructor.findOne({ email: value });
        //     //     // return !user; // Return true if user is not found (i.e., email is unique)
        //     //   },
        //     //   message: 'Email address already exists',
        //     // },
        //   ],
    // },
    //Some more custom validation message and validator examples
    // age: {
    //     type:Number,
    //     min:[18, "Must be >= 18 years old, cannot be {VALUE}!"]
    // },
    // martialStatus:{
    //     type:String,
    //     enum: {
    //         values:["married","unmarried"],
    //         message:"{VALUE} is not supported!",
    //     }
    // },
    // phone: {         //Custom validator
    //     type: String,
    //     validate: {
    //       validator: function(v:any) {
    //         return /\d{3}-\d{3}-\d{4}/.test(v);
    //       },
    //       message: (props:any) => `${props.value} is not a valid phone number!`
    //     },
    //     required: [true, 'User phone number required']
    //   }

// }, { timestamps: true })










