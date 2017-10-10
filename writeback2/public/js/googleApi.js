let pdfData = null;

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
    // Client ID and API key from the Developer Console
    let CLIENT_ID = '365877021916-uv105gdkj8as50ruap03ot6j9fr4il42.apps.googleusercontent.com';

    // Array of API discovery doc URLs for APIs used by the quickstart
    let DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest",'https://sheets.googleapis.com/$discovery/rest?version=v4'];

    // Authorization scopes required by the API; multiple scopes can be
    // included, separated by spaces.
    let SCOPES = 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/spreadsheets';

    gapi.client.init({
        discoveryDocs: DISCOVERY_DOCS,
        clientId: CLIENT_ID,
        scope: SCOPES
    }).then(function () {        
        if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
            gapi.auth2.getAuthInstance().signIn();
        }
    });
}

function appendToSheet(name, sale, date) {
    let params = {
        // The ID of the spreadsheet to update.
        spreadsheetId: '1ujsct_iHLJmwty8PdmjfuuUsNJqoBEHLTyO8jXAzZps',  
        // The A1 notation of a range to search for a logical table of data.
        // Values will be appended after the last row of the table.
        range: 'A2:C2',  

        // How the input data should be interpreted.
        valueInputOption: 'RAW',  

        // How the input data should be inserted.
        insertDataOption: 'INSERT_ROWS',  
      };
    let valueRangeBody = {
        "majorDimension": "ROWS",
        "range": "A2:C2",
        "values": [
          [
             name, sale, date
          ]
        ]
    };
    return request = gapi.client.sheets.spreadsheets.values.append(params, valueRangeBody);
}

function sendEmail(receiver, message) {
    var mail = [
        'Content-Type: multipart/mixed; boundary="foo_bar_baz"\r\n',
        'MIME-Version: 1.0\r\n',
        `To: ${receiver}\r\n`,
        'Subject: Viz Update From Timo\r\n\r\n',
      
        '--foo_bar_baz\r\n',
        'Content-Type: text/plain; charset="UTF-8"\r\n',
        'MIME-Version: 1.0\r\n',
        'Content-Transfer-Encoding: 7bit\r\n\r\n',
      
        `${message}\r\n\r\n`,

        'Tableau Viz:' + viz.getUrl() + '\r\n\r\n',
      
        '--foo_bar_baz\r\n',
            
         '--foo_bar_baz--'
      ].join('');

      $.ajax({
        type: "POST",
        url: "https://www.googleapis.com/upload/gmail/v1/users/me/messages/send?uploadType=multipart",
        contentType: "message/rfc822",
        beforeSend: function(xhr, settings) {
          xhr.setRequestHeader('Authorization','Bearer ' + gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token);
        },
        data: mail,
        success: (response) => {
            console.log(response);
        },
        error: (error) => {
            console.log(error);
        }
      }); 
      
    //   let request = gapi.client.request({
    //       path: "https://www.googleapis.com/upload/gmail/v1/users/me/messages/send",
    //       method: "POST",
    //       params: {
    //           uploadType: "multipart"
    //       },
    //       headers: {
    //           contentType: "message/rfc822"
    //       },
    //       body: btoa(mail)
    //   });
    //   request.execute(() => {
    //       console.log("executed");
    //   });
}

$("document").ready(() => {
    $('#update-form').submit((event) => {
        let name = $("#nameSelect").find("option:selected").text();
        let sale = $("#sales").val();
        let date = $("#date-input").val();
        let parseStrs = date.split("-");
        let year = parseStrs.pop();
        parseStrs.push(year);
        date = parseStrs.join("/");

        appendToSheet(name, sale, date).then((response) => {
            console.log(response);
            refreshApi();
        })
        return false;
    });
    $("#email-button").click(() => {
        $("#email-modal").modal("show");
    });
    $("#email-form").submit(() => {
        sendEmail($("#receiver").val(), $("#email-content").val());   
        $("#email-modal").modal("hide");
        return false;       
    });
})

//encoding helpers
function base64Encode(str) {
    var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var out = "", i = 0, len = str.length, c1, c2, c3;
    while (i < len) {
        c1 = str.charCodeAt(i++) & 0xff;
        if (i == len) {
            out += CHARS.charAt(c1 >> 2);
            out += CHARS.charAt((c1 & 0x3) << 4);
            out += "==";
            break;
        }
        c2 = str.charCodeAt(i++);
        if (i == len) {
            out += CHARS.charAt(c1 >> 2);
            out += CHARS.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
            out += CHARS.charAt((c2 & 0xF) << 2);
            out += "=";
            break;
        }
        c3 = str.charCodeAt(i++);
        out += CHARS.charAt(c1 >> 2);
        out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
        out += CHARS.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
        out += CHARS.charAt(c3 & 0x3F);
    }
    return out;
}
