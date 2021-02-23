const express = require('express');
const multer = require("multer");
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 5432;
const uploadpath = ".uploads";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadpath);
    },
    filename: (req, file, cb) => {
        console.log(file);
        cb(null, uuidv4() + "_" + file.originalname);
    }
});

app.get("/list", (req, res) => {
    res.status(200).json("TODO");
});

app.post("/upload", multer({ storage:storage }).single('file'), (req, res) => {
    console.log(req.file.path, req.file.originalname);
    res.end("uploaded");
});

app.listen(port, () => {
    console.log(`listen on ${port}`);
});
