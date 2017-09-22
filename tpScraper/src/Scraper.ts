import http = require('http');
import fs = require('fs');

class AuthorRow {
    id: string;
    name: string;
    followerCount: number;
    followingCount: number;
    workbookCount: number;
    followerIds: string[];
    followingIds: string[];
    avatarUrl: string;
}

class WorkbookRow {
    id: string; 
    name: string;
    authorId: string;
    imageUrl: string;
    embedUrl: string;
}

interface AuthorProfile {
    workbooks: any[];
}


class Scraper {
    private authors: {[key: string]: AuthorRow} = {};
    private workbooks: {[key: string]: WorkbookRow} = {};
    private authorScraped: number = 0;
    public constructor(private authorsFile: string, private workbooksFile: string) {
        console.log("hello");
        fs.appendFileSync(authorsFile, this.GetAuthorTableSchema());
        fs.appendFileSync(workbooksFile, this.GetAuthorTableSchema());
    };

    //the entry points for the scrape
    public initialize(ids: string[]): void {
        ids.forEach(id => {
            this.initializeScraping(id);
        });
    }

    public initializeScraping(authorId: string): void {
        const options: http.RequestOptions = {
            host: "public.tableau.com",
            path: `/profile/api/${authorId}`
        };
        const req = http.request(options, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                let obj: AuthorProfile = JSON.parse(chunk.toString());
                console.log(obj.workbooks);
            });
            res.on('end', () => {
                console.log('No more data in response.');
            });
        });
        
    }

    public GetAuthorProfile(authorId: string): void {
        const options: http.RequestOptions = {
            host: "public.tableau.com",
            path: `/profile/api/${authorId}`
        };

        const req = http.request(options, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`);
            });
            res.on('end', () => {
            console.log('No more data in response.');
            });
        });
        req.end();
    }

    public GetAuthorFollowers(authorId: string): void {
        const options: http.RequestOptions = {
            host: "public.tableau.com",
            path: `/profile/api/followers/${authorId}?count=1000&index=0`
        };

        const req = http.request(options, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`);
            });
            res.on('end', () => {
            console.log('No more data in response.');
            });
        });
        req.end();
    }

    public GetAuthorTableSchema(): string {
        return "id,authorName,followerCount,followingCount,workbookCount,followerIds,followingIds,avatarUrl";
    }

    public GetWorkbookTableSchema(): string {
        return "id,name,authorId,imageUrl,embedUrl";
    }
}

function prepareFiles() {
    const authorsPath: string = './data/authors.csv';
    const workbooksPath: string = './data/workbooks.csv';
    const timeStamp: string = new Date().toISOString();
    const dateStr: string = timeStamp.substring(0, timeStamp.indexOf('.')).split(':').join('-');
    if (fs.existsSync(authorsPath)) {
        const newPath = './data/authors-' + dateStr + '.csv';
        fs.renameSync(authorsPath, newPath);
    }

    if (fs.existsSync(workbooksPath)) {
        const newPath = './data/workbooks-' + dateStr + '.csv';
        fs.renameSync(workbooksPath, newPath);
    }
    let scraper: Scraper = new Scraper(authorsPath, workbooksPath);
    scraper.initialize(['sandy.wang']);
}

prepareFiles();

