// Dependencies
const multer = require("multer");


// Exports
module.exports = (tempDir = "/uploads") => {
    return multer({
        storage: multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, tempDir);
            },
            preservePath: true,
            // filename: function (req, file, cb) {
            //     // fix problem can't save arabic strings
            //     // file.originalname = Buffer.from(file.originalname, "latin1").toString("utf8");
            //     cb(null, file.originalname);
            // }
        }),
        fileFilter: (req, file, cb) => {
            // fix problem can't save arabic strings
            if (!/[^\u0000-\u00ff]/.test(file.originalname)) { // only if arabic letters found
                file.originalname = Buffer.from(file.originalname, "latin1").toString("utf8");
            };
            cb(null, true);
        }
    });
 };

// Multer nots
// fix problem can't save arabic strings
// Method - 1
// file.originalname = Buffer.from(file.originalname, "latin1").toString("utf8");
// Method = 2
// var iconv = require("iconv-lite");
// file.originalname = iconv.decode(Buffer.from(file.originalname, "latin1"), "utf8");

