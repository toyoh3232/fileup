#!/usr/bin/env node
const { program } = require('commander');
const got = require('got');
const { Select } = require('enquirer');

program.version('0.0.1');

program
  .command('list')
  .description('list all uploaded files')
  .action(() => {
    got("http://127.0.0.1:5432/listmore",{responseType: 'json'}).then(({ body }) => {
        if (body.meta.error) {
            console.log(body.meta.msg);
        } else {
            for (uuid in body.data) {
                console.log(`${body.data[uuid].updated_date} ${body.data[uuid].filename}`);
            } 
        }
      }).catch((err) => {
        console.log(err);
      });
  });

program
  .command('del <filename>')
  .description('delete file')
  .action(() =>{
    var choices = [{name:'apple', value:1},{name:'grape',value:2}];
    var prompt = new Select({
        name: 'color',
        message: 'Pick a flavor',
        choices: choices
      });
      prompt.run().then(answer => console.log('Answer:', choices.find(x => x.name === answer).value))
      .catch(console.error);
      console.log('delete');
  });

program.parse(process.argv);

