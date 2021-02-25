#!/usr/bin/env node
const { program } = require("commander");
const got = require("got");
const { Select } = require("enquirer");

program.version("0.0.1");

program
  .command("list")
  .description("list all uploaded files")
  .action(() => {
    got("http://127.0.0.1:5432/list?detailed=true", { responseType: "json" })
      .then(({ body }) => {
        if (body.meta.error) {
          console.log(body.meta.msg);
        } else {
          for (uuid in body.data) {
            console.log(
              `${body.data[uuid].uploaddate} ${body.data[uuid].filename}`
            );
          }
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });

program
  .command("delete <filename>")
  .description("delete file")
  .action((filename) => {
    got(`http://127.0.0.1:5432/list?detailed=true&filename=${filename}`, {
      responseType: "json",
    })
      .then(({ body }) => {
        if (body.meta.error) throw body.meta.msg;
        if (Object.keys(body.data).length == 0) throw "error: file not found";
        if (Object.keys(body.data).length == 1)
          return Object.keys(body.data)[0];
        var choices = [];
        for (uuid in body.data) {
          choices.push({
            name: `${body.data[uuid].filename} upload at ${body.data[uuid].uploaddate}`,
            value: uuid,
          });
        }
        var prompt = new Select({
          message:
            "Oops, we have many files with the same name. which do you want to delete?",
          choices: choices,
        });
        return prompt
          .run()
          .then((answer) => choices.find((x) => x.name === answer).value);
      })
      .then((uuid) => {
        return got(`http://127.0.0.1:5432/delete?uuid=${uuid}`, {
          responseType: "json",
        }).then(({ body }) => body.meta.msg);
      })
      .then((msg) => {
        console.log(msg);
      })
      .catch((err) => {
        console.error(err);
      });
  });

program.parse(process.argv);
