import winston from "winston";
import { DateTime } from "luxon";


const dt = DateTime.now()
// const localdt = dt.toLocaleString(DateTime.DATETIME_FULL); 

const  logger = winston.createLogger({
     // Log only if level is less than (meaning more severe) or equal to this
    level:"info",

    // Use timestamp and printf to create a standard log format
    format:winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(
            (info) => `${ DateTime.fromISO(info.timestamp).toLocaleString(DateTime.DATETIME_FULL) } ${info.level} ${info.message}`
        )
    ),
    //Log to the console and a file
    transports:[
        new winston.transports.Console(),
        new winston.transports.File({filename:"logs.log"})
    ]

})

export default logger