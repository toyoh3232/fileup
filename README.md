# Fileup

Fileup is simple file upload manager, with basic functions like uploading and deleting. It provides a commandline based client, a a server, both implemented in Nodejs, and a web based client, which is implemented in Elm.

## Installation

The server and web based client could be installed by Docker in one step.

### fileup-server

```bash
docker build -t toyoharu/fileup-server ./fileup-server
docker run -p 54321:54321 -d toyoharu/fileup-server
```

### fileup-web

```bash
docker build -t toyoharu/fileup-web ./fileup-web
docker run -p 54322:8080 -d toyoharu/fileup-web
```
Now you could open a browser and type http://127.0.0.1:54322 and start testing it in production mode.

If you machine is behind a proxy, make sure *http_proxy* and *https_proxy* enviroment variables are set correctly in Dockerfile.

### fileup-cli

The commandline based client is just a nodejs package with. you could install it by:

```bash
npm install -g ./fileup-cli/packed/fileup-cli-1.0.1.tgz
```
Now the command fileup is in your PATH, you could simply type it in the terminal then it will show you the usage.

```bash
export FILEUPSERVER=127.0.0.1:54321
fileup
Usage: fileup [options] [command]

File Upload/Delete Commandline Client

Options:
  -V, --version      output the version number
  -h, --help         display help for command

Commands:
  list               list all uploaded files
  delete <filename>  delete file
  upload <filename>  upload file
  help [command]     display help for command
```
Notice that the enviroment variable FILEUPSERVER should be set before calling this commandline based client. The way to define environment variables is different in cmd, powershell or bash.


## Development & Test

You should have the following tools the in system envitoment.


- npm >= 7.6.0
- nodejs >= 14.16
- elm >= 0.19.1
- create-elm-app >= 5.22.0

### fileup-server and fileup-web

The following commands could be used to test fileup server and fileup web client. The default port for the server is 54321. You could change it in app.js.
```bash
npm run server
npm run web
```
Sorry for that I did not provide a .env solution for a better config management in development. 

### fileup-cli

The test of the commandline based client is under the help of npm-link.
```bash
cd fileup-cli
npm install
npm link
```
Now a global symlink for this package is installed in the global node_modules folder.
Your could run the command *fileup* without reinstallation when the file *cli.js* si modified.

```bash
export FILEUPSERVER=127.0.0.1:54321 
fileup
Usage: fileup [options] [command]

File Upload/Delete Commandline Client

Options:
  -V, --version      output the version number
  -h, --help         display help for command

Commands:
  list               list all uploaded files
  delete <filename>  delete file
  upload <filename>  upload file
  help [command]     display help for command
```
## Acknowledgement

 Thank you for checking my code. I apologize that I did not write enough comments on my code, which is not a good practice on real project and the implementation is still not so robust.
 I am not an expert on the front side but if you have any question, please feel free to contact me.

