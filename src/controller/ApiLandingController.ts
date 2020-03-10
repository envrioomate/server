import {Request, Response, Router} from "express";
import * as passport from "passport";
import {User} from "../entity/user/User";
import * as jwt from "jsonwebtoken";
import {Team} from "../entity/social/Team";
import {getRepository} from "typeorm";
import {Membership} from "../entity/social/Membership";
import {PasswordResetToken} from "../entity/user/PasswordResetToken";
import {Tasks} from "../tasks";
import {publish} from "../util/EventUtil";

let router = Router();
const config = require("../../config.json");

/**
 * @api {post} /api/login Login
 * @apiName Login
 * @apiGroup Client Login
 * @apiSuccess {Object} token the Bearer Token
 * @apiError {String} message The error
 * @apiExample Example usage:
 POST http://enviroommate.org:3000/api/login
 Accept: application/json
 Cache-Control: no-cache
 Content-Type: application/json

 {"username" : "1@test.com", "password":"test"}

 res: {"id":3,"token":"eyJhbGciOiJIUzI1NiJ9.Mw.s8smHWCZOUQBxQY-U5Ds2HhsjpNcRY08p_OfNGmimi4"}
 */
router.post('/login', passport.authenticate('local', {session: false}), (req: Request, res: Response, done: Function) => {
    if (!req.user) {
        res.status(401);
        done(res.json({message: "No such user!"}));
    }
    const id = req.user.id;
    const token = jwt.sign(id, config.tokenSecret);
    res.json({id,token});
    done();
});

//router.get('/checkToken', passport.authenticate('jwt', {session: false}), (req: Request, res: Response, done: Function) => {
//    res.status(204);
//    done();
//});

router.get('/checkToken', passport.authenticate('jwt', {session: false}), async (req: Request, res: Response, done: Function) => {
    res.status(204);
    res.json({status: true});
    done();
});

router.get('/checkEmail', async (request: Request, response: Response, done: Function) => {
    const userName = request.query.username;
    getRepository(User).findOne({userName: userName}).then(async (user) => {
        if (user == null) {
            response.json({status: "false"});
            done();
        } else {
            response.json({status: "true"});
            done();
        }
    }).catch((err) => console.log(err));
});
/**
 * @api {post} /api/register Register
 * @apiName Register
 * @apiGroup Client Login
 * @apiSuccess {Object} token the Bearer Token
 * @apiError {String} message The error
 * @apiExample Example usage:
 POST http://enviroommate.org:3000/api/login
 Accept: application/json
 Cache-Control: no-cache
 Content-Type: application/json

 {"username" : "1@test.com", "password":"test"}

 res: {"id":3,"token":"eyJhbGciOiJIUzI1NiJ9.Mw.s8smHWCZOUQBxQY-U5Ds2HhsjpNcRY08p_OfNGmimi4"}
 */
router.post('/register', async (request: Request, response: Response, done: Function) => {
    //validate
    request.checkBody('username', 'Email is required').notEmpty();
    request.checkBody('username', 'Email is not valid').isEmail();
    request.checkBody('screenname', 'Username is required').notEmpty();
    request.checkBody('password', 'Password is required').notEmpty();
    request.checkBody('confirm_password', 'Passwords do not match').equals(request.body.password);

    let err = request.validationErrors();
    if (err) {
        response.status = 400;
        done(response.json({message: "Something went wrong :(", error: err}));
    }

    //get form data
    let username = request.body.username;
    let screenname = request.body.screenname;
    let password = request.body.password;
    let confirmPassword = request.body.confirm_password;

    if(confirmPassword !== password){
        response.status(422);
        done(response.json({message: "'Passwort' und 'Passwort wiederholen' stimmen nicht überein!"}));
    }

    getRepository(User).findOne({userName: username}).then(async (user) => {
        if (user == null) {
            let newUser = new User();
            newUser.userName = username;
            newUser.screenName = screenname;
            newUser.password = password;
            await getRepository(User).insert(newUser);
            let u = await getRepository(User).findOne({where:{userName: newUser.userName}});

            publish(u, "create");

            response.json(newUser.transfer(true));
            done();
        } else {
            response.status = 400;
            done(response.json({message: "Username already taken"}));
        }
    })
});

router.get('/resetPassword', async (request: Request, response: Response, done: Function) => {
    const username = request.query.username;
    let user = await getRepository(User).findOne({where: {userName: username}, relations: ["passwordResetToken"]});
    if (user) {
        if (!user.passwordResetToken) {
            let resetToken = new PasswordResetToken();
            resetToken.user = user;
            await getRepository(PasswordResetToken).save(resetToken).catch((err) => {
                console.error(err);
                response.sendStatus(500);
                done();
            });
        }
        Tasks.sendPasswordReset(user.id).then((res) => {
            response.sendStatus(201);
            done();
        }).catch((err) => {
            response.sendStatus(400)
            done();
        });
    } else {
        response.sendStatus(400);
        done();
    }
});

router.post('/resetPassword', async (request: Request, response: Response, done: Function) => {
    const token = request.body.resettoken;
    const newPassword = request.body.password;
    let resetToken = await getRepository(PasswordResetToken).findOne({where: {resetToken: token}});
    if (!resetToken) {
        response.sendStatus(400);
    } else {
        resetToken.user.password = newPassword;
        resetToken.user.encrypt();
        getRepository(User).save(resetToken.user).then((user) => {
            response.sendStatus(201);
            getRepository(PasswordResetToken).delete({id: resetToken.id}).catch((err)=>console.error(err));
        }).catch((err) => {
            response.sendStatus(500);
        })
    }

});
export {router as ApiLandingContoller} ;