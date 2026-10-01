function doGet() {
  return HtmlService
    .createTemplateFromFile('Index')
    .evaluate()
    .setTitle('ASC — Confirm & Sync')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getBootstrapState() {
  return {
    authenticated: true,
    ownerOnly: true,
    writeEnabled: false,
    appVersion: '0.1-t004'
  };
}
