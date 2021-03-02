const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const sanitize = require("sanitize-filename");
const cors = require('cors')
const moment = require('moment');
const process = require('process');
const app = express();
app.use(cors());

const host = '0.0.0.0';
const port = 54321;
var uploadpath = "./uploads";
if (process.env.FILEUPSAVEDIR)
  uploadpath = path.join(process.env.FILEUPSAVEDIR, "./");

const maxfilename = 255 - path.resolve(uploadpath).length - 36 - 1;
const uuidpattern = /[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}/;

// create the directory to store files if not exist
try {
  fs.mkdirSync(uploadpath,{recursive: true});
} catch (err) {
  console.log(`error: ${err.message}`);
  process.exit(1);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadpath);
  },
  filename: (req, file, cb) => {
    if (sanitize(file.originalname) !== file.originalname)
      cb(
        new Error("filename contains illegal characters"),
        "if illegal characters exsits, this error arises"
      );
    else if (path.join(uploadpath, file.originalname).length > 255)
      cb(
        new Error(
          `filename is too long, must equal or less than ${maxfilename}`
        ),
        "if file name too long, this error arises"
      );
    else cb(null, uuidv4() + file.originalname);
  },
});

const option = {
  storage: storage,
  limits: {
    files: 1,
    fileSize: 4 * 1024 * 1024 * 1024,
  },
};
const uploader = multer(option).single("file");

app.get("/list", (req, res) => {
  fs.readdir(uploadpath, (err, files) => {
    if (err)
      res.status(400).json({
        data:[],
        meta: {
          msg: `error: ${err.message}`,
          error: true,
          status: 400,
        },
      });
    else {
      res.status(200).json({
        data: files.reduce((acc, cur) => {
          var indexes = uuidpattern.exec(cur);
          if (indexes && indexes.index == 0) {
            var uuid = cur.substr(0, 36);
            var filename = cur.substr(36);
            if (req.query["filename"] && req.query["filename"] !== filename)
              return acc;
            if (req.query["detailed"] === "true"){
            var stat = fs.statSync(path.join(uploadpath, cur));
              acc.push( {
                id: uuid,
                filename: filename,
                uploaddate: 
                  moment(stat.birthtime).format("MM/DD/YYYY hh:mm:ss"),
                size: stat.size
              });
            }
            else acc.push( {id:uuid, filename: filename});
          }
          return acc;
        }, []),
        meta: {
          msg: "ok",
          error: false,
          status: 200,
        },
      });
    }
  });
});

app.get("/delete", (req, res) => {
  if (!req.query["uuid"]) {
    return res.status(400).json({
      data: [],
      meta: {
        msg: "error: need parameter uuid",
        error: true,
        status: 400,
      },
    });
  }
  var uuid = req.query["uuid"];
  if (!uuid.match(uuidpattern)) {
    return res.status(400).json({
      data: [],
      meta: {
        msg: "error: invalid format uuid",
        error: true,
        status: 400,
      },
    });
  }
  fs.readdir(uploadpath, (err, files) => {
    if (err)
      res.status(400).json({
        data: [],
        meta: {
          msg: `error: ${err.message}`,
          error: true,
          status: 400,
        },
      });
    else {
      var filename = files.find((name) => name.startsWith(uuid));
      if (!filename) {
        res.status(400).json({
          data: [],
          meta: {
            msg: "error: file not found",
            error: true,
            status: 400,
          },
        });
      } else {
        var fullname = path.join(uploadpath, filename);
        var newfullname = path.join(uploadpath, `-${filename}`);
        fs.rename(fullname, newfullname, (err) => {
          if (err) {
            res.status(400).json({
              data: [],
              meta: {
                msg: "error: deletion failed",
                error: true,
                status: 400,
              },
            });
          } else {
            res.status(200).json({
              data: [],
              meta: {
                msg: "1 file deleted.",
                error: false,
                status: 200,
              },
            });
          }
        });
      }
    }
  });
});

app.post("/upload", (req, res) => {
  uploader(req, res, (err) => {
    if (err) {
      res.status(400).json({
        data: [],
        meta: {
          msg: err.message,
          error: true,
          status: 400,
        },
      });
    } else if (!req.file) {
      res.status(400).json({
        data: [],
        meta: {
          msg: "no multpart data",
          error: true,
          status: 400,
        },
      });
    } else {
      res.status(200).json({
        data: [],
        meta: {
          msg: "1 file is uploaded successfully.",
          error: false,
          status: 200,
        },
      });
    }
  });
});

app.listen(port, host, () => {
  console.log(`listen on http://${host}:${port}`);
  console.log(`file uploaded save into ${uploadpath}`);
});
