const express = require('express');
const multer = require("multer");
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 5432;
const uploadpath = "uploads";
const uuidpattern = "[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadpath);
    },
    filename: (req, file, cb) => {
        console.log(file);
        cb(null, uuidv4() + file.originalname);
    }
});

app.get("/list", (req, res) => {
    fs.readdir(uploadpath, (err, files) => {
        if (err)
            // TODO
            console.log(err);
        else {
            res.status(200).json({data: files.reduce((acc, cur) => {
                if (cur.match(uuidpattern)) {
                    var uuid = cur.substr(0,36);
                    var filename = cur.substr(36);
                    acc[uuid] = filename;
                }
                return acc;
            },{}),
            meta: {
                msg : "ok",
                error : "false",
                status : 200
            }});
        }
    });
});

app.post("/upload", multer({ storage:storage }).single('file'), (req, res) => {
    console.log(req.file.path, req.file.originalname);
    res.end("uploaded");
});

app.listen(port, () => {
    console.log(`listen on ${port}`);
});
