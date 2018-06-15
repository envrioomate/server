import {getRepository} from "typeorm";
import {NextFunction, Router, Request, Response} from "express";

import {User} from "../entity/User";
import * as passport from "passport";
import {Group} from "../entity/Group";
import {PasswordResetToken} from "../entity/PasswordResetToken";
import {Tasks} from "../tasks";
import {Member} from "../entity/Member";


let router = Router();

router.get('/', (req: Request, res: Response) => {
    return res.render('index', {home_active: "active"})
});

router.get('/login', login);
router.get('/register', register);
router.post('/login',
    passport.authenticate('local'),
    (req, res) => {
        // If this function gets called, authentication was successful.
        // `req.user` contains the authenticated user.
        res.redirect('/');
    });
router.post('/register', postRegister);

function login(request: Request, response: Response, next: NextFunction) {
    return response.render('login', {login_active: "active"});
}

function register(request: Request, response: Response, next: NextFunction) {
    return response.render('register', {reg_active: "active"});
}

async function postRegister(request: Request, response: Response, done: NextFunction) {

    //validate
    request.checkBody('username', 'Email is required').notEmpty();
    request.checkBody('username', 'Email is not valid').isEmail();
    request.checkBody('screenname', 'Username is required').notEmpty();
    request.checkBody('password', 'Password is required').notEmpty();
    request.checkBody('confirm_password', 'Passwords do not match').equals(request.body.password);

    let err = request.validationErrors();
    if (err) {
        return response.render('register', {reg_active: "active", errors: err});
    }

    //get form data
    let username = request.body.username;
    let screename = request.body.screenname;
    let password = request.body.password;
    let confirmPassword = request.body.confirm_password;
    let inviteLink = request.body.invite;

    getRepository(User).findOne({userName: username}).then(async (user) => {
        if (user == null) {
            let newUser = new User();
            newUser.userName = username;
            newUser.screenName = screename;
            newUser.password = password;
            if (inviteLink != null) {
                getRepository(Group).findOne({inviteId: inviteLink}).then(async (group) => {
                    let m = new Member();
                    m.group = group;
                    m.user = request.user;
                    await getRepository(Member).save(m);
                    let updated = await getRepository(Group).findOne({id: group.id});
                    response.json(updated.transfer(true));
                })
            }
            let user = await getRepository(User).insert(newUser);
            if(user){
                response.sendStatus(201);
            } else {
                response.sendStatus(400);
            }
            done();
        } else {
            response.sendStatus(400);
            done();
        }
    })
}

export {router as LoginController}