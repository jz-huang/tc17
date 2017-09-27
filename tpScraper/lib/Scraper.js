"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var http = require("http");
var fs = require("fs");
var WebRequest = require("web-request");
var AuthorRow = /** @class */ (function () {
    function AuthorRow() {
    }
    return AuthorRow;
}());
var WorkbookRow = /** @class */ (function () {
    function WorkbookRow() {
    }
    return WorkbookRow;
}());
var Scraper = /** @class */ (function () {
    function Scraper(authorsFile, workbooksFile) {
        this.authorsFile = authorsFile;
        this.workbooksFile = workbooksFile;
        this.authorsMap = {};
        this.workbooksMap = {};
        this.authorScraped = 0;
        this.authorsToQuery = [];
        this.maxAuthors = 100000;
        this.concurrentCalls = 0;
        fs.appendFileSync(authorsFile, this.GetAuthorTableSchema());
        fs.appendFileSync(workbooksFile, this.GetWorkbookTableSchema());
    }
    ;
    //the entry points for the scrape
    Scraper.prototype.initialize = function (ids) {
        this.authorsToQuery = ids;
        this.scrapeArtists();
    };
    Scraper.prototype.scrapeArtists = function () {
        var _this = this;
        if (this.concurrentCalls > 50) {
            console.log("~~~~~~~~~~~~~~~~ too much slow down!");
            return;
        }
        console.log("number of artists scraped: " + Object.keys(this.authorsMap).length);
        console.log("number of artists remaining: " + this.authorsToQuery.length);
        console.log("number of workbooks scraped: " + Object.keys(this.workbooksMap).length);
        if (this.authorsToQuery.length > 0 && Object.keys(this.authorsMap).length < this.maxAuthors) {
            var currId_1 = this.authorsToQuery.pop();
            if (!currId_1) {
                console.error('curr id is null');
                return;
            }
            if (!this.authorsMap[currId_1]) {
                this.concurrentCalls++;
                this.scrapeAuthor(currId_1).then(function () {
                    _this.concurrentCalls--;
                    if (Object.keys(_this.authorsMap).length < _this.maxAuthors) {
                        _this.scrapeArtists();
                    }
                    console.log("finished scraping author: " + currId_1 + " time:" + new Date().toISOString());
                });
                //indicate i'm already working on this author
                this.authorsMap[currId_1] = {};
            }
            setTimeout(function () {
                _this.scrapeArtists();
            }, 2000);
        }
        else {
            console.log('finished scraping~~~');
            return;
        }
    };
    Scraper.prototype.printStatus = function (result) {
        console.log(result.statusCode);
        console.log(result.statusMessage);
    };
    Scraper.prototype.scrapeAuthor = function (authorId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var options, authorRequest, followerRequest, followingRequest;
            return __generator(this, function (_a) {
                options = {
                    host: "public.tableau.com",
                    path: "/profile/api/" + authorId
                };
                console.log('scraping author: ' + authorId);
                authorRequest = WebRequest.get("https://public.tableau.com/profile/api/" + authorId);
                followerRequest = this.getFollowers(authorId);
                followingRequest = this.getFollowing(authorId);
                return [2 /*return*/, Promise.all([authorRequest, followerRequest, followingRequest]).then(function (results) {
                        _this.printStatus(results[0]);
                        var profile = JSON.parse(results[0].content);
                        var followersId = results[1];
                        var followingId = results[2];
                        _this.authorsToQuery = _this.authorsToQuery.concat(followingId);
                        _this.authorsToQuery = _this.authorsToQuery.concat(followersId);
                        _this.processAuthorProfile(profile, followersId, followingId);
                    })];
            });
        });
    };
    Scraper.prototype.getFollowers = function (authorId) {
        return __awaiter(this, void 0, void 0, function () {
            var results, count, index, followerRequest, followers;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("scraping followers: ");
                        results = [];
                        count = 200;
                        index = 0;
                        return [4 /*yield*/, WebRequest.get("https://public.tableau.com/profile/api/followers/" + authorId + "?count=" + count + "&index=" + index)];
                    case 1:
                        followerRequest = _a.sent();
                        console.log(followerRequest.statusCode);
                        followers = JSON.parse(followerRequest.content);
                        if (followers && followers.authorFeedInfos && followers.authorFeedInfos.length > 0) {
                            results = followers.authorFeedInfos.map(function (profile) {
                                return profile.profileName;
                            });
                        }
                        _a.label = 2;
                    case 2:
                        if (!followers.hasMoreResults) return [3 /*break*/, 4];
                        index = index + count;
                        return [4 /*yield*/, WebRequest.get("https://public.tableau.com/profile/api/followers/" + authorId + "?count=" + count + "&index=" + index)];
                    case 3:
                        followerRequest = _a.sent();
                        console.log("followers: ");
                        this.printStatus(followerRequest);
                        followers = JSON.parse(followerRequest.content);
                        followers.authorFeedInfos.forEach(function (profile) {
                            results.push(profile.profileName);
                        });
                        return [3 /*break*/, 2];
                    case 4: return [2 /*return*/, results];
                }
            });
        });
    };
    Scraper.prototype.getFollowing = function (authorId) {
        return __awaiter(this, void 0, void 0, function () {
            var results, count, index, followerRequest, followings;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("scraping following: ");
                        results = [];
                        count = 200;
                        index = 0;
                        return [4 /*yield*/, WebRequest.get("https://public.tableau.com/profile/api/following/" + authorId + "?count=" + count + "&index=" + index)];
                    case 1:
                        followerRequest = _a.sent();
                        followings = JSON.parse(followerRequest.content);
                        if (followings && followings.authorFeedInfos && followings.authorFeedInfos.length > 0) {
                            results = followings.authorFeedInfos.map(function (profile) {
                                return profile.profileName;
                            });
                        }
                        _a.label = 2;
                    case 2:
                        if (!followings.hasMoreResults) return [3 /*break*/, 4];
                        index = index + count;
                        return [4 /*yield*/, WebRequest.get("https://public.tableau.com/profile/api/following/" + authorId + "?count=" + count + "&index=" + index)];
                    case 3:
                        followerRequest = _a.sent();
                        console.log("following: ");
                        this.printStatus(followerRequest);
                        followings = JSON.parse(followerRequest.content);
                        followings.authorFeedInfos.forEach(function (profile) {
                            results.push(profile.profileName);
                        });
                        return [3 /*break*/, 2];
                    case 4: return [2 /*return*/, results];
                }
            });
        });
    };
    Scraper.prototype.processAuthorProfile = function (profile, followers, following) {
        var workbooks = profile.workbooks;
        this.processWorkbooks(workbooks, profile.profileName);
        var line = '\n' + [this.addQuotes(profile.profileName), this.addQuotes(profile.name), profile.totalNumberOfFollowers, profile.totalNumberOfFollowing,
            profile.visibleWorkbookCount, this.addQuotes(followers.join(';')), this.addQuotes(following.join(';')), this.addQuotes(profile.avatarUrl)].join(',');
        fs.appendFile(this.authorsFile, line, 'utf-8', function () {
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
    };
    Scraper.prototype.processWorkbooks = function (workbooks, authorId) {
        var _this = this;
        workbooks.forEach(function (wb) {
            var id = wb.title + authorId;
            var line = '\n' + [_this.addQuotes(id), _this.addQuotes(wb.title), _this.addQuotes(authorId), _this.generateImageUrl(wb.defaultViewRepoUrl),
                _this.generateEmbedUrl(wb.defaultViewRepoUrl), wb.viewCount].join(',');
            fs.appendFile(_this.workbooksFile, line, 'utf-8', function () {
            });
            if (!_this.workbooksMap[id]) {
                _this.workbooksMap[id] = {
                    id: id,
                    name: wb.title,
                    viewCount: wb.viewCount,
                    imageUrl: _this.generateImageUrl(wb.defaultViewRepoUrl),
                    embedUrl: _this.generateEmbedUrl(wb.defaultViewRepoUrl),
                    authorId: authorId
                };
            }
        });
    };
    Scraper.prototype.generateImageUrl = function (repoUrl) {
        var parts = repoUrl.split('/');
        var firstTwo = parts[0].substring(0, 2);
        return "https://public.tableau.com/static/images/" + firstTwo + "/" + parts[0] + "/" + parts[2] + "/4_3.png";
    };
    Scraper.prototype.generateEmbedUrl = function (repoUrl) {
        var parts = repoUrl.split('/');
        return "https://public.tableau.com/views/" + parts[0] + "/" + parts[2];
    };
    Scraper.prototype.GetAuthorProfile = function (authorId) {
        var options = {
            host: "public.tableau.com",
            path: "/profile/api/" + authorId
        };
        var req = http.request(options, function (res) {
            console.log("STATUS: " + res.statusCode);
            console.log("HEADERS: " + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log("BODY: " + chunk);
            });
            res.on('end', function () {
                console.log('No more data in response.');
            });
        });
        req.end();
    };
    Scraper.prototype.GetAuthorFollowers = function (authorId) {
        var options = {
            host: "public.tableau.com",
            path: "/profile/api/followers/" + authorId + "?count=1000&index=0"
        };
        var req = http.request(options, function (res) {
            console.log("STATUS: " + res.statusCode);
            console.log("HEADERS: " + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log("BODY: " + chunk);
            });
            res.on('end', function () {
                console.log('No more data in response.');
            });
        });
        req.end();
    };
    Scraper.prototype.addQuotes = function (str) {
        return "\"" + str + "\"";
    };
    Scraper.prototype.GetAuthorTableSchema = function () {
        return "id,authorName,followerCount,followingCount,workbookCount,followerIds,followingIds,avatarUrl";
    };
    Scraper.prototype.GetWorkbookTableSchema = function () {
        return "id,name,authorId,imageUrl,embedUrl, viewCount";
    };
    return Scraper;
}());
function prepareFiles() {
    var authorsPath = './data/authors.csv';
    var workbooksPath = './data/workbooks.csv';
    var timeStamp = new Date().toISOString();
    var dateStr = timeStamp.substring(0, timeStamp.indexOf('.')).split(':').join('-');
    if (fs.existsSync(authorsPath)) {
        //fs.unlinkSync(authorsPath);
        var newPath = './data/authors-' + dateStr + '.csv';
        fs.renameSync(authorsPath, newPath);
    }
    if (fs.existsSync(workbooksPath)) {
        //fs.unlinkSync(workbooksPath);
        var newPath = './data/workbooks-' + dateStr + '.csv';
        fs.renameSync(workbooksPath, newPath);
    }
    var scraper = new Scraper(authorsPath, workbooksPath);
    scraper.initialize(['sandy.wang', 'priya.raghuveer', 'isabella.mayer.de.moura', 'mina.ozgen']);
}
prepareFiles();
