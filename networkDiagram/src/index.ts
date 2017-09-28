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

function onVizInit(): void {
    let dashboard: any = viz.getWorkbook().getActiveSheet();
    let worksheets: Array<any> = dashboard.getWorksheets();
    let authorSheet: any = worksheets[0];
    let workbookSheet: any = worksheets[1];
    console.log(authorSheet.getName());
    console.log(workbookSheet.getName());
}

function getData(): void { 
    
}
