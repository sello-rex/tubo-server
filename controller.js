const ytdl = require('ytdl-core');
const readline = require('readline');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
ffmpeg.setFfmpegPath(ffmpegPath.path);
const MP3_DIRECTORY = `${__dirname}/public/downloads/mp3/`;
const MP4_DIRECTORY = `${__dirname}/public/downloads/mp4/`;
const timeToDelete = 1000 * 60 * 30;// 30minutes 

const FORMATS = Object.freeze({
  MP3: 'mp3',
  MP4: 'mp4'
});

function deleteFile(fileName, type){
  let directory = '';

  switch (type) {
    case 'mp3':
      directory = MP3_DIRECTORY + fileName;
      break;
    case 'mp4':
      directory = MP4_DIRECTORY + fileName;
      break;
    default:
      break;
  }

  setTimeout( () =>{
    fs.unlink(directory, (err)=>{
      console.log(fileName, 'deleted!!');
    });
  }, timeToDelete);
}

function convertToMp4(url, videoDetails){
  return new Promise( (resolve, reject) =>{
    const fileName = `${videoDetails.title}.${FORMATS.MP4}`;;

    fs.existsSync(MP4_DIRECTORY) ? 
      null :
      fs.mkdirSync(MP4_DIRECTORY, {recursive: true});

    const output = path.resolve(MP4_DIRECTORY, fileName);

    const video = ytdl(url);
    let starttime;
    video.pipe(fs.createWriteStream(output));
    video.once('response', () => {
      starttime = Date.now();
    });
    video.on('error', (error) => {
      reject(error.messsage);
    });
    video.on('progress', (chunkLength, downloaded, total) => {
      const percent = downloaded / total;
      const downloadedMinutes = (Date.now() - starttime) / 1000 / 60;
      const estimatedDownloadTime = (downloadedMinutes / percent) - downloadedMinutes;
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(`${(percent * 100).toFixed(2)}% downloaded `);
      process.stdout.write(`(${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB)\n`);
      process.stdout.write(`running for: ${downloadedMinutes.toFixed(2)}minutes`);
      process.stdout.write(`, estimated time left: ${estimatedDownloadTime.toFixed(2)}minutes `);
      readline.moveCursor(process.stdout, 0, -1);
    });
    video.on('end', () => {
      resolve({fileName, format: FORMATS.MP4});
      deleteFile(fileName, FORMATS.MP4);
    });
  });
}

function convertToMp3(url, videoDetails){
  return new Promise( (resolve, reject) => {
    const fileName = `${videoDetails.title}.${FORMATS.MP3}`;
    
    let stream = ytdl(url, {
      quality: 'highestaudio',
    });

    fs.existsSync(MP3_DIRECTORY) ? 
      null :
      fs.mkdirSync(MP3_DIRECTORY, {recursive: true});

    ffmpeg(stream)
    .audioBitrate(128)
    .save(`${MP3_DIRECTORY}${fileName}`)
    .on('progress', p => {
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(`${p.targetSize}kb downloaded`);
    })
    .on('error', (error) =>{
      // fastify.log.error(error);
      reject(error.message);
    })
    .on('end', () => {
      resolve({fileName, format: FORMATS.MP3});
      deleteFile(fileName, FORMATS.MP3);
    });
  });
}

exports.convert = async (req, res) => {

  const { url, format } = req.query;
  
  try {

    const info = await ytdl.getBasicInfo(url);

    let result;
    switch (format) {
      case FORMATS.MP3:
        result = await convertToMp3(url, info.videoDetails);
        break;
      case FORMATS.MP4:
        result = await convertToMp4(url, info.videoDetails);
        break;
      default:
        throw new Error('Unknown format');
    }

    res.status(200).json({sucess: true, file: result});
  } catch (error) {
    res.status(500).json({success: false, error})
  }
}

exports.download = (req, res) => {
  const { filename, format } = req.query;
  res.download(`${__dirname}/public/downloads/${format}/${filename}`, filename);
};