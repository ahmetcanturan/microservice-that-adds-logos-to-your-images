//? npm i sharp redis
const sharp = require("sharp")
const fs = require("fs")
const redis = require('redis');
const { url } = require("./connect.json")
const publisher = redis.createClient(url);
const client = redis.createClient(url);
const subscriber = client.duplicate();
console.log("Microservice is Activated..")
const paramsValidator = (...x) => {
    let i = 0
    for (const iterator of x) {
        if (typeof (iterator) !== "string") {
            return { error: true, message: `it must be string : ${iterator}` }
        }
        if (i < 2) {
            if (!fs.existsSync(iterator)) {
                return { error: true, message: `there is no such file ${iterator}` }
            }
        }
        if (i == 2) {
            const logoLocationFormats = ["center", "west", "east", "north", "south", "southeast", "southwest", "northeast", "northwest"]
            if (logoLocationFormats.indexOf(iterator) == -1) {
                return { error: true, message: `LogoLocation Error: It can only contain:${logoLocationFormats}` }
            }
        }
        if (i == 3) {
            if (!(iterator.includes(".png") || iterator.includes(".jpg"))) {
                return { error: true, message: `Format Error: Outputphoto format can only be "jpg" and "png":${iterator}` }
            }
        }
        if (i == 4) {
            if (!Number(iterator)) {
                return {
                    error: true, message: `LogoSize Error: LogoSize must be in double quotes forexample:"100","200" Not Such:${iterator}`
                }
            }
        }
        i = i + 1;
    }
    return null
}

const addYourLogo = async (imagePath, logoPath, logoLocation, pathOfoutputImage, logoSize) => {
    return new Promise((resolve, reject) => {
        const validator = paramsValidator(imagePath, logoPath, logoLocation, pathOfoutputImage, logoSize)
        if (validator !== null) { return reject(validator) }
        sharp(logoPath)
            .resize({
                fit: sharp.fit.contain,
                height: Number(logoSize)
            })
            .toBuffer({ resolveWithObject: true })
            .then(({ data, info }) => {
                sharp(imagePath)
                    .composite([{
                        input: data,
                        gravity: logoLocation
                    }])
                    .toFile(pathOfoutputImage, function (err) {
                        if (err) {
                            console.log("Error: ", err)
                            return reject({ error: true, message: `Logo Error: Logo must have same dimensions or smaller than image. Try reduce LogoSize parameter`, detail: String(err) })
                        }
                        else resolve({ error: false, status: true, message: "Success , Thanks To Me", info })
                    })
            })
            .catch(err => {
                console.log("Error: ", err);
                reject({ error: true, detail: String(err) })
            })
    })
}

const feedback = async (info) => {
    await publisher.publish('logoProjectFeedback', JSON.stringify(info));
}

const takeOnAssignment = async () => {
    await subscriber.connect();
    await publisher.connect();
    await subscriber.subscribe('ahmtcntrnLogoProject', (data) => {
        const { imagePath, logoPath, logoLocation, pathOfoutputImage, logoSize } = JSON.parse(data)
        addYourLogo(imagePath, logoPath, logoLocation, pathOfoutputImage, logoSize)
            .then(e => {
                console.log(e)
                feedback(e)
            })
            .catch(err => {
                console.log(err)
                feedback(err)
            })
    })
}
takeOnAssignment()