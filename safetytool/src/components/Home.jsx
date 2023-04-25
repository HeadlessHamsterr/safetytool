const Home = () => {
    return (
        <div class="buttonWrapper">
            <table class="buttonRow" id="excelDropzone" ondrop="dropHandler(event, 'excel');" ondragover="dragOverHandler(event, 'excel');">
                <tr>
                    <td><table class="importText">
                        <tr>
                            <td><p>Vragenlijst</p></td>
                            <td><p class="importFileTypes">(Sleep het bestand, of druk op openen)</p></td>
                        </tr>
                        </table>
                    </td>
                    <td>
                        <table class="importResults">
                            <tr>
                                <td><span id="excelFileName" class="fileName"></span></td>
                                <td><button class="openBtn" onclick="openFile('excel')">Openen</button></td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            <span class="errorSpan" id="excelErrorSpan"></span><br/>
            <span class="errorSpan" id="excelExplainErrorSpan"></span><br/>
            <button class="importBtn" onclick="importExcelFile()">Importeren</button>
        </div>
    )
}

export default Home;