import { models, Schema, model, Model, Document } from "mongoose";
import { DateTime } from "luxon";
// import aggregatePaginate from "mongoose-aggregate-paginate-v2";


export interface ITodo extends Document {
    title: string;
    completed: boolean;
    dateCompleted?: Date | null; // DateTime | null;
    user: string | null;
    parent: string | null;
    siblings: {
        previous: string | null;
        next: string | null;
    },
    children?:ITodo[];
}


const todoSchema = new Schema<ITodo>({
    title: {
        type: String,
        required: [true, "title is required!"]
    },
    completed: {
        type: Boolean,
        default: false,

    },
    dateCompleted:{
        type:Schema.Types.Date,
        // get:(value:Date) =>  DateTime.fromJSDate(value),
        // set:(value:DateTime) => value.toJSDate(),
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: [true, "todo must belong to a user!"]
    },
    parent: {           //Allows nested todos
        type: Schema.Types.ObjectId,
        ref: "todo",
        default: null
    },
    siblings: {         //For mainting a queue data structure for the ordering of todos
        previous: {
            type: Schema.Types.ObjectId,
            ref: "todo",
            default: null
        },
        next: {
            type: Schema.Types.ObjectId,
            ref: "todo",
            default: null
        }
    }

}, {
    timestamps: true
})

todoSchema.pre("save",(next)=>{
    next()
})

todoSchema.post("save",async (doc)=>{
    //update dateCompleted conditionally
    // console.log("Saving todo data!",doc);
})

todoSchema.post('findOneAndUpdate', async function(doc) {
    // console.log("Todo updated:",doc );
    const updatedTodo = await this.model.findOne({ _id: doc._id });
    const dt = DateTime.now()
    // const localdt = dt.toLocaleString(DateTime.DATETIME_FULL); 
    if(updatedTodo.completed){
        updatedTodo.dateCompleted = dt // Date.now() // DateTime.now();
        await updatedTodo.save();
    } else {
        updatedTodo.dateCompleted = null
        await updatedTodo.save();
    }
    // console.log("updated todo:",updatedTodo,localdt );
   
  });


//   todoSchema.pre('aggregate', function() {
//     // Add a $match state to the beginning of each pipeline.
//     this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
//   });

//Aggregate paginate
// todoSchema.plugin(aggregatePaginate);

const Todo: Model<ITodo> = model<ITodo>("todo", todoSchema)

export default Todo










