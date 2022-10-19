const redis = require('redis');
const publisher = redis.createClient();
const client = redis.createClient();
const subscriber = client.duplicate();
const { cwd } = require("node:process") //? core module
const location = cwd()
publisher.connect();
subscriber.connect();
//* for logoLocation parameters :"center", "west", "east", "north", "south", "southeast", "southwest", "northeast", "northwest"

//* Send a data to  Microservice
const makeAPictureWithLogo = async () => {
    const data = {
        imagePath: location + "/myphoto.jpg",
        logoPath: location + "/myLogo.png",
        logoLocation: "northwest",
        pathOfoutputImage: location + "/output.jpg",
        logoSize: "500"
    }
    await publisher.publish('ahmtcntrnLogoProject', JSON.stringify(data));
}

//* get feedback from Microservice
const getInfoMicroServices = async () => {
    await subscriber.subscribe('logoProjectFeedback', (message) => {
        console.log(JSON.parse(message));
    });
}

makeAPictureWithLogo()
getInfoMicroServices()