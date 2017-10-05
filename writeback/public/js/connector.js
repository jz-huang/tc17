(function() {
    // Create the connector object
    var myConnector = tableau.makeConnector();

    // Define the schema
    myConnector.getSchema = function(schemaCallback) {
        var cols = [{
            id: "name",
            alias: "name",
            dataType: tableau.dataTypeEnum.string
        }, 
        {
            id: "sale",
            alias: "sale",
            dataType: tableau.dataTypeEnum.int
        }, 
        {
            id: "date",
            alias: "date",
            dataType: tableau.dataTypeEnum.string
        }];

        var tableSchema = {
            id: "SalesData",
            alias: "Monthly Sales",
            columns: cols
        };

        schemaCallback([tableSchema]);
    };

    // Download the data
    myConnector.getData = function(table, doneCallback) {
        $.getJSON("http://localhost:3000/data", function(resp) {
            var results = resp.results;
            var tableData = [];

            // Iterate over the JSON object
            for (var i = 0, len = results.length; i < len; i++) {
                tableData.push({
                    "name": results[i].name,
                    "sale": Number(results[i].sale.split(",").join("")),
                    "date": results[i].date
                });
            }
            table.appendRows(tableData);
            doneCallback();
        });
    };

    tableau.registerConnector(myConnector);

    // Create event listeners for when the user submits the form
    $(document).ready(function() {
        $("#submitButton").click(function() {
            tableau.connectionName = "Sales Data"; // This will be the data source name in Tableau
            tableau.submit(); // This sends the connector object to Tableau
        });
    });
})();