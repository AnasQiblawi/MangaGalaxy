// Dependencies ---
const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");



// configs
const port = process.env.PORT || 80;
const dirs = {
    home: __dirname,
    manhwas: path.join(__dirname, "manhwas"),
    tempUploads: path.join(__dirname, "temp")
};




// Setup server ---
const app = express();
// all app functions will be added to it again but with upp latters.
Object.keys(app).forEach(property => app[property.toLocaleUpperCase()] = app[property]);
// const router = express.Router();

// BodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set rendering engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "pages"));



// Listen
app.listen(port, () => console.log(`Server started on port ${port}`));





// Controllers --- ------------------------------------------------------
const image = require("./controllers/image");



// Midelwares --- ------------------------------------------------------

// Logger
app.use(morgan("dev"));


// Brotli compression
app.use(require("./middlewares/express-compression.js"));


// Multer
// take care of uploading files
const multer = require("./middlewares/multer.js")(dirs.tempUploads);












// Routes -------------------------------------------------------------------------------------

// Routes end points
// All routes will be set in this variable.
// why? so I only declare it once and use it every where in fromtend & backend
global.routes = {
    // Static
    static: {
        assets: {
            path: "/assets",
            dir: path.join(__dirname, "/assets"),
            description: "assets"
        },
        file: {
            path: "/file",
            dir: dirs.manhwas,
            description: "display files in manhwa directory."
        },
    },
    // Views
    page: {
        home: {
            path: "/",
            method: "GET",
            description: "Main home route"
        }
    },
    // APIs
    api: {
        routes: {
            path: '/routes',
            method: "GET",
            description: "Get A JSON object of all routes used in this app."
        }
    }
};


// Static route ----------------------------
// app.use("/assets", express.static(__dirname + "/assets"));
app.use(routes.static.assets.path, express.static(routes.static.assets.dir));
// app.use("/file", express.static(dirs.manhwas));
app.use(routes.static.file.path, express.static(routes.static.file.dir));
// Chapter images
app.use("/imgs/:manhwaName/:chapterName/:imageName", (req, res, next) => {
    const { manhwaName, chapterName, imageName } = req.params;
    const imagePath = path.join(dirs.manhwas, manhwaName, chapterName, imageName);
    if (fs.existsSync(imagePath)) return res.sendFile(imagePath);
    res.status(404).send("Not found!");
});

// non-Static routes -------------------------


// Home - (Manhwas List)
app[routes.page.home.method](routes.page.home.path, (req, res, next) => {
    // Manhwas are stored as folders
    res.redirect("/manhwa");
});



// Manhwas List
routes.page.manhwa = {
    path: "/manhwa",
    method: "GET",
    description: "Page the desplays all manhwas."
};
app[routes.page.manhwa.method](routes.page.manhwa.path, (req, res, next) => {
    // Manhwas are stored as folders
    res.render("manhwas.ejs", { routes });
});



// Manhwa page
routes.page.manhwaPage = {
    path: "/manhwa/:manhwaName",
    method: "GET",
    description: "a Manhwa page, show all its info and chapters."
};
app[routes.page.manhwaPage.method](routes.page.manhwaPage.path, (req, res, next) => {
    const { manhwaName } = req.params;
    // 
    return res.render("chapters.ejs", { routes, manhwaName });
});



// Chapter page
routes.page.chapterPage = {
    path: "/manhwa/:manhwaName/:chapterName",
    method: "GET",
    description: "a Manhwa chapter page, see and read the chapter here."
};
app[routes.page.chapterPage.method](routes.page.chapterPage.path, async (req, res, next) => {
    const { manhwaName, chapterName } = req.params;
    const chapterDir = path.join(dirs.manhwas, manhwaName, chapterName)

    // if manhwa folder exist
    if (manhwaName && fs.existsSync(chapterDir)) {
        // Get Chapters List, they exist as folders in the Projet dorectory.
        let imagesList = await readDirectoryRecursive(chapterDir);

        // response
        return res.render("chapterPage.ejs", {
            routes,
            manhwaName,
            chapterName,
            imagesList: JSON.stringify(imagesList)
        });
    };

    // response
    res.redirect("../#error");
});








// Manhwa's Chapters List
routes.api.chaptersList = {
    path: "/api/manhwa/:manhwaName",
    method: "GET",
    description: "JSON - Get Manhwa's chapeters list."
};
app[routes.api.chaptersList.method](routes.api.chaptersList.path, async (req, res, next) => {
    const { manhwaName } = req.params;
    const manhwaDir = path.join(dirs.manhwas, manhwaName)

    // if manhwa folder exist
    if (manhwaName && fs.existsSync(manhwaDir)) {
        // Get Chapters List, they exist as folders in the Projet dorectory.
        // const chapters = fs.readdirSync(manhwaDir);
        let chaptersList = await readDirectoryRecursive(manhwaDir);

        // response
        return res.json({
            routes,
            manhwaName,
            chaptersList
        });
    };

    // response
    res.status(500).json({ success: false })
});






// Manhwa's Chapter's images List
routes.api.chapterImagesList = {
    path: "/api/manhwa/:manhwaName/:chapterName/imgs",
    method: "GET",
    description: "Manhwa's Chapter's images List."
};
// app.get("/api/manhwa/:manhwaName/:chapterName/imgs", async (req, res) => {
app[routes.api.chapterImagesList.method](routes.api.chapterImagesList.path, async (req, res, next) => {
    const { manhwaName, chapterName } = req.params;
    const chapterDir = path.join(dirs.manhwas, manhwaName, chapterName);

    // if manhwa folder exist
    if (manhwaName && chapterName && fs.existsSync(chapterDir)) {
        // Get Chapters List, they exist as folders in the Projet dorectory.
        // const chapters = fs.readdirSync(chapterDir);
        let imagesList = await readDirectoryRecursive(chapterDir);

        // response
        return res.json({
            routes,
            manhwaName,
            chapterName,
            imagesList
        });
    };

    // response
    res.status(500).json({ success: false })
});







// Get Manhwas List
routes.api.manhwasList = {
    path: "/api/manhwa",
    method: "GET",
    description: "Array - Manhwas List."
};
// app.get("/api/manhwa", async (req, res, next) => {
app[routes.api.manhwasList.method](routes.api.manhwasList.path, async (req, res, next) => {
    // Manhwas are stored as folders
    // const manhwasList = JSON.stringify(fs.readdirSync(dirs.manhwas));
    let manhwasList = await readDirectoryRecursive(dirs.manhwas);
    res.json(manhwasList);
});






// add new manhwa
routes.api.createManhwa = {
    path: "/api/manhwa",
    method: "POST",
    description: "Create a new Manhwa."
};
// app.post("/api/manhwa", (req, res, next) => {
app[routes.api.createManhwa.method](routes.api.createManhwa.path, (req, res, next) => {
    // let title = req.body?.title || req.params?.title || "";
    let title = req.body?.title || "";
    // New manhwa dir Path
    let titlePath = path.join(dirs.manhwas, title)


    // Error title missing
    if (!title) {
        return res.status(400).send({ success: false, note: "Missing Title!" });
    };

    // Error - not accepted naming letters:  \ / : * ? " < > | & # { } % ~ .
    // other might be illegal charectors as well:   
    if (title.match(/[\/?*:"<>|&#{}%~]/)) {
        return res.status(400).send({
            success: false,
            note: `Title can't contain the following characters:    \ / : * ? " < > | & # { } % ~ .`
        });
    };

    // Error - similar title manhwa exist (similar dir)
    if (fs.existsSync(titlePath)) {
        return res.status(400).send({ success: false, note: "manhwa with similar name exist!" });
    }

    // Create new dir
    // fs.mkdirSync(titlePath);
    fs.mkdir(titlePath, { recursive: true }, function (err) {
        // Error
        if (err) {
            console.log(err)
            return res.status(500).send({
                success: false,
                note: `${err}`
            });
        }

        // Success
        return res.status(200).send({
            success: true,
            note: "manhwa created.",
            url: `/manhwa/${title}`
        });
    });

});



// Delete manhwa
routes.api.deleteManhwa = {
    path: "/api/manhwa",
    method: "DELETE",
    description: "Delete a Manhwa."
};
// app.delete("/api/manhwa", (req, res, next) => {
app[routes.api.deleteManhwa.method](routes.api.deleteManhwa.path, (req, res, next) => {
    // let title = req.body?.title || req.params?.title || "";
    let manhwaName = req.body?.title || "";
    // New manhwa dir Path
    let manhwaDirPath = path.join(dirs.manhwas, manhwaName)

    // Error title missing
    if (!manhwaName) {
        return res.status(400).send({ success: false, note: "Missing Title!" });
    };

    // Error - similar title manhwa exist (similar dir)
    if (!fs.existsSync(manhwaDirPath)) {
        return res.status(500).send({ success: false, note: "manhwa doesn't exist!" });
    };

    // Delete Dir
    // fs.rmSync(manhwaDirPath, { recursive: true })
    fs.rm(manhwaDirPath, { recursive: true }, err => {
        // Error - unknown
        if (err) {
            return res.status(500).send({ success: false, note: `${err}` });
        };

        // Success
        return res.status(200).send({
            success: true,
            manhwaName,
            note: "manhwa deleted successfully.",
        });

    });

});







// Create new Chapter
routes.api.createChapter = {
    path: "/api/chapter",
    method: "POST",
    description: "Create a new Chapter."
};
// app.post("/api/chapter", (req, res, next) => {
app[routes.api.createChapter.method](routes.api.createChapter.path, (req, res, next) => {
    // let title = req.body?.title || req.params?.title || "";
    let chapterTitle = req.body?.title || "";
    let manhwaName = req.body?.manhwaName || "";


    // New Chapter dir Path
    let chapterDirPath = path.join(dirs.manhwas, manhwaName, chapterTitle);

    // Error - Chapter Title missing
    if (!manhwaName || !chapterTitle) {
        return res.status(400).send({
            success: false,
            note: `Missing inputs:  
            ${!manhwaName ? "Manhwa name, " : ""}
            ${!chapterTitle ? "Chapter name. " : ""}`
        });
    };


    // Error - not accepted naming letters:  \ / : * ? " < > | & # { } % ~ .
    // other might be illegal charectors as well:   
    if (chapterTitle.match(/[\/?*:"<>|&#{}%~]/)) {
        return res.status(400).send({
            success: false,
            note: `Cahpter name can't contain the following characters:    \ / : * ? " < > | & # { } % ~ .`
        });
    };

    // Error - similar chapter exist (similar dir)
    if (fs.existsSync(chapterDirPath)) {
        return res.status(400).send({ success: false, note: "manhwa with similar name exist!" });
    };


    // Create new dir
    // fs.mkdirSync(chapterDirPath);
    fs.mkdir(chapterDirPath, { recursive: true }, function (err) {
        // Error - unknown
        if (err) {
            console.log(err)
            return res.status(500).send({
                success: false,
                note: `internal error - ${err}`
            });
        }

        // Success
        return res.status(200).send({
            success: true,
            note: "manhwa created.",
            url: `/${manhwaName}/${chapterTitle}`
        });
    });

});




// Delete a Chapter
routes.api.deleteChapter = {
    path: "/api/chapter",
    method: "DELETE",
    description: "Delete a Chapter."
};
// app.delete("/api/chapter", (req, res, next) => {
app[routes.api.deleteChapter.method](routes.api.deleteChapter.path, (req, res, next) => {
    let chapterName = req.body?.title || "";
    let manhwaName = req.body?.manhwa || "";
    const chapterDir = path.join(dirs.manhwas, manhwaName, chapterName)

    // Error title missing
    if (!chapterName || !manhwaName) {
        return res.status(400).send({ success: false, note: "Missing Title!" });
    };

    // Error - similar title manhwa exist (similar dir)
    if (!fs.existsSync(chapterDir)) {
        return res.status(500).send({ success: false, note: "manhwa doesn't exist!" });
    };

    // Delete Dir
    // fs.rmSync(chapterDir, { recursive: true })
    fs.rm(chapterDir, { recursive: true }, err => {
        // Error - unknown
        if (err) {
            return res.status(500).send({ success: false, note: `${err}` });
        };

        // Success
        return res.status(200).send({
            success: true,
            chapterName,
            note: "manhwa deleted successfully.",
        });

    });

});











// Mahwa's Chapter's Uploading page, here you add images.
routes.page.uploader = {
    path: "/manhwa/:manhwaName/:chapterName/upload",
    method: "GET",
    description: "upload & add images to a chapter."
};
// app.get("/manhwa/:manhwaName/:chapterName/upload", async (req, res) => {
app[routes.page.uploader.method](routes.page.uploader.path, async (req, res, next) => {
    const { manhwaName, chapterName } = req.params;
    const chapterDir = path.join(dirs.manhwas, manhwaName, chapterName)

    // if manhwa folder exist
    if (manhwaName && chapterName && fs.existsSync(chapterDir)) {
        // Get Chapters List, they exist as folders in the Projet dorectory.
        // const chapters = fs.readdirSync(chapterDir);
        let imagesList = await readDirectoryRecursive(chapterDir);

        // response
        return res.render("uploader.ejs", {
            routes,
            manhwaName,
            chapterName,
            imagesList: JSON.stringify(imagesList),
            uploadedFiles: JSON.stringify(fs.readdirSync(chapterDir))
        });
    };


    res.send("Something is wrong!");
});



// Uploader - recive and store images.
// Handle file upload
routes.api.multerUploader = {
    path: "/manhwa/:manhwaName/:chapterName/upload",
    method: "POST",
    description: "Recive and store chapter images"
};
// app.post("/manhwa/:manhwaName/:chapterName/upload", multer.array("files", 1), (req, res) => {
app[routes.api.multerUploader.method](routes.api.multerUploader.path, multer.array("files", 1), (req, res, next) => {
    const { manhwaName, chapterName } = req.params;
    const chapterDir = path.join(dirs.manhwas, manhwaName, chapterName)

    if (!req.files) {
        return res.status(400).json({ msg: "No files were uploaded" });
    };



    // if manhwa folder exist
    if (req.files && manhwaName && chapterName && fs.existsSync(chapterDir)) {
        // moving the files from temp to uploads directory
        req.files.forEach(function (file) {
            // Image path
            let inputPath = file.path;
            let outputPath = `${chapterDir}/${file.originalname}`;
            // Just rename images with pathes
            // fs.rename(inputPath, outputPath, function (err) {
            //     if (err) throw err;
            //     // console.log("File Renamed.");
            // });
            // Resize images
            image.resizeWidth({
                inputPath,
                outputPath,
                width: 1080, // pixel
                quality: 80, // %
            })
                .then(metadata => {
                    // delete original image
                    fs.unlink(inputPath, (err) => console.log(err))
                    console.log(`Resized image.`);
                })
                .catch(error => {
                    console.error(error);
                });

        });

        // return the array of uploaded just files
        return res.json({ files: req.files });
    };

});





// Delete a Chapter image
routes.api.deleteChapterImage = {
    path: "/manhwa/:manhwaName/:chapterName/delete/:filename",
    method: "DELETE",
    description: "Delete a chapter image"
};
// app.delete("/manhwa/:manhwaName/:chapterName/delete/:filename", (req, res) => {
app[routes.api.deleteChapterImage.method](routes.api.deleteChapterImage.path, (req, res, next) => {
    const { manhwaName, chapterName, filename } = req.params;
    const chapterDir = path.join(dirs.manhwas, manhwaName, chapterName);
    // file path
    const filePath = path.join(chapterDir, filename);
    // Delete 
    fs.unlink(filePath, (err) => {
        if (err) {
            console.log(err);
            res.status(500).json({
                success: false,
                message: "Error deleting file: " + err,
                filename: filename
            });
        } else {
            res.status(200).json({
                success: true,
                message: "deleted successfully",
                filename: filename
            });
        };
    });
});










// /////////////////////////////////////////////////////////////////////////////////////////

// Get a list of all files completly uploaded to the server, located in "" 
app.get("/files", (req, res) => {
    // console.log(fs?.readFileSync("ss") ?? 0)
    fs.readdir(dirs.manhwas, (err, files) => {
        if (err) {
            console.log(err);
            res.status(500).send("Error reading files");
        } else {
            res.render("files.ejs", { files: JSON.stringify(files) });
        };
    });
});





// -----------------------------------------------------------
// Explorer
app.get("/explorer", (req, res) => {
    res.render("explorer.ejs")
});

app.get("/explorer/json", async (req, res) => {
    var fileList = await readDirectoryRecursive(dirs.manhwas);
    res.status(200).json(fileList);
});



// 
async function readDirectoryRecursive(dir, fileList = []) {
    await fs.readdirSync(dir).forEach(file => {
        let filePath = path.join(dir, file);
        let fileDetails = {};
        fileDetails.name = file;
        try {
            fileDetails.isDirectory = fs.lstatSync(filePath).isDirectory();
            fileDetails.size = fs.lstatSync(filePath).size; // bytes
            fileDetails.created = fs.lstatSync(filePath).birthtime;
            fileDetails.modified = fs.lstatSync(filePath).mtime;
            if (fileDetails.isDirectory) {
                fileDetails.contents = [];
                readDirectoryRecursive(filePath, fileDetails.contents);
            }
        } catch (error) {
            console.log(error);
        };
        // Save data
        fileList.push(fileDetails);
    });
    // Return result
    return fileList;
};







// # 

// Directories
const tempDir = dirs.tempUploads;


// --- When server starts, make "tempDir" folder empty
// Method 1
// if (fs.existsSync("uploads/temp")) {
// fs.readdirSync(tempDir).forEach(file => {
//     fs.unlink(`${tempDir}/${file}`, err => {
//         // if (err) console.error(`Error deleting file ${file}: ${err}`);
//     })
// })
// };
// Method 2
fs.readdir(tempDir, (err, files) => {
    if (err) console.log(err);
    // Delete files in the folder
    else files.forEach(file => {
        fs.unlink(`${tempDir}/${file}`, (err) => {
            // if (err) console.error(`Error deleting file ${file}: ${err}`);
        })
    });
});


// --- Check if "tempDir" folder exist?

// Function to check and create the "tempDir" folders
const checkAndCreateFolders = () => {

    // Check if the "tempDir" folder exists 
    if (!fs.existsSync(tempDir)) {
        // If it doesn't exist, create it
        fs.mkdirSync(tempDir);
    }
};

// Call the function to check and create the folders on initial load
checkAndCreateFolders();




// --- Listen for changes in the file system
// This event listener is for whenever "tempDir" is deleted then it will be created again
// fs.watch("./", { recursive: true }, (eventType, filename) => {
//     if (eventType === "rename") {
//         // If a folder is deleted, check and create the "uploads" and "temp" folders again
//         checkAndCreateFolders();
//     }
// });






// routes
// app.get("/routes", (req, res) => {
app[routes.api.routes.method](routes.api.routes.path, (req, res, next) => {
    res.json(routes);
});


// 404
app.get("*", (req, res, next) => res.redirect("/"));




