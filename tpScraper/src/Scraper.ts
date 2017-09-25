import http = require('http');
import fs = require('fs');
import * as WebRequest from 'web-request';

import { Promise as es6Promise } from 'es6-promise';

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

interface Followers {
    authorFeedInfos: Array<AuthorProfile>;
    hasMoreResults: boolean;
}

interface Following extends Followers {}

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
    private authorsMap: {[key: string]: AuthorRow | {}} = {};
    private workbooksMap: {[key: string]: WorkbookRow} = {};
    private authorScraped: number = 0;
    private authorsToQuery: Array<string> = [];
    private maxAuthors: number = 1000;
    private concurrentCalls: number = 0;
    public constructor(private authorsFile: string, private workbooksFile: string) {
        fs.appendFileSync(authorsFile, this.GetAuthorTableSchema());
        fs.appendFileSync(workbooksFile, this.GetWorkbookTableSchema());
    };

    //the entry points for the scrape
    public initialize(ids: string[]): void {
        this.authorsToQuery = ids;
        this.scrapeArtists();
    }

    public scrapeArtists(): void {
        if (this.concurrentCalls > 50) {
            console.log("~~~~~~~~~~~~~~~~ too much slow down!");
            return;
        }
        console.log("number of artists scraped: " + Object.keys(this.authorsMap).length);
        console.log("number of artists remaining: " + this.authorsToQuery.length);
        console.log("number of workbooks scraped: " + Object.keys(this.workbooksMap).length);
        if (this.authorsToQuery.length > 0 && Object.keys(this.authorsMap).length < this.maxAuthors) {
            let currId = this.authorsToQuery.pop();
            if (!currId) {
                console.error('curr id is null');
                return;
            }
            if (!this.authorsMap[currId]) {
                this.concurrentCalls++;                
                this.scrapeAuthor(currId).then(() => {
                    this.concurrentCalls--; 
                    if (Object.keys(this.authorsMap).length < this.maxAuthors) {
                        this.scrapeArtists();                        
                    }
                    console.log("finished scraping author: " + currId + " time:" + new Date().toISOString());
                });
                //indicate i'm already working on this author
                this.authorsMap[currId] = {};
            }
            setTimeout(() => {
                this.scrapeArtists();
            }, 2000);
        } else {
            console.log('finished scraping~~~');
            return; 
        }
    }

    private printStatus(result :WebRequest.Response<string>): void {
        console.log(result.statusCode);
        console.log(result.statusMessage);
    }

    public async scrapeAuthor(authorId: string): Promise<void> {
        const options: http.RequestOptions = {
            host: "public.tableau.com",
            path: `/profile/api/${authorId}`
        };
        console.log('scraping author: ' + authorId);

        let authorRequest = WebRequest.get(`https://public.tableau.com/profile/api/${authorId}`);
        let followerRequest =  this.getFollowers(authorId);
        let followingRequest = this.getFollowing(authorId);
        return Promise.all([authorRequest, followerRequest, followingRequest]).then((results) => {
            this.printStatus(results[0]);
            let profile: AuthorProfile = JSON.parse(results[0].content);
            let followersId: Array<string> = results[1];
            let followingId: Array<string> = results[2];
            this.authorsToQuery = this.authorsToQuery.concat(followingId);
            this.authorsToQuery = this.authorsToQuery.concat(followersId);
            this.processAuthorProfile(profile, followersId, followingId);
        });
    }

    public async getFollowers(authorId: string): Promise<Array<string>> {
        console.log("scraping followers: ");
        let results: Array<string> = [];
        let count: number = 200;
        let index: number = 0;
        let followerRequest = await WebRequest.get(`https://public.tableau.com/profile/api/followers/${authorId}?count=${count}&index=${index}`);
        console.log(followerRequest.statusCode);
        let followers: Followers = JSON.parse(followerRequest.content);
        if (followers && followers.authorFeedInfos && followers.authorFeedInfos.length > 0) {
            results = followers.authorFeedInfos.map((profile) => {
                return profile.profileName;
            });
        }
        while (followers.hasMoreResults) {
            index = index + count;
            followerRequest = await WebRequest.get(`https://public.tableau.com/profile/api/followers/${authorId}?count=${count}&index=${index}`);
            console.log("followers: ");
            this.printStatus(followerRequest);   
            followers = JSON.parse(followerRequest.content);
            followers.authorFeedInfos.forEach((profile) => {
                results.push(profile.profileName);
            });
        }
        return results;
    }

    public async getFollowing(authorId: string): Promise<Array<string>> {
        console.log("scraping following: ");        
        let results: Array<string> = [];
        let count: number = 200;
        let index: number = 0;
        let followerRequest = await WebRequest.get(`https://public.tableau.com/profile/api/following/${authorId}?count=${count}&index=${index}`);
        let followings: Followers = JSON.parse(followerRequest.content);
        if (followings && followings.authorFeedInfos && followings.authorFeedInfos.length > 0) {
            results = followings.authorFeedInfos.map((profile) => {
                return profile.profileName;
            });
        }
        while (followings.hasMoreResults) {
            index = index + count;
            followerRequest = await WebRequest.get(`https://public.tableau.com/profile/api/following/${authorId}?count=${count}&index=${index}`);
            console.log("following: ");
            this.printStatus(followerRequest);  
            followings = JSON.parse(followerRequest.content);
            followings.authorFeedInfos.forEach((profile) => {
                results.push(profile.profileName);
            });
        }
        return results;
    }

    private processAuthorProfile(profile: AuthorProfile, followers: Array<string>, following: Array<string>): void {
        let workbooks: Array<Workbook> = profile.workbooks;
        this.processWorkbooks(workbooks, profile.profileName);
        let line: string = '\n' + [this.addQuotes(profile.profileName), this.addQuotes(profile.name), profile.totalNumberOfFollowers, profile.totalNumberOfFollowing,
            profile.visibleWorkbookCount, this.addQuotes(followers.join(';')), following.join(';'), profile.avatarUrl].join(',');
        fs.appendFile(this.authorsFile, line, 'utf-8', ()=>{
        });
        // this.authorsMap[profile.profileName] = {
        //     id: profile.profileName,
        //     name: profile.name,
        //     followerCount: profile.totalNumberOfFollowers,
        //     followingCount: profile.totalNumberOfFollowing,
        //     workbookCount: profile.visibleWorkbookCount,
        //     avatarUrl: profile.avatarUrl,
        //     followerIds: followers,
        //     followingIds: following
        // }
    }

    private processWorkbooks(workbooks: Array<Workbook>, authorId: string) {
        workbooks.forEach(wb => {
            let id: string = wb.title + authorId;
            let line: string = '\n' +  [this.addQuotes(id), this.addQuotes(wb.title), this.addQuotes(authorId), this.generateImageUrl(wb.defaultViewRepoUrl), 
                this.generateEmbedUrl(wb.defaultViewRepoUrl), wb.viewCount].join(',');
            fs.appendFile(this.workbooksFile, line, 'utf-8', () => {

            });
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

    public addQuotes(str: string): string {
        return "\"" + str + "\"";
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
        //fs.unlinkSync(authorsPath);
        const newPath = './data/authors-' + dateStr + '.csv';
        fs.renameSync(authorsPath, newPath);
    }

    if (fs.existsSync(workbooksPath)) {
        //fs.unlinkSync(workbooksPath);
        const newPath = './data/workbooks-' + dateStr + '.csv';
        fs.renameSync(workbooksPath, newPath);
    }
    let scraper: Scraper = new Scraper(authorsPath, workbooksPath);
    scraper.initialize(['sandy.wang']);
}

prepareFiles();
