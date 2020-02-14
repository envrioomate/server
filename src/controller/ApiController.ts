import {Router, Request, Response} from "express";
import {getRepository, LessThan, Like, MoreThan} from "typeorm";
import {Team} from "../entity/social/Team";
import {User} from "../entity/user/User";
import * as bodyParser from "body-parser"
import * as Url from "url";
import * as QueryString from "querystring";
import {query} from "express-validator/check";
import {Badge} from "../entity/wiki-content/Badge";
import {arraysAreEqual} from "tslint/lib/utils";
import {Membership} from "../entity/social/Membership";
import {loadConfigurationFromPath} from "tslint/lib/configuration";
import {Alert} from "../entity/Alert";
import {DateUtils} from "typeorm/util/DateUtils";

let router = Router();

async function loadRelations(user: User): Promise<User> {
    let u = await getRepository(User).findOne({where: {id: user.id}, relations: ["membership"]});
    if (!u) console.error("no such user");
    return u;
}

async function loadMembership(user: User): Promise<Membership> {
    return await getRepository(Membership).findOne({where: {user: user.id}, relations: ["user","group"]});

}

function sendServerError(response: Response, done: Function) {
    console.error("error handler called");
    response.status = 500;
    response.json({message: "Internal Server error"});
    return done()
}

/**
 * @api {get}/api/auth/profile Get Profile
 * @apiName Profile
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiSuccess {Object} user The currently logged in users data
 * @apiError {String} message The error
 * @apiDescription Gets the user data of the logged in user. Authorization via bearer token
 * @apiExample {curl} Example usage of bearer token:
 GET http://enviroommate.org:3000/api/profile
 Accept: application/json
 Cache-Control: no-cache
 Content-Type: application/json
 Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.Mw.s8smHWCZOUQBxQY-U5Ds2HhsjpNcRY08p_OfNGmimi4

 res: {"id":3,"userName":"1@test.com","screenName":"test","dateCreated":"2018-05-25T20:28:11.000Z","emailConfirmed":false,"isBanned":false,"group":""}
 */
router.use(bodyParser.json());
router.get("/profile", (request: Request, response: Response, done: Function) => {
    done(response.json(((request.user) as User).transfer(true)));
});

/**
 * @api {get} /api/auth/current-challenge Followed WG
 * @apiName Followed WG
 * @apiGroup ClientAPI
 * @apiHeader {Authorization} Bearer token  The jwt token
 * @apiSuccess {Object} challenge gets the current challenge
 * @apiError {String} message The error
 */
router.get("/current-challenge", async (request: Request, response: Response, done: Function) => {
    let challenge = await getCurrentChallenge()
    response.json(challenge);

    done()
});

async function getCurrentChallenge(): Promise<Badge> {
    let c = await getRepository(Badge).findOne({where: {active: 1}});
    return c;
}

router.get("/alerts", async (request: Request, response: Response, done: Function) => {

    let alerts = await getRepository(Alert).find().catch((err) => console.error(err));
    if(alerts) {
        alerts.filter(alert => alert.shouldSend)
    }
    response.json(alerts);
    done();
});



export {router as ApiContoller} ;