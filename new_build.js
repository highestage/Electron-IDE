const packager = require('electron-packager');
const { FolderOperations } = require('./folder_operations');

FolderOperations.prototype.createFolder = function(){
    // return new Promise((resolve, reject) => {
    //     packager.createFolder(folderName, (err, folder) => {
    //         if(err){
    //             reject(err);
    //         }
    //         resolve(folder);
    //     });
    // });
    console.log('createFolder');
};


console.log(packager.length);

// packager({
//     dir: '../src',
//     out: './dist',
//     arch: 'all',
//     platform: 'all',
//     overwrite: true
// }, (err, appPath) => {
//     console.log(err);
//     console.log(appPath);
// });


var sourceDirectory;



/**
 * process for building the app:
 * 1. get the source directory
 * 2. make the destination directory
 * 3. check if 'javascript-obfuscator' is required
 * 4. check if 'bytenode'/'v8 snapshots' is required
 * 5. check if asar has to be made
 * 6. get any values required for electron-packager
 * 7. make binaries (if macos, check if user wants universal binaries)
 * 8. sign the binaries if needed
 * 9. open the location of the final binary(or binaries)
 * 
 * 
 * the user will have to pass the config file, since not all platforms will have options to compile for all architectures
 * mac: config.mac.json
 * windows: config.win.json
 * linux: config.linux.json
 * 
 * 
 * all possible flags: node build.js config.mac.json --sign --javascript-obfuscator --asar --bytenode --open-build-dir
 */

var builderOptions = {
    signingEnabled: false,
    javascriptObfuscator: false,
    asar: false,
    bytenode: false,
    openBuildDir: false
}

var cliArguments = process.argv;








class Electron {

    // setup the options for the signing script
    constructor(cliArguments) {
        // go through all arguments and enable the ones passed
        for (argument in cliArguments) {
            switch (cliArguments) {
            case '--sign':
                // sign the app
                builderOptions.signingEnabled = true;
                break;
            case '--javascript-obfuscator':
                // obfuscate the code
                builderOptions.javascriptObfuscator = true;
                break;
            case '--asar':
                // make asar
                builderOptions.asar = true;
                break;
            case '--bytenode':
                // compile js files to bytenode - how they are implemented are on the user
                builderOptions.bytenode = true;
                break;
            case '--open-build-dir':
                // open the final build directory
                builderOptions.openBuildDir = true;
                break;
            }
        }
    }

    // make the directory for the app
    makeDirectory(destination) {
        var resolvedPath = path.resolve(destination)

        console.log(`Creating directory: ${resolvedPath}`);
        // check if the directory exists
        if (!existsSync(resolvedPath)) {
            console.log(`Creating base directory: ${resolvedPath}`);
            // if not, create it
            mkdirSync(resolvedPath);
        } else {
            console.log(`Directory Exists. Deleting directory made just now...`)
            // delete the existing directory
            rmSync(resolvedPath, {
                recursive: true,
                force: true
            });
            // then make it
            console.log(`Creating base directory: ${resolvedPath}`);
            mkdirSync(resolvedPath);
        }
    }
}

var folderOptions = new FolderOperations();
folderOptions.createFolder();