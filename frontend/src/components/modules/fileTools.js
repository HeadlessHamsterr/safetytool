const allowedExcelExtensions = ['xlsx', 'xls', 'xlsm'];
const allowedEplanExtensions = ['test'];

function validateFileExtension(extension, type) {
    let allowedExtensions;
    switch (type) {
        case 'excel':
            allowedExtensions = allowedExcelExtensions;
            break;
        case 'eplan':
            allowedExtensions = allowedEplanExtensions;
            break;
        default:
            return false;
    }

    for (let allowedExtension of allowedExtensions) {
        if (extension === allowedExtension) {
            return true;
        }
    }

    return false;
}

function compressFileName(filename, extension) {
    //Bestandsnaam mag maximaal 34 tekens zijn om goed in het tekstvak te passen
    //Drie puntjes komen er bij, dus blijven er 31 min het aantal tekens in de extensie over voor de bestandsnaam
    filename = filename.slice(0, (31 - extension.length));
    return filename + "..." + extension;
}

//Deze functie controleerd of de extensie van het bestand correct is en vult de bestandsnaam (en verkort deze als dat nodig is) in het tekstvak in
//Geeft een boolean terug die aangeeft of er een probleem is met de extensie of niet
export default function getFileInfo(filename, type) {
    //Eventuele errors worden gereset, zodat deze niet onnodig blijven staan
    //throwImportError(type, '', true);
    //Bestandsnaam splitten op de extensie, zodat de extensie kan worden gecontroleerd
    let splitFileName = filename.split('.');
    let extension = splitFileName[splitFileName.length - 1];

    //Extensie controleren op basis van het bestandstype dat geüpload zou moeten zijn
    let validExtension = validateFileExtension(extension, type);

    //Extensie klopt niet met wat er verwacht wordt, error teruggeven
    if (!validExtension) {
        console.log(`Wrong extension for filetype ${type}! (${extension})`);
        //throwImportError(type, `Verkeerd bestandstype (${extenstion})`);
        return { success: false, error: `Verkeerd bestandstype (.${extension})` };
    }

    //Als de bestandsnaam langer is dan 34 tekens moet deze worden ingekort tot 34 tekens zodat de naam in het tekstvak past
    if (filename.length > 34) {
        filename = compressFileName(filename, extension);
    }

    return { success: true, filename: filename };
}