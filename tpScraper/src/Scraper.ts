import http = require('http');
import fs = require('fs');
import * as WebRequest from 'web-request';

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
    viewCount: number;
}

interface AuthorProfile {
    address: string;
    name: string;
    profileName: string;
    avatarUrl: string;
    totalNumberOfFollowers: number;
    totalNumberOfFollowing: number;
    visibleWorkbookCount: number;
    workbooks: Workbook[];
}

interface Workbook {
    title: string;
    viewCount: number;
    defaultViewRepoUrl: string;
}

class Scraper {
    private authorsMap: {[key: string]: AuthorRow} = {};
    private workbooksMap: {[key: string]: WorkbookRow} = {};
    private authorScraped: number = 0;
    private authorsToQuery: Array<string> = [];
    public constructor(private authorsFile: string, private workbooksFile: string) {
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

        let body: Array<Buffer> = [];
        const req = http.request(options, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                if (typeof(chunk) === "string") {
                    this.processAuthorProfile(chunk);
                } else {
                    body.push(chunk);
                }
            });
            res.on('end', () => {
                this.processAuthorProfile(Buffer.concat(body).toString());
                console.log('No more data in response.');
            });
        });
        //req.end();

        let authorRequest = WebRequest.get(`http://public.tableau.com/profile/api/${authorId}`);
    }

    private processAuthorProfile(profileJSON: string): void {
        let profile: AuthorProfile = JSON.parse(profileJSON);
        let workbooks: Array<Workbook> = profile.workbooks;
        this.processWorkbooks(workbooks, profile.profileName);
        // this.authorsMap[profile.profileName] = {
        //     id: profile.profileName,
        //     name: profile.name,
        //     followerCount: profile.totalNumberOfFollowers,
        //     followingCount: profile.totalNumberOfFollowing,
        //     workbookCount: profile.visibleWorkbookCount,
        //     avatarUrl: profile.avatarUrl
        // }
    }

    private processWorkbooks(workbooks: Array<Workbook>, authorId: string) {
        workbooks.forEach(wb => {
            let id: string = wb.title + authorId;
            if (!this.workbooksMap[id]) {
                this.workbooksMap[id] = {
                    id: id,
                    name: wb.title,
                    viewCount: wb.viewCount,
                    imageUrl: this.generateImageUrl(wb.defaultViewRepoUrl),
                    embedUrl: this.generateEmbedUrl(wb.defaultViewRepoUrl),
                    authorId: authorId
                }
            }
        });
    }

    private generateImageUrl(repoUrl: string): string {
        let parts: Array<string> = repoUrl.split('/');
        let firstTwo: string = parts[0].substring(0,2);
        return `https://public.tableau.com/static/images/${firstTwo}/${parts[0]}/${parts[2]}/4_3.png`;
    }

    private generateEmbedUrl(repoUrl: string): string {
        let parts: Array<string> = repoUrl.split('/');
        return `https://public.tableau.com/views/${parts[0]}/${parts[2]}`;
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
        return "id,name,authorId,imageUrl,embedUrl, viewCount";
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

