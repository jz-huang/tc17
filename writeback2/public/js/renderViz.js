let viz; 
function embedViz() {
    let url = "http://jahuang/views/Writeback2/Sheet1";
    let tableauContainer = document.getElementById("tableau-viz");
    let optionsTableau = {
        hideTabs: true,
        onFirstInteractive: () => {
            
        }
    }
    viz = new tableau.Viz(tableauContainer, url, optionsTableau);
}

function refreshApi() {
    viz.refreshDataAsync();
}

$("document").ready(() => {
    embedViz();
});
