import "reflect-metadata";
import * as TypeORM from "typeorm";
import * as TypeGraphQL from "type-graphql";
import {Container} from "typedi";
import * as express from "express";
import {Request, Response} from "express";
import * as bodyParser from "body-parser";
import * as passport from "passport";
import * as flash from "flash";
import * as session from "express-session";
import * as expressValidator from "express-validator";
import * as cookieParser from "cookie-parser";
import * as path from "path";
import {ApiContoller} from "./controller/ApiController";
import {passportConf} from "./PassportConfig";
import {ApiLandingContoller} from "./controller/ApiLandingController";
import * as cors from 'cors';
import {Tasks} from "./tasks";
import {FeedController} from "./controller/GqlController";
import {WikiSyncController} from "./controller/WikiSyncController";
import {GameProgressionManager} from "./gameLogic/GameProgressionManager";
import * as redis from "redis";
import {RedisClient} from "redis";
import {LeaderBoardManager} from "./gameLogic/LeaderBoardManager";
import {PushNotificationService} from "./push/PushNotificationService";

let config = require("../config.json");

let client: RedisClient = redis.createClient({db: config.redisDb});
Container.set("redis", client);

TypeORM.useContainer(Container)
// TypeGraphQL.useContainer(Container);

TypeORM.createConnection().then(async connection => {
    // setUpCurrentSeason cron-like tasks
    const tasks = Container.get(Tasks);
    const gameProgressionManager = Container.get(GameProgressionManager);
    const leadboardManager = Container.get(LeaderBoardManager);
    const pushNotificationService = Container.get(PushNotificationService);
    // create express app
    const app = express();

    // setup express app
    const logger = (request: Request, response: Response, done: Function) => {
        console.log("Got request to " + request.originalUrl);
        done()
    };
    app.use(cors());
    app.options('*', cors());

    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });


    app.use(logger);
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(cookieParser());
    //
    app.use(session({
        secret: process.env.SECRET || config.secret,
        resave: false,
        saveUninitialized: true,
        cookie: {secure: !config.dev}
    }));
    app.use(flash());
    app.use(passportConf);
    app.use(passport.session());
    app.use(expressValidator());

    try {
        app.use('/api/', ApiLandingContoller);
        app.use('/api/auth', passport.authenticate('jwt', {session: false}), ApiContoller);
        app.use('/api/sync', WikiSyncController);
        app.use('/giql', passport.authenticate('basic', {session: false}), FeedController);
        app.use('/api/gql', passport.authenticate('jwt', {session: false}), FeedController);
    } catch (e) {
        console.error(e);
        process.exit(-1);
    }
    // setup static assets
    // TODO replace with something less homebrew
    app.use('/img', (req, res) => {
        const filepath = path.join(__dirname, '..', 'img', req.url);
        console.log("GET " + filepath);
        res.sendFile(filepath, (err) => {
            console.log(err);
            res.status(404);
            res.sendFile(path.join(__dirname, '..', 'img', 'default.png'));
        });
    });
    app.enable('view cache');

    // start express server
    let listener = app.listen(config.port || 3000);

    //https.createServer(httpsOptions, app).listen(config.port || 443);



    console.log("" +
        " _   ___ _                  __            _         \n" +
        "| | / / (_)                / _|          | |        \n" +
        "| |/ /| |_ _ __ ___   __ _| |_ _   _  ___| |__  ___ \n" +
        "|    \\| | | '_ ` _ \\ / _` |  _| | | |/ __| '_ \\/ __|\n" +
        "| |\\  \\ | | | | | | | (_| | | | |_| | (__| | | \\__ \\\n" +
        "\\_| \\_/_|_|_| |_| |_|\\__,_|_|  \\__,_|\\___|_| |_|___/")

    console.log(`Klimafuchs server has started on port ${listener.address().port}.`);


}).catch(error => console.log(error));
