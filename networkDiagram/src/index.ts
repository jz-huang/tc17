import { Network, DataSet } from "vis";

// embed tableau viz
declare var tableau: any;

const url: string = "https://public.tableau.com/shared/F75NCXYXF?:display_count=yes";
const container: HTMLElement | null = document.getElementById("tableau-viz");
const optionsTableau: any = {
    hideTabs: true,
    onFirstInteractive: () => {
        onVizInit();
    }
}

let viz:any = new tableau.Viz(container, url, optionsTableau);
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
    authorSheet.getUnderlyingDataAsync({includeAllColumns: true}).then((dt: any) => {
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
        if (row[columnIndicies.followerCount].value < 500) {
            return;
        }
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
            // followers.forEach(follower => {
            //     edges.push({
            //         to: id,
            //         from: follower,
            //         arrows: "to"
            //     });
            // });
            let author: Author = {
                name: row[columnIndicies.name].value,
                id: id,
                followerCount: row[columnIndicies.followerCount].value,
                views: views,
                avatar_url: row[columnIndicies.avatar_url].value,
                followings: row[columnIndicies.followings].value.split(";")
            }
            if (author.avatar_url === "null" || author.avatar_url == "%null%" || !author.avatar_url) {
                throw new Error("found null: " + author.avatar_url);
            }
            let showImage: boolean = author.followerCount > 1000 && author.avatar_url != "%null%";
            // nodes.push({
            //     id: author.id,
            //     title: author.name,
            //     shape: "circularImage", 
            //     image: showImage ? author.avatar_url : "/res/no-picture.jpg"
            // });
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
            title: author.name,
            shape: "circularImage",
            image: author.avatar_url
        });
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
    let options: vis.Options = {
        nodes: {
            scaling: {
                max: 20,
                min: 30
            }
        },
        physics: {
          stabilization: false,
          barnesHut: {
            gravitationalConstant: -800,
            springConstant: 0.005,
            springLength: 20
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

    let network: Network = new Network(container, data, options);
}


