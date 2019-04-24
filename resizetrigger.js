/*
module.exports = async function (context, myBlob) {
    context.log("JavaScript blob trigger function processed blob \n Name:", context.bindingData.name, "\n Blob Size:", myBlob.length, "Bytes");
};
*/

const storage = require('azure-storage');
const qs = require('querystring');
var Jimp = require('jimp');

/* CONFIGURATION STARTS */
const storageConnectionString='DefaultEndpointsProtocol=https;AccountName=ryderlapoc;AccountKey=yKd2+D3ICxpKaGmraPItJyuGv+r6oCmTNc1gCFTDYxbbbOj+/RVmYq0e9INn6eMCT1TqfIFA1w6DyxQjf29c/A==;EndpointSuffix=core.windows.net';

const containerName='demo';//Configuration
var maxWidth=500;
var maxHeight=500;
var thumbWidth=150;
var thumbHeight=150;

var containerNameResize='resized';
var containerNameThumb='thumbnail';

/* CONFIGURATION ENDS */


/* Blob storage service initialization starts */

const blobService = storage.createBlobService(storageConnectionString);

const uploadBase64Image = async (containerName, blobName, text,type) => {
    return new Promise((resolve, reject) => {
        blobService.createBlockBlobFromText(containerName, blobName, text, {contentType:type}, err => {
            if (err) {
                reject(err);
            } else {
                resolve({ message: `Text "${text}" is written to blob storage` });
            }
        });
    });
};

/* Blob storage service initialization ends */



module.exports = async function (context, myBlob) {
   
    var bufferOne=myBlob;    
    var imageType= context.bindingData.name.split('.').pop();
    
    var imageRes=await Jimp.read(bufferOne);

    var resPromise= imageRes
        .resize(thumbWidth, thumbHeight)
        .quality(100)
        .getBuffer(Jimp.AUTO,async(err,outputBufferThumb)=>{
            try{
                var output=await uploadBase64Image(containerNameThumb, context.bindingData.name, outputBuffer,imageType);
            }catch (error) {
                //Handle erorr
            }


    var imageWidth=imageRes.getWidth();
    var imageHeight=imageRes.getHeight();
    var ratio =imageWidth/imageHeight;
    
    var resizeWidth;
    var resizeHeight;

    if( ratio > 1) {
        resizeWidth = maxWidth;
        resizeHeight = maxHeight/ratio;
    }else {
        resizeWidth = maxWidth*ratio;
        resizeHeight = maxHeight;
    }
    
    //Resize starts
    if(imageWidth>resizeWidth || imageHeight>resizeHeight){ 
       
        var resPromise= imageRes
        .resize(resizeWidth, resizeHeight)
        .quality(100)
        .getBuffer(Jimp.AUTO,async(err,outputBuffer)=>{            
            try{
                var fileName=context.bindingData.name;
                var output=await uploadBase64Image(containerNameResize, fileName, outputBuffer,imageType); ////Upload resized one
                response={success:true};
                context.res = {body:response};
            }catch (error) {
                response={success:false,errordesc:error};
                context.res = {body:response};
            }

        });
    }else{
        try{
                var fileName=context.bindingData.name;
                var output=await uploadBase64Image(containerNameResize, fileName, bufferOne,imageType); //Upload original one
                response={success:true};
                context.res = {body:response};
            }catch (error) {
                response={success:false,errordesc:error};
                context.res = {body:response};
            }
            
        context.res={body:"no need of resize - Width: "+imageWidth+"Image Height : "+imageHeight}

    }

            


    //context.res={body:"success"}

    context.done();

} );
}

function processThumbnail(imageResThumb){
        // Thumbnail Generation
    context.log("***"+thumbWidth);
    context.log("***"+thumbHeight);

    var resPromise= imageResThumb
        .resize(thumbWidth, thumbHeight)
        .quality(100)
        .getBuffer(Jimp.AUTO,async(err,outputBuffer)=>{
            try{
                var output=await uploadBase64Image(containerNameThumb, context.bindingData.name, outputBuffer,imageType);
            }catch (error) {
            }


        })
        return true;

}
