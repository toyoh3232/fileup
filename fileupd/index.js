const express = require('express');
const multer = require("multer");
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sanitize = require("sanitize-filename");

const app = express();
const port = 5432;
const uploadpath = "./uploads/";
const maxfilename = 255 - path.resolve(uploadpath).length - 36 - 1;
const uuidpattern = /[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}/;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadpath);
    },
    filename: (req, file, cb) => {
        console.log(file);
        if (sanitize(file.originalname) !== file.originalname)
            cb (new Error("filename contains illegal characters"), "illegal characters")
        else if (path.join(uploadpath,file.originalname).length > 255)
            cb (new Error(`filename is too long, must equal or less than ${maxfilename}`), "if file name too long")
        else
            cb(null, uuidv4() + file.originalname);
    }
});

const option = {
    storage:storage, 
    limits: {
        files: 1,
        fileSize: 4*1024*1024*1024,
        
    }};
const uploader = multer(option).single('file');

app.get("/list", (req, res) => {
    fs.readdir(uploadpath, (err, files) => {
        if (err)
            res.status(400).json({
                meta: {
                    msg: err.message,
                    error: true,
                    status: 400
                }});
        else {
            res.status(200).json({data: files.reduce((acc, cur) => {
                var indexes = uuidpattern.exec(cur);
                if (indexes && indexes.index == 0) {
                    var uuid = cur.substr(0,36);
                    var filename = cur.substr(36);
                    acc[uuid] = filename;
                }
                return acc;
            },{}),
            meta: {
                msg : "ok",
                error : false,
                status : 200
            }});
        }
    });
});

app.get("/delete", (req, res) => {
    if (!req.query["uuid"]){
        return res.status(400).json({meta: {
            msg: "need parameter uuid",
            error: true,
            status: 400
        }});
    }
    var uuid = req.query["uuid"];
    if (!uuid.match(uuidpattern)) {
        return res.status(400).json({meta: {
            msg: "error format uuid",
            error: true,
            status: 400
        }});
    }
    fs.readdir(uploadpath, (err, files) => {
        if (err)
            res.status(400).json({
                meta: {
                msg: err.message,
                error: true,
                status: 400
            }});
        else {
            var filename = files.find(name => name.startsWith(uuid));
            if (!filename) {
                res.status(400).json({meta: {
                    msg: "file not found",
                    error: true,
                    status: 400
                }});
            } else {
                var fullname = path.join(uploadpath, filename);
                var newfullname = path.join(uploadpath, `-${filename}`);
                fs.rename(fullname,newfullname, (err) => {
                    if (err) {
                        res.status(400).json({meta: {
                            msg: "delete file error",
                            error: true,
                            status: 400
                        }});
                    }
                    else {
                        res.status(200).json({meta: {
                            msg: "ok",
                            error: false,
                            status: 200
                        }});
                    }
                });
            }
        }
    });
});

app.post("/upload", (req, res) => {
    uploader(req, res, (err) => {
        if (err) {
            res.status(400).json({meta: {
                msg: err.message,
                error: true,
                status: 400
            }});
        } else if (!req.file) {
            res.status(400).json({meta: {
                msg: "no multpart data",
                error: true,
                status: 400
            }});
        } else {
            res.status(200).json({meta: {
                msg: "ok",
                error: false,
                status: 200
            }});
        }
    });
});

app.listen(port, () => {
    console.log(`listen on ${port}`);
});
