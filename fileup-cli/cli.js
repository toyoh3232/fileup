#!/usr/bin/env node
const { program } = require("commander");
const got = require("got");
const { Select } = require("enquirer");
const FormData = require('form-data');
const fs = require('fs/promises');
const {createReadStream} = require('fs');
const process = require('process');

if (!process.env.FILEUPSERVER) {
  console.log("error: environment variable FILEUPSERVER is not set");
  process.exit(1);
}
var serveraddr =  process.env.FILEUPSERVER.trimStart().trimEnd();

if (!serveraddr.startsWith("http://")) serveraddr = "http://" + serveraddr;
if (!serveraddr.endsWith("/")) serveraddr = serveraddr + "/";


const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'K', 'M', 'G', 'T'];

  var i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
};

program.version("0.0.1");
program.name("fileup");
program.description("File Upload/Delete Commandline Client");

program
  .command("list")
  .description("list all uploaded files")
  .action(() => {
    got(`${serveraddr}list?detailed=true`, { responseType: "json" })
      .then(({ body }) => {
        if (body.meta.error) {
          console.log(body.meta.msg);
        } else {
          console.log(`total ${body.data.length} file(s)`);
          for (file of body.data) {
            console.log(
              `${file.uploaddate} ${formatBytes(file.size).padStart(8, ' ')} ${file.filename}`
            );
          }
        }
      })
      .catch((err) => {
        console.log(`error: ${err.message}`);
      });
  });

program
  .command("delete <filename>")
  .description("delete file")
  .action((filename) => {
    got(`${serveraddr}list?detailed=true&filename=${filename}`, {
      responseType: "json",
    })
      .then(({ body }) => {
        if (body.meta.error) throw body.meta.msg;
        if (body.data.length == 0) throw {message:"error: file not found"};
        if (body.data.length == 1)
          return body.data[0].id;
        // if more than 1 file is with the this filename
        // prompt to selection
        console.log(`\nOops, more than one '${filename}' exists.\n`);
        var choices = [];
        for (file of body.data) {
          choices.push({
            name: `${file.filename} uploaded at ${file.uploaddate}`,
            value: file.id,
          });
        }
        var prompt = new Select({
          message:
            "which do you want to delete?",
          choices: choices,
        });
        return prompt
          .run()
          .then((answer) => choices.find((x) => x.name === answer).value);
      })
      .then((uuid) => {
        return got(`${serveraddr}delete?uuid=${uuid}`, {
          responseType: "json",
        }).then(({ body }) => body.meta.msg);
      })
      .then((msg) => {
        console.log(msg);
      })
      .catch((err) => {
        console.log(`error: ${err.message}`);
      });
  });

  program
  .command("upload <filename>")
  .description("upload file")
  .action((filename) => {
    fs.stat(filename).then(() => {
      var form = new FormData();
      form.append('file', createReadStream(filename));
      return got(`${serveraddr}upload`, {
        responseType: "json",
        body: form,
        method: "POST"
      }).then(({ body }) => body.meta.msg);
    })
    .then(msg => {
      console.log(msg);
    })
    .catch((err) => {
      console.log(`error: ${err.message}`);
    });
  });

program.parse(process.argv);
