import {Badge} from "./entity/wiki-content/Badge";
import {getRepository, Repository} from "typeorm";
import * as schedule from 'node-schedule';
import {Subscription} from "./entity/user/Subscription";
import * as webPush from 'web-push';
//import * as sendmail from 'sendmail';
import {PasswordResetToken} from "./entity/user/PasswordResetToken";
import {WikiClient} from "./wikiData/WikiClient";
import {Container, Service} from "typedi";
import {Role, User} from "./entity/user/User";
import {GameProgressionManager} from "./gameLogic/GameProgressionManager";
import {PushNotificationService} from "./push/PushNotificationService";

@Service()
export class Tasks {

    public mondayJob;

    public seasonJob;
    public syncWithWikiJob;
    public remindAchievementsJob;
    public updateAchievementsJob;

    public constructor() {

        // db updates

        //update wiki data on server restart
        this.syncWithWiki().then((res) => console.log(res));

        let syncWithWikiTimer = new schedule.RecurrenceRule();
        syncWithWikiTimer.hour = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
        syncWithWikiTimer.minute = 0;
        this.syncWithWikiJob = schedule.scheduleJob(syncWithWikiTimer, this.syncWithWiki);

        // notify monday
        let mondayTimer = new schedule.RecurrenceRule();
        mondayTimer.dayOfWeek = [1];
        mondayTimer.hour = 17;
        mondayTimer.minute = 0;
        this.mondayJob = schedule.scheduleJob(mondayTimer, () => {
            //TODO push challenge reminder
        });

        let seasonTimer = new schedule.RecurrenceRule();
        seasonTimer.hour = [1];
        seasonTimer.minute = 0;
        this.seasonJob = schedule.scheduleJob(seasonTimer, () => {
            Container.get(GameProgressionManager).setUpCurrentSeason().catch(e => console.error(e));
        });

        let remindAchievementsTimer = new schedule.RecurrenceRule();
        remindAchievementsTimer.dayOfWeek = [3];
        remindAchievementsTimer.hour = [18];
        remindAchievementsTimer.minute = 0;
        this.remindAchievementsJob = schedule.scheduleJob(remindAchievementsTimer, () => {
            //TODO notify about achievments
            Container.get(PushNotificationService).remindAchievements().catch(e => console.error(e));

        });

        let updateAchievementsTimer = new schedule.RecurrenceRule();
        mondayTimer.dayOfWeek = [3];
        updateAchievementsTimer.hour = [18];
        updateAchievementsTimer.minute = 0;
        this.updateAchievementsJob = schedule.scheduleJob(updateAchievementsTimer, () => {
            //TODO update achievments
            Container.get(GameProgressionManager).updateAchievements().catch(e => console.error(e));

        });

        if (process.env.NODE_ENV !== "production") {
            const defaultAdmin = new User();
            defaultAdmin.userName = "root";
            defaultAdmin.password = "root";
            defaultAdmin.screenName = "root";
            defaultAdmin.role = Role.Admin;
            const defaultUser = new User();
            defaultUser.userName = "user";
            defaultUser.password = "user";
            defaultUser.screenName = "user";
            defaultUser.role = Role.User;

            const userRepo = getRepository(User);
            userRepo.findOneOrFail({where: {userName: "root"}}).then(() => {
                console.error("Found default test users! This should not happen in PRODUCTION")
            }).catch(
                _ => {
                    userRepo.save(defaultUser)
                        .catch(e => console.error(e));
                    userRepo.save(defaultAdmin)
                        .catch(e => console.error(e));
                }
            )

        }
    }

    async syncWithWiki() {
        console.log("syncing data from wiki...");
        Container.get(WikiClient).syncAllPages().catch(err => console.error("Error: " + err.toString()))
    }

    public static async sendPasswordReset(userId) {

        let token = await getRepository(PasswordResetToken).findOne({user: userId});
        if (!token) return;
        const sendmail = require('sendmail')({
            logger: {
                debug: console.log,
                info: console.info,
                warn: console.warn,
                error: console.error
            },
            silent: false,
            dkim: {
                privateKey: process.env.DKIM_PRIVATE_KEY || require("fs").readFileSync("/opt/dkim.pem"),
                keySelector: "k4all",
                domainName: "k4all.dastreibendewerk.de"
            },
        })
        sendmail({
            from: 'no-reply@k4all.dastreibendewerk.de',
            to: token.user.userName,
            subject: 'Klimaschutz For All App Passwort zurücksetzen',
            text:
                `Hallo, 
 
hier kannst Du dein Passwort für die Klimaschutz For All App zurücksetzen: 
https://k4all.dastreibendewerk.de/app/resetPassword?resettoken=${token.resetToken} 
                  
- Das Klimaschutz For All Team
\n
Diese Nachricht wurde automatisch erstellt. Um uns zu erreichen besuch bitte unsere Website unter https://www.klimaschutz4all.com/            
`, //TODO figure out where to store mail templates
        }, function (err, reply) {
            console.log(err && err.stack);
            console.log(reply);
        });
    }
}

