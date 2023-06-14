# **Van den Pol Safetytool**

In deze readme staan de stappen beschreven voor het draaien en updaten van de safetytool. Voor de uitgebreidere documentatie van de werking, is een handleiding gemaakt. Deze handleiding is hier te vinden: `G:\Paneel\Machineveiligheid\Safetytool\Handleiding Safetytool.docx`

De safetytool bestaat uit twee onderdelen:
- De webserver, dit is het bestand `main.js`. Deze server gebruikt port 3001 voor het serveren van de webpagina en de overige http requests van de client.
- De frontend, te vinden in de map `frontend`. De frontend is geschreven m.b.h.v. React. 

Voordat de safetytool gebruikt kan worden, moeten eerst Node en NPM worden geïnstalleerd op de server. Op Linux servers kan dat via de package manager. Zie https://nodejs.org/en/download/package-manager voor instructies. Op Windows servers kan het beste NVM for Windows worden gebruikt. Zie https://github.com/coreybutler/nvm-windows voor instructies. NVM maakt het installeren en updaten van Node en NPM erg eenvoudig.

# Bouwen van de frontend
Om de website efficiënt te kunnen draaien, moet de React code worden gebouwd naar standaard HTML, CSS en Javascript bestanden. Deze stappen gaan ervan uit dat het hele project is gedownload en dat Node en NPM geïnstalleerd zijn.
1. Open de terminal en ga naar de map `frontend`.
2. Installeer alle dependencies met het commando `npm install`.
3. Controleer of de URL van de server correct is. Deze staat gedefinieerd in `frontend/src/App.js`, in de variabele `serverURL` (regel 22). Dit moet de URL zijn waarop de server te bereiken is (bijvoorbeeld `https://safetytool.vandenpol.com`).
3. Bouw de website met het commando `npm run build`.
4. In de map `frontend` wordt een map gemaakt genaamd `build`. Kopieer de bestanden in deze map naar de map `public` in de hoofdmap van de repo.
5. Push de update naar git.


# Opzetten van de webserver
Om de webserver te kunnen draaien, zijn de volgende mappen en bestanden nodig:
- `main.js`, dit is de server zelf
- `package.json` & `package-lock.json`, hierin staan alle dependencies die de webserver nodig heeft
- `public`, hierin staan de HTML, CSS en Javascript bestanden die de server naar de client stuurt
- `modules`, hierin staan alle modules die de server nodig heeft
- `PAScalFiles`, hierin staan alle onderdelen die de server gebruikt voor het genereren van de PAScal bestanden

Op het moment dat de webserver wordt opgestart, maakt deze nog een extra map aan genaamd "userFiles". In deze map worden alle bestanden opgeslagen die voor de clients aangemaakt worden.

De webserver kan alsvolgt op de server geïnstalleerd worden:
1. Kopiëer de benodigde bestanden (zie de lijst hierboven) naar de gewenste locatie op de server.
2. Als de frontend nog niet gebouwd is, doe dat dan nu. De instructies hiervoor staan in het kopje hierboven.
3. Open `main.js`, scroll naar onderaan het bestand, comment de regel `app.listen(port, () => {console.log('Listening on port ${port}')});` en uncomment de regel `app.listen(process.env.PORT, () =>{console.log('Listening on port ${port}')});`.
4. Navigeer in de terminal naar de map waar `main.js` in staat en installeer alle dependencies met `npm install`.
5. Start de server met `node main.js`.
6. De webserver is te bereiken op: `http://SERVER_IP:3001`.

# Updates
## Frontend
Dit stappenplan is voor het bijwerken van de frontend, nadat er een update is geweest. Voor dit stappenplan is aangenomen dat de update al is gepushed naar git. Het is belangrijk dat de update wordt gebuild volgens de instructies hierboven. Op die manier zijn de bestanden die in de repository in de map `public` staan, altijd de meest recente.
1. Clone de repository.
2. Kopieer de inhoud van de map `public` uit de repository naar de map `public` op de server.

## Backend
Dit stappenplan is voor het bijwerken van de backend. Wederom wordt aangenomen dat de nieuwe versie al is gepushed naar git.
1. Clone de repository.
2. Stop de server.
3. Kopiëer de bestanden `main.js`, `package.json`, `package-lock.json` en de mappen `modules` en `PAScalFiles` naar de gewenste locatie op de server.
4. Installeer eventuele nieuwe dependecies met `npm install`.
5. Start de server opnieuw.

## Node
### Windows
Als er een nieuwe versie van Node beschikbaar is, kan deze eenvoudig worden geïnstalleerd met NVM. Met het commando `nvm install node` wordt de laatste versie van Node geïnstalleerd. Specifieke versies kunnen worden geïnstalleerd met `nvm install [versie]`.
### Linux
Op Linux wordt Node geüpdate met behulp van de package manager. Zie daarvoor de instructies voor de gebruikte distributie.

## NPM
Een nieuwe versie van NPM kan geïnstalleerd worden met `npm install -g npm@latest`.