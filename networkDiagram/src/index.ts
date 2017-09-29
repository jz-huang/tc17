import { Network, DataSet } from "vis";

// embed tableau viz
declare var tableau: any;

const url: string = "https://public.tableau.com/shared/F75NCXYXF?:display_count=yes";
const container: HTMLElement | null = document.getElementById("tableau-viz");
const options: any = {
    hideTabs: true,
    onFirstInteractive: () => {
        onVizInit();
    }
}

let viz:any = new tableau.Viz(container, url, options);
let authorSheet: any;
let workbookSheet: any;
let dataTable: any;

class ColumnIndicies {
    id: number;
    name: number;
    viewCount: number;
    followers: number;
    followerCount: number;
    avatar_url: number;
    workbook_name: number;
    embed_url: number;
}
interface Author {
    id: string;
    name: string;
    followerCount: number;
    avatar_url: string;
    views: Array<View>;
}

interface View {
    name: string;
    embed_url: string;
}

interface Edge {
    to: string;
    from: string;
    arrows: string;
}

interface Node {
    id: string;
    title: string;
    shape: string;
    image: string;
}

function onVizInit(): void {
    let dashboard: any = viz.getWorkbook().getActiveSheet();
    let worksheets: Array<any> = dashboard.getWorksheets();
    authorSheet = worksheets[0];
    workbookSheet = worksheets[1];
    console.log(authorSheet.getName());
    console.log(workbookSheet.getName());
    authorSheet.getUnderlyingDataAsync({includeAllColumns: true, maxRows: 10000}).then((dt: any) => {
        // dataTable = dt;
        // let columns: any = dt.getColumns();
        // console.log(columns);
        // let data: any[][] = dt.getData();
        // console.log(data);
        try {
            parseDataForNetworkDiagram(dt);
        } catch (e) {
            console.log(e);
        }
    });
}

function parseDataForNetworkDiagram(dt: any): void {
    let columns: any = dt.getColumns();
    let columnIndicies: ColumnIndicies = generateColumnIndicies(columns);
    let authors: Array<Author> = [];
    let authorsMap: {[key: string]: Author} = {};
    let edges: Array<Edge> = [];
    let nodes: Array<Node> = [];
    dt.getData().forEach((row: any[]) => {
        let id: string = row[columnIndicies.id].value;
        let author: Author = authorsMap[id];
        let view: View = {
            name: row[columnIndicies.workbook_name].value,
            embed_url: row[columnIndicies.embed_url].value,
        }
        if (author) {
            author.views.push(view);
        } else {
            let views: Array<View> = [];
            views.push(view);
            let id: string = row[columnIndicies.id].value;
            let followers: Array<string> = (<string>row[columnIndicies.followers].value).split(";");
            followers.forEach(follower => {
                edges.push({
                    to: id,
                    from: follower,
                    arrows: "to"
                });
            });
            let author: Author = {
                name: row[columnIndicies.name].value,
                id: id,
                followerCount: row[columnIndicies.followerCount].value,
                views: views,
                avatar_url: row[columnIndicies.embed_url].value
            }
            if (author.avatar_url === "null" || author.avatar_url == "%null%" || !author.avatar_url) {
                throw new Error("found null: " + author.avatar_url);
            }
            let showImage: boolean = author.followerCount > 1000 && author.avatar_url != "%null%";
            nodes.push({
                id: author.id,
                title: author.name,
                shape: "circularImage", 
                image: showImage ? author.avatar_url : "/res/no-picture.jpg"
            });
            authorsMap[id] = author;
        }
    });
    initNetWorkDiagram(nodes, edges);
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
    if (!container) {
        throw new Error("container not found");
    }
    let options: vis.Options = {
        layout: {
            improvedLayout: false
        }
    }
    let network: Network = new Network(container, data,options);
}


