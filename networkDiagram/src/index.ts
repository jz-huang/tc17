import { Network, DataSet, IdType } from "vis";

//import * as $ from "jquery";

import "jquery";
import "bootstrap";
import "select2"; 

// embed tableau viz
declare var tableau: any;

let viz:any;
let authorSheet: any;
let workbookSheet: any;
let dataTable: any;
let network: Network;
let authorsMap: {[key: string]: Author} = {};
let fromApi: boolean = false;
class ColumnIndicies {
    id: number;
    name: number;
    viewCount: number;
    followers: number;
    followerCount: number;
    avatar_url: number;
    workbook_name: number;
    embed_url: number;
    followings: number;
}

interface Author {
    id: string;
    name: string;
    followerCount: number;
    avatar_url: string;
    views: Array<View>;
    followings: Array<string>;
}

interface View {
    name: string;
    embed_url: string;
    viewCount: number;
}

interface Edge {
    to: string;
    from: string;
    arrows: string;
}

interface Node {
    id: string;
    title?: string;
    label: string;
    shape: string;
    image: string;
}

$("document").ready(() => {
    $('#search-box').select2({
        width: 'resolve',
        allowClear: true
    });
});

$("body").ready(() => {
    loadViz();
});

export function loadViz(): void {
    const url: string = "https://public.tableau.com/views/PublicAuthors/FindYouJedi?:embed=y&:display_count=yes";
    const tableauContainer: HTMLElement | null = document.getElementById("tableau-viz");
    const optionsTableau: any = {
        hideTabs: true,
        onFirstInteractive: () => {
            onVizInit();
        }
    }
    viz = new tableau.Viz(tableauContainer, url, optionsTableau);
}

function onVizInit(): void {
    let dashboard: any = viz.getWorkbook().getActiveSheet();
    let worksheets: Array<any> = dashboard.getWorksheets();
    worksheets.forEach((worksheet: any) => {
        if (worksheet.getName() === "Follower Count vs. WorkbookCount") {
            authorSheet = worksheet;
        } else {
            workbookSheet = worksheet;
        }
    });
    console.log(authorSheet.getName());
    console.log(workbookSheet.getName());
    authorSheet.getUnderlyingDataAsync({includeAllColumns: true}).then((dt: any) => {
        try {
            parseDataForNetworkDiagram(dt);
        } catch (e) {
            console.log(e);
        }
    });
    viz.addEventListener(tableau.TableauEventName.MARKS_SELECTION, selectionEventHandler);
}

function parseDataForNetworkDiagram(dt: any): void {
    let columns: any = dt.getColumns();
    let columnIndicies: ColumnIndicies = generateColumnIndicies(columns);
    let authors: Array<Author> = [];
    let edges: Array<Edge> = [];
    let nodes: Array<Node> = [];
    dt.getData().forEach((row: any[]) => {
        if (row[columnIndicies.followerCount].value < 500) {
            return;
        }
        let id: string = row[columnIndicies.id].value;
        let author: Author = authorsMap[id];
        let view: View = {
            name: row[columnIndicies.workbook_name].value,
            embed_url: row[columnIndicies.embed_url].value,
            viewCount: Number(row[columnIndicies.viewCount].value)
        }
        if (author) {
            author.views.push(view);
        } else {
            let views: Array<View> = [];
            views.push(view);
            let id: string = row[columnIndicies.id].value;
            let followers: Array<string> = (<string>row[columnIndicies.followers].value).split(";");
            let author: Author = {
                name: row[columnIndicies.name].value,
                id: id,
                followerCount: row[columnIndicies.followerCount].value,
                views: views,
                avatar_url: row[columnIndicies.avatar_url].value,
                followings: row[columnIndicies.followings].value.split(";")
            }
            authorsMap[id] = author;
        }
    });
    console.log(Object.keys(authorsMap).length);
    Object.keys(authorsMap).forEach(key => {
        let author = authorsMap[key];
        author.followings.forEach(following => {
            if (authorsMap[following]) {
                edges.push({
                    to: following,
                    from: author.id,
                    arrows: "to"
                })
            }
        });
        nodes.push({
            id: author.id,
            label: author.name,
            shape: "circularImage",
            image: author.avatar_url === "undefined" ? "./res/no-picture.jpg" : author.avatar_url
        });
    });
    setupSearchBox();
    initNetWorkDiagram(nodes, edges);   
}

function setupSearchBox(): void {
    $('#search-box').select2({
        width: 'resolve',
        data: Object.keys(authorsMap).map(key => {
            return {
                text: authorsMap[key].name,
                id: authorsMap[key].id
            }
        }),
        allowClear: true
    });

    $('#search-box').on("select2:select", (selected: any) => {
        selectAuthor(selected.params.data.id);
        selectNode(selected.params.data.id);
    });
}

function selectAuthor(id: string) {
    if (authorsMap[id]) {
        fromApi = true;
        try {
            authorSheet.selectMarksAsync("Id", id, tableau.SelectionUpdateType.REPLACE);        
        } catch(e) {
            console.log(e);
        }
    }
}

function selectionEventHandler(event: any) {
    console.log("Got Event!");
    event.getMarksAsync().then((marks: any[]) => {
        if (fromApi) {
            fromApi = false;
            return;
        }
        if (marks.length === 1) {
            let mark: any = marks[0];
            let pair: any = mark.getPairs().find((pair: any) => {
                return pair.fieldName === "Id";
            });
            if (pair) {
                if (authorsMap[pair.value]) {
                    console.log("id is: " + pair.value);
                    selectNode(pair.value);
                }
            }
        }
    });
}

function generateColumnIndicies(columns: any[]): ColumnIndicies {
    let result: ColumnIndicies = new ColumnIndicies();
    columns.forEach(column => {
        switch(column.getFieldName()) {
            case "Id": {
                result.id = column.getIndex();
                break;
            }
            case "Author Name": {
                result.name = column.getIndex();
                break;
            }
            case "Avatar Url": {
                result.avatar_url = column.getIndex();
                break;
            }
            case "Embed Url": {
                result.embed_url = column.getIndex();
                break;
            }
            case "Follower Ids": {
                result.followers = column.getIndex();
                break;
            }
            case "Name": {
                result.workbook_name = column.getIndex();
                break;
            }
            case "Follower Count": {
                result.followerCount = column.getIndex();
                break;
            }
            case "View Count": {
                result.viewCount = column.getIndex();
                break;
            }
            case "Following Ids": {
                result.followings = column.getIndex();
                break;
            }
        }
    });
    return result;
}

//node 

function initNetWorkDiagram(nodes: Array<Node>, edges: Array<Edge>) {
    const container: HTMLElement | null = document.getElementById("network-diagram");
    let data: vis.Data = {
        nodes: nodes,
        edges: edges
    }
    let highlightColor: string = "#2d4b65";
    let options: vis.Options = {
        width: "100%",
        height: "100%",
        nodes: {
            borderWidth:5,
            borderWidthSelected: 7,
            size:50,
            color: {
              border: "#222222",
              highlight: {
                  border: highlightColor
              }
            },
            brokenImage: "./res/no-picture.jpg",
            font: {
                size: 25
            }
        },
        edges: {
            color: {
                color: "lightgrey",
                highlight: highlightColor
            }
        },
        physics: {
          stabilization: false,
          barnesHut: {
            gravitationalConstant: -8000,
            springConstant: 0.01,
            springLength: 100
          }
        },
        interaction: {
          tooltipDelay: 200,
          hideEdgesOnDrag: true
        }
      };
    if (!container) {
        throw new Error("container not found");
    }

    network = new Network(container, data, options);
    
    zomeDefault();

    //event handlers
    network.on("oncontext", () => {
        zomeDefault();
    });
    $("#zoom-button").click(() => {
        zomeDefault();
    });

    network.on("selectNode", (result) => {
        if (result.nodes.length === 1) {
            selectAuthor(result.nodes[0]);
            selectNode(result.nodes[0]);
        }
    });

    network.on("doubleClick", (result) => {
        console.log("double clicked!!!");
        if (result.nodes.length === 1) {
            popModal(result.nodes[0]);
        } else {
            console.log("no node selected");
        }
    });
}

function selectNode(nodeId: IdType) {
    let focusOptions: vis.FocusOptions = {
        scale:0.7,
        animation: {
            duration: 500,
            easingFunction: "easeInOutQuad"
        }
    }
    network.focus(nodeId, focusOptions);
    network.selectNodes([nodeId], true);
}

function zomeDefault(): void {
    let moveToOptions: vis.MoveToOptions = {
        position: {x: 0, y: 0},
        scale: 0.5,
        animation: {
            duration: 500,
            easingFunction: "easeInOutQuad", 
        }
    }
    network.moveTo(moveToOptions);
}

function popModal(nodeId: IdType): void {
    let author: Author = authorsMap[nodeId];
    if (author) {
        $("#authorDetails").modal("show");
        $("#modal-author-name").text(author.name);
        $("#modal-author-picture").attr("src", author.avatar_url);
        let viewsSorted = author.views.sort((a, b) => {
            if (a.viewCount === b.viewCount) {
                return 0;
            } else if (a.viewCount > b.viewCount) {
                return -1; 
            } else {
                return 1;
            }
        });
        $("#viz-panels").html("");
        for (let i = 0; i < viewsSorted.length; i++) {
            let preload: boolean = i < 5;
            createCollapsibleViz(viewsSorted[i], preload, i);
        }
    }
}

//really wish i used react here... 
function createCollapsibleViz(view: View, preload: boolean, index: number): void {
    let baseId = view.name.replace(/\W/g, '');
    //panel
    let panel = $("<div>");
    panel.addClass("panel panel-default");
    panel.attr("id", baseId);
    //panel header
    let panelHeader = $("<div>");
    panelHeader.addClass("panel-heading");
    let panelTitle = $("<h4>");
    if (index % 2 == 0) {
        panelTitle.css("background-color", "#2d4b65");
    }
    panelTitle.addClass("panel-title");
    //panel control
    let panelControl = $("<a>");
    panelControl.attr("data-toggle", "collapse");
    panelControl.css("text-decoration", "none");
    let collapseId: string = baseId + "-viz";
    panelControl.attr("href", "#" + collapseId);
    panelControl.text(view.name);
    if (index % 2 === 0) {
        panelControl.css("color", "white");
    } else {
        panelControl.css("color", "black");
    }

    panelTitle.append(panelControl);
    panelHeader.append(panelTitle);
    panel.append(panelHeader);

    //collapse content
    let collapseContent = $("<div>");
    collapseContent.addClass("panel-collapse collapse");
    collapseContent.attr("id", collapseId);
    let body = $("<div>");
    let containerId = baseId + "-container";
    body.attr("id", containerId);

    collapseContent.append(body);
    panel.append(collapseContent);

    $("#viz-panels").append(panel);
    if (preload) {
        loadModalViz(containerId, view.embed_url);
    } else {
        $("#" + baseId).on("shown.bs.collapse", () => {
            loadModalViz(containerId, view.embed_url);            
        });
    }
}

function loadModalViz(containerId: string, url: string) {
    const optionsTableau: any = {
        hideTabs: true,
    }
    let modalViz = new tableau.Viz(document.getElementById(containerId), url, optionsTableau);
}




