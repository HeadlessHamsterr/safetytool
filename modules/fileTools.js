const allowedExcelExtensions = ['xlsx', 'xls', 'xlsm'];
const allowedEplanExtensions = ['test'];

export function validateFileExtension(extension, type){
    let allowedExtensions;
    switch(type){
        case 'excel':
            allowedExtensions = allowedExcelExtensions;
        break;
        case 'eplan':
            allowedExtensions = allowedEplanExtensions;
        break;
        default:
            return false;
    }

    for(let allowedExtension of allowedExtensions){
        if(extension === allowedExtension){
            return true;
        }
    }

    return false;
}

export function compressFileName(filename, extension){
    filename = filename.slice(0, (31-extension.length));
    return filename + "..." + extension;
}