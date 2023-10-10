const sharp = require('sharp');
const path = require('path');


// This function will be used to resize images to a specific width then save them.

// Resize image:
//  only resize width, hight will be automatically estimated.
exports.resizeWidth = async function ({
    inputPath,
    width = 720, //pixels
    outputPath = null, // by default, if not set, == inputpath + "_resized"
    quality = 100,
}) {
    // input
    inputPath = {
        path: path.join(inputPath),
        ...path.parse(inputPath)
    };
    // output
    // default: appended "_resized" to the filename
    // outputPath = outputPath ? path.join(outputPath) : inputPath.path.replace(/(\.[^\/\\]+)$/i, '_resized$1'); //  /(\.[\w\d_-]+)$/i
    outputPath = outputPath ? path.join(outputPath) : path.format({
        dir: inputPath.dir,
        name: `${inputPath.name}_resized`,
        ext: '.jpeg'
    });


    // Load the image from the file path
    const image = sharp(inputPath.path);

    // Quality: 
    //  80 - is the best for compressing & keep good details.
    image.jpeg({ quality });

    // // Get the current image metadata, including the current width
    // const metadata = await image.metadata();
    // const currentWidth = metadata.width;

    // // Calculate the height based on the desired width and current aspect ratio
    // const height = Math.round(metadata.height * width / currentWidth);

    // Resize the image to the desired width and height
    // const resizedImage = await image.resize(width, height);
    const resizedImage = await image.resize(width);


    // Save the resized image to the output file
    await resizedImage.toFile(outputPath);


    // Done
    return {
        path: outputPath,
        metadata: await sharp(outputPath).metadata(),
    };
};





// // Example
// const imagePath = 'image.png';
// const desiredWidth = 720;

// resizeImage(imagePath, desiredWidth)
//     .then(resizedImagePath => {
//         console.log(`Resized image saved to ${resizedImagePath}`);
//     })
//     .catch(error => {
//         console.error(error);
//     });





// ================================================================
// Compress images
exports.compress = async function ({ inputPath, outputPath = null, quality = 100 }) {
    // outputPath = outputPath || inputPath.replace(/(\.[^\/\\]+)$/i, `_${quality}%$1`);
    outputPath = outputPath || inputPath.replace(/(\.[^\/\\]+)$/i, `_compressed$1`);


    // Load image
    const image = sharp(inputPath);

    // Quality
    //  80 - is the best for compressing & keep good details.
    image.jpeg({ quality });

    // Save
    await image.toFile(outputPath);

    // Done
    return {
        path: outputPath,
        metadata: await sharp(outputPath).metadata()
    };
};