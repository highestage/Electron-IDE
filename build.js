// create binaries for electron projects

// import the required packages
const { execSync } = require('child_process');                          // for executing commands - synchronously
const { existsSync, mkdirSync, rmSync, copySync } = require('fs-extra');         // for checking if a file exists, creating a directory and writing to a file
const { makeUniversalApp } = require('@electron/universal');
const path = require('path');

// get the config.<platform>.json file
var buildConfigJSON = require(`./${process.argv[2]}`);                              // for storing the config.json file
console.log(buildConfigJSON);

// make the directory for the app
function makeDirectory(destination) {

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

// copy the folders to the app folder
function copyFolders(source, destination) {
    // check if the directory exists
    if (!existsSync(destination)) {
        // if not, create it
        console.log(`Creating directory: ${destination}`);
        mkdirSync(destination);
    } else {
        console.log(`Directory Exists. Deleting copied directory...`)
        // remove the directory
        rmSync(destination, {
            recursive: true,
            force: true
        });
        // then make it
        mkdirSync(destination);
    }
    // copy the folders
    console.log(`Copying folders from ${source} to ${destination}`);
    copySync(source, destination);
}

// obfuscate the javascript files
function obfuscateJSFiles(jsFileList, destination) {
    switch (buildConfigJSON.platform) {
    case "mas":
    case "darwin":
        for (script in jsFileList) {
            console.log(`Obfuscating file: ${jsFileList[script]}`);
            execSync(`
                javascript-obfuscator ${destination}/${jsFileList[script]} -o ${destination}/${jsFileList[script]} --compact true --control-flow-flattening true --dead-code-injection true --debug-protection true --disable-console-output true `)
        }
        break;
    case "win32":
        for (script in jsFileList) {
            // console.log(`Obfuscating file: ${path.resolve('destination\\jsFileList[script]')}`);
            console.log(path.resolve(`${destination}\\${jsFileList[script]}`))
            execSync(`javascript-obfuscator ${destination}\\${jsFileList[script]} -o ${destination}\\${jsFileList[script]} --compact true --control-flow-flattening true --dead-code-injection true --debug-protection true --disable-console-output true `)
        }
        break;
    default:
        console.log(`The platform ${buildConfigJSON.platform} is not supported`);
        break;
    }
}

// create the binaries for x64 and arm64
// source = 'destinationFolder'/build/src
// destination = 'destinationFolder'/build
function createBinaries(source, destination, platform, arch) {
    console.log(`Creating binaries for ${platform} ${arch}`);

    // check platform
    switch (buildConfigJSON.platform) {
    case "mas":
    case "darwin":
        // check if the folder exists
        if (existsSync(`${destination}/build/${buildConfigJSON.productName}-${platform}-${arch}`)) {
            console.log(`Deleting build: ${platform}-${arch}`);
            // delete any previous binaries
            rmSync(`${destination}/build/${buildConfigJSON.productName}-${platform}-${arch}`, {
                recursive: true,
                force: true
            });
        }
        // build the binary
        console.log(`Building binary for ${platform} ${arch}`)
        execSync(`electron-packager ${source} --out ${destination} --app-copyright="${buildConfigJSON.author.copyright}" --app-version="${buildConfigJSON.version}" --electron-version="${buildConfigJSON.electronVersion}" --executable-name="${buildConfigJSON.executableName}" --appname="${buildConfigJSON.productName}" --icon="${source}/icon.icns" --platform="${platform}" --app-bundle-id="${buildConfigJSON.appID}" --arch="${arch}" --build-version="${buildConfigJSON.buildVersion}"`)
        
        // remove the localizations
        console.log('Removing localizations...')
        for (i in buildConfigJSON.removeLocalizations) {
            // remove the unwanted localization
            rmSync(path.resolve(`${destination}/${buildConfigJSON.productName}-${platform}-${arch}/${buildConfigJSON.productName}.app/Contents/Resources/${buildConfigJSON.removeLocalizations[i]}.lproj`), {
                recursive: true,
                force: true
            });
        }
        break;
    case "win32":
        // check if the folder exists
        if (existsSync(`${destination}\\build\\${buildConfigJSON.productName}-${platform}-${arch}`)) {
            console.log(`Deleting build: ${platform}-${arch}`);
            // delete any previous binaries
            rmSync(`${destination}\\build\\${buildConfigJSON.productName}-${platform}-${arch}`, {
                recursive: true,
                force: true
            });
        }
        // build the binary
        console.log(`Building binary for ${platform} ${arch}`)
        execSync(`electron-packager ${source} --out ${destination} --app-copyright="${buildConfigJSON.author.copyright}" --app-version="${buildConfigJSON.version}" --electron-version="${buildConfigJSON.electronVersion}" --executable-name="${buildConfigJSON.executableName}" --appname="${buildConfigJSON.productName}" --icon="${source}\\icon.ico" --platform="${platform}" --app-bundle-id="${buildConfigJSON.appID}" --arch="${arch}" --build-version="${buildConfigJSON.buildVersion}`)
        
        // remove the localizations
        console.log('Removing localizations...')
        for (i in buildConfigJSON.removeLocalizations) {
            // remove the unwanted localization
            rmSync(path.resolve(`${destination}\\${buildConfigJSON.productName}-${platform}-${arch}\\locales\\${buildConfigJSON.removeLocalizations[i]}.pak`), {
                recursive: true,
                force: true
            });
        }
        break;
    }
}

// build the universal binaries for macOS
function buildUniversalBinaries(destination) {
    console.log(`Building universal binaries`);
    // check if universal binary exists
    if (existsSync(`${destination}/${buildConfigJSON.productName}.app`)) {
        console.log(`Deleting universal binaries`);
        // delete the universal binary
        rmSync(`${destination}/${buildConfigJSON.productName}.app`, {
            recursive: true,
            force: true
        });
        // make it again
        console.log('Making universal binary')
        makeUniversalApp({
            x64AppPath:     `${destination}/${buildConfigJSON.productName}-mas-x64/${buildConfigJSON.productName}.app`,
            arm64AppPath:   `${destination}/${buildConfigJSON.productName}-mas-arm64/${buildConfigJSON.productName}.app`,
            outAppPath:     `${destination}/${buildConfigJSON.productName}.app`,
            force: true
        }).then(() => {
            console.log('\nUniversal binary promise resolved\n');
            if (buildConfigJSON.sign) {
                signApp(`${destination}/${buildConfigJSON.productName}.app`, `${destination}/${buildConfigJSON.productName}.pkg`);
            }
        }).catch(() => {
            console.log('\nUniversal binary promise rejected\n');
        })
    } else {
        // make the universal binary
        console.log('Making universal binary')
        makeUniversalApp({
            x64AppPath:     `${destination}/${buildConfigJSON.productName}-mas-x64/${buildConfigJSON.productName}.app`,
            arm64AppPath:   `${destination}/${buildConfigJSON.productName}-mas-arm64/${buildConfigJSON.productName}.app`,
            outAppPath:     `${destination}/${buildConfigJSON.productName}.app`,
            force: true
        }).then(() => {
            console.log('\nUniversal binary promise resolved\n');
            if (buildConfigJSON.sign) {
                signApp(`${destination}/${buildConfigJSON.productName}.app`, `${destination}/${buildConfigJSON.productName}.pkg`);
            }
        }).catch(() => {
            console.log('\nUniversal binary promise rejected\n');
        })
    }
}

// signing of the application
function signApp(appPath, destination) {
    switch (buildConfigJSON.platform) {
    case "mas":
        // create the ASAR archive
        if (buildConfigJSON.asar) {
            console.log('Creating ASAR archive...');
            createASAR(appPath);
        }

        // insert the ElectronTeamID
        insertElectronTeamID(appPath);

        // sign the app
        console.log(`Signing the app`);
        execSync(`codesign -s "${buildConfigJSON.signing.keys.app}" -f --entitlements "${buildConfigJSON.signing.plist.child}" "${appPath}/Contents/Frameworks/Electron Framework.framework/Versions/A/Electron Framework"`);
        execSync(`codesign -s "${buildConfigJSON.signing.keys.app}" -f --entitlements "${buildConfigJSON.signing.plist.child}" "${appPath}/Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libffmpeg.dylib"`);
        execSync(`codesign -s "${buildConfigJSON.signing.keys.app}" -f --entitlements "${buildConfigJSON.signing.plist.child}" "${appPath}/Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libEGL.dylib"`);
        execSync(`codesign -s "${buildConfigJSON.signing.keys.app}" -f --entitlements "${buildConfigJSON.signing.plist.child}" "${appPath}/Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libGLESv2.dylib"`);
        execSync(`codesign -s "${buildConfigJSON.signing.keys.app}" -f --entitlements "${buildConfigJSON.signing.plist.child}" "${appPath}/Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libswiftshader_libEGL.dylib"`);
        execSync(`codesign -s "${buildConfigJSON.signing.keys.app}" -f --entitlements "${buildConfigJSON.signing.plist.child}" "${appPath}/Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libswiftshader_libGLESv2.dylib"`);
        execSync(`codesign -s "${buildConfigJSON.signing.keys.app}" -f --entitlements "${buildConfigJSON.signing.plist.child}" "${appPath}/Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libvk_swiftshader.dylib"`);
        execSync(`codesign -s "${buildConfigJSON.signing.keys.app}" -f --entitlements "${buildConfigJSON.signing.plist.child}" "${appPath}/Contents/Frameworks/Electron Framework.framework"`);
        execSync(`codesign -s "${buildConfigJSON.signing.keys.app}" -f --entitlements "${buildConfigJSON.signing.plist.child}" "${appPath}/Contents/Frameworks/${buildConfigJSON.productName} Helper.app/Contents/MacOS/${buildConfigJSON.productName} Helper"`);
        execSync(`codesign -s "${buildConfigJSON.signing.keys.app}" -f --entitlements "${buildConfigJSON.signing.plist.child}" "${appPath}/Contents/Frameworks/${buildConfigJSON.productName} Helper.app"`);
        execSync(`codesign -s "${buildConfigJSON.signing.keys.app}" -f --entitlements "${buildConfigJSON.signing.plist.child}" "${appPath}/Contents/Frameworks/${buildConfigJSON.productName} Helper (Plugin).app/Contents/MacOS/${buildConfigJSON.productName} Helper (Plugin)"`);
        execSync(`codesign -s "${buildConfigJSON.signing.keys.app}" -f --entitlements "${buildConfigJSON.signing.plist.child}" "${appPath}/Contents/Frameworks/${buildConfigJSON.productName} Helper (Plugin).app"`);
        execSync(`codesign -s "${buildConfigJSON.signing.keys.app}" -f --entitlements "${buildConfigJSON.signing.plist.child}" "${appPath}/Contents/Frameworks/${buildConfigJSON.productName} Helper (GPU).app/Contents/MacOS/${buildConfigJSON.productName} Helper (GPU)"`);
        execSync(`codesign -s "${buildConfigJSON.signing.keys.app}" -f --entitlements "${buildConfigJSON.signing.plist.child}" "${appPath}/Contents/Frameworks/${buildConfigJSON.productName} Helper (GPU).app"`);
        execSync(`codesign -s "${buildConfigJSON.signing.keys.app}" -f --entitlements "${buildConfigJSON.signing.plist.child}" "${appPath}/Contents/Frameworks/${buildConfigJSON.productName} Helper (Renderer).app/Contents/MacOS/${buildConfigJSON.productName} Helper (Renderer)"`);
        execSync(`codesign -s "${buildConfigJSON.signing.keys.app}" -f --entitlements "${buildConfigJSON.signing.plist.child}" "${appPath}/Contents/Frameworks/${buildConfigJSON.productName} Helper (Renderer).app"`);
        execSync(`codesign -s "${buildConfigJSON.signing.keys.app}" -f --entitlements "${buildConfigJSON.signing.plist.loginhelper}" "${appPath}/Contents/Library/LoginItems/${buildConfigJSON.productName} Login Helper.app/Contents/MacOS/${buildConfigJSON.productName} Login Helper"`);
        execSync(`codesign -s "${buildConfigJSON.signing.keys.app}" -f --entitlements "${buildConfigJSON.signing.plist.loginhelper}" "${appPath}/Contents/Library/LoginItems/${buildConfigJSON.productName} Login Helper.app"`);
        execSync(`codesign -s "${buildConfigJSON.signing.keys.app}" -f --entitlements "${buildConfigJSON.signing.plist.child}" "${appPath}/Contents/MacOS/${buildConfigJSON.executableName}"`);
        execSync(`codesign -s "${buildConfigJSON.signing.keys.app}" -f --entitlements "${buildConfigJSON.signing.plist.parent}" "${appPath}"`);

        // build the PKG 
        console.log(`Building the PKG`);
        execSync(`productbuild --component "${appPath}" /Applications --sign "${buildConfigJSON.signing.keys.installer}" "${destination}"`);
        console.log(`PKG built`);
        break;
    case "win32":
        console.log('Signing the app');
        // execSync(`electron-windows-store --input-directory "C:\\Users\\ankag\\Desktop\\dist_mossaik_presets\\build\\Mossaik Presets-win32-x64" --output-directory C:\\Users\\ankag\\Desktop\\dist_mossaik_presets\\windows_build --package-version 1.0.0.0 --package-name "MossaikPresets" --package-display-name "Mossaik Presets" --publisher-display-name "Ayush Aggarwal" --identity-name "49AyushAggarwal.MossaikClassic" -a C:\\Users\\ankag\\Desktop\\dist_mossaik_presets\\build\\resources`)
        execSync(`electron-windows-store --input-directory "${appPath}" --output-directory "${destination}" --package-version ${buildConfigJSON.version}.0 --package-name "${buildConfigJSON.executableName}" --package-display-name "${buildConfigJSON.productName}" --publisher-display-name "${buildConfigJSON.publisherDisplayName}" --identity-name ${buildConfigJSON.appID} -a ${path.resolve(buildConfigJSON.destinationDirectory)}\\build\\resources`);
        break;
    default:
        console.log(`Unrecognized build signing platform: ${buildConfigJSON.platform}`);
        break;
    }
}

// create ASAR archive for the app
function createASAR(destination) {
    switch (buildConfigJSON.platform) {
    case 'mac':
    case 'darwin':
        // create the asar archive
        console.log(`Creating ASAR archive`);
        execSync(`asar pack "${destination}/Contents/Resources/app" "${destination}/Contents/Resources/app.asar"`);
        // remove the app folder
        console.log(`Deleting the app folder`);
        rmSync(`${destination}/Contents/Resources/app`, {
            recursive: true,
            force: true
        });
        // quarantine and clean the asar archive
        console.log(`Use xattr for app.asar`)
        execSync(`xattr -cr "${destination}/Contents/Resources/app.asar"`);
        break;
    case 'win32':
        // create the asar archive
        console.log(`Creating ASAR archive`);
        execSync(`asar pack "${destination}\\resources\\app" "${destination}\\resources\\app.asar"`);
        // remove the app folder
        console.log(`Deleting the app folder`);
        rmSync(`${destination}\\resources\\app`, {
            recursive: true,
            force: true
        });
        break;
    }
}

// insert the ElectronTeamID into the Info.plist
function insertElectronTeamID(destination) {
    console.log(`Inserting ElectronTeamID into Info.plist`);
    execSync(`plutil -insert ElectronTeamID -string "${buildConfigJSON.signing.electronTeamID}" "${destination}/Contents/Info.plist"`);
}


// structure for CLI
// mac
// node build.js --free --mac ~/desktop/dist_mossaik_presets



// makeDirectory(path.resolve(buildConfigJSON.destinationDirectory));
// // check which platform is being used
// switch (buildConfigJSON.platform) {
// case "mas":
// case "darwin":
//     // make 'build' directory
//     makeDirectory(path.resolve(`${buildConfigJSON.destinationDirectory}/build`));
//     // copy the app to the build directory
//     copyFolders(path.resolve(buildConfigJSON.sourceDirectory), path.resolve(`${buildConfigJSON.destinationDirectory}/build/src`));
//     // obfuscate js files
//     if (buildConfigJSON.obfuscate) {
//         obfuscateJSFiles(buildConfigJSON.jsFileList, path.resolve(`${buildConfigJSON.destinationDirectory}/build/src`));
//     }
//     // create binaries for required architectures
//     for (index in buildConfigJSON.archs) {
//         createBinaries(path.resolve(`${buildConfigJSON.destinationDirectory}/build/src`), path.resolve(`${buildConfigJSON.destinationDirectory}/build`), buildConfigJSON.platform, buildConfigJSON.archs[index]);
//     }
//     // build universal binary and sign it
//     if (buildConfigJSON.universalBinary) {
//         buildUniversalBinaries(path.join(`${buildConfigJSON.destinationDirectory}/build`))
//     }
//     break;
// case "win32":
//     makeDirectory(path.resolve(`${buildConfigJSON.destinationDirectory}\\build`));
//     // copy the source folder to directory
//     copyFolders(path.resolve(buildConfigJSON.sourceDirectory), path.resolve(`${buildConfigJSON.destinationDirectory}\\build\\src`));
    
//     // copy the resources to folder
//     copyFolders(path.resolve(buildConfigJSON.windowsIconResources), path.resolve(`${buildConfigJSON.destinationDirectory}\\build\\resources`));

//     // obfuscate js files
//     if (buildConfigJSON.obfuscate) {
//         obfuscateJSFiles(buildConfigJSON.jsFileList, path.resolve(`${buildConfigJSON.destinationDirectory}\\build\\src`));
//     }
    
//     // create binaries
//     createBinaries(path.resolve(`${buildConfigJSON.destinationDirectory}\\build\\src`), path.resolve(`${buildConfigJSON.destinationDirectory}\\build`), buildConfigJSON.platform, buildConfigJSON.archs[0]);
//     // asar pack
//     if (buildConfigJSON.asar) {
//         console.log('Creating ASAR archive...');
//         createASAR(path.resolve(`${buildConfigJSON.destinationDirectory}\\build\\${buildConfigJSON.productName}-${buildConfigJSON.platform}-${buildConfigJSON.archs[0]}`));
//     }

//     // sign the binaries
//     if (buildConfigJSON.sign) {
//         signApp(path.resolve(`${buildConfigJSON.destinationDirectory}\\build\\${buildConfigJSON.productName}-${buildConfigJSON.platform}-${buildConfigJSON.archs[0]}`), 
//         path.resolve(`${buildConfigJSON.destinationDirectory}\\windows_build`))
//     }
//     break;
// default:
//     console.log(`The platform ${buildConfigJSON.platform} is not supported`);
//     break;
// }

/**
 * There is a possibility that the developer wants to build a signed developement copy.
 * 
 * User can build for multiple platforms and sign them all at once.
 * So add support for passing the config.json file to the CLI
 */