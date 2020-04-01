import Expo, {ExpoPushMessage, ExpoPushTicket} from 'expo-server-sdk';
import {Subscription} from "../entity/user/Subscription";
import {InjectRepository} from "typeorm-typedi-extensions";
import {getRepository, Not, Repository} from "typeorm";
import {Notification} from "../entity/user/Notification";
import {User} from "../entity/user/User";
import * as schedule from 'node-schedule';
import {subscribe} from "../util/EventUtil";
import {Membership} from "../entity/social/Membership";
import {FeedComment} from "../entity/social/FeedComment";
import {Container, Service} from "typedi";
import {FeedPost} from "../entity/social/FeedPost";
import {SeasonPlan} from "../entity/game-state/SeasonPlan";
import {AchievementCompletion} from "../entity/game-state/AchievementCompletion";
import {AchievementSelection} from "../entity/game-state/AchievementSelection";
import moment = require("moment");
import {ChallengeCompletion} from "../entity/game-state/ChallengeCompletion";
import {getCurrentLevel} from "../gameLogic/PlayerLevel";

@Service()
export class PushNotificationService {
    private expo = new Expo();

    pushCurrentMessagesJob;

    constructor(
        @InjectRepository(Notification) private readonly notificationRepository: Repository<Notification>,
        @InjectRepository(AchievementSelection) private readonly achievementSelectionRepository: Repository<AchievementSelection>,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
    ) {
        //collect unsent messages for 5 min and then push all of them
        this.pushCurrentMessagesJob = schedule.scheduleJob('*/5 * * * *', this._pushPendingNotifications);
    }

    private static _pushMessages = async (messages: { notification: Notification, message: ExpoPushMessage }[])
        : Promise<{ notification: Notification, message: ExpoPushMessage }[]> => {
        const expo = new Expo();
        console.log('pushing notfications...');
        console.log(messages);
        let chunks = expo.chunkPushNotifications(messages.map((message) => message.message));
        let ticketChunks = await Promise.all(chunks.map(async chunk => {
            try {
                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                console.log(ticketChunk);
                return ticketChunk;
            } catch (e) {
                console.error(e)
            }
        }));
        let tickets: ExpoPushTicket[] = ticketChunks.reduce((tickets, chunks) => tickets.concat(...chunks), []);
        return messages.map((message, index) => {
            message.notification.ticketId = tickets[index].id;
            return message
        }) // Array.zip() would be nice
    };

    private _pushPendingNotifications = async () => {
        //find all notifications that are not yet being sent
        let currentPendingNotifications = await this.notificationRepository.find({where: {status: 'pending'}});
        //lock them to this worker process
        currentPendingNotifications.forEach((notification) => {
            notification.status = "sent";
        });

        currentPendingNotifications = await this.notificationRepository.save(currentPendingNotifications);
        //generate ExpoPushMessages from Notification entities
        let messages = await Promise.all(currentPendingNotifications.map(async (notification) => {
            let recipient = await notification.user;
            let subscription = await recipient.subscription;
            let message: ExpoPushMessage = null;
            if (subscription) {
                message = {
                    to: subscription.pushToken,
                    title: notification.title,
                    body: notification.body,
                    data: {
                        title: notification.title,
                        icon: notification.icon,
                        body: notification.body,
                        path: notification.path
                    }
                };
            }
            return {
                notification,
                message
            }
        }));
        //push messages
        let sentMessages = await PushNotificationService._pushMessages(messages.filter((m) => m.message !== null));
        await this.notificationRepository.save(sentMessages.map(m => m.notification))
    };

    public async sendTestNotification(subscription: Subscription) {
        let message = {
            to: subscription.pushToken,
            body: 'This is a test notification',
            data: {
                title: 'Hello',
                icon: 'md-star',
                body: 'This is a test notification',
                path: 'App/NotificationsTab'
            },
        };
        await this.expo.sendPushNotificationsAsync([message])
    }

    @subscribe(Membership)
    public async notifyJoinedTeam(_memberShip: Membership, action: string) {
        if (action !== "confirm") return;
        try {
            let membership = await getRepository(Membership).findOne(_memberShip.id);
            if (!membership) return;

            let team = await membership.team;
            let user = await membership.user

            let otherMembers = (await team.members).filter(value => value.id !== membership.id);

            otherMembers.map(async value => {
                let recipient = await value.user;
                await PushNotificationService._buildNotification({
                    recipient,
                    title: `Dein Team wird größer!`,
                    body: `${user.userName} ist deinem Team beigetreten!`,
                    icon: 'md-group',
                    path: 'App/CompetitiveTab/Main/MyTeams'
                })
            });
        } catch (e) {
            console.error(e)
        }
    }

    @subscribe(Membership)
    public async notifyRequestJoinTeam(_memberShip: Membership, action: string) {
        if (action !== "request") return;
        try {
            let membership = await getRepository(Membership).findOne(_memberShip.id);
            if (!membership) return;

            let team = await membership.team;
            let user = await membership.user

            let otherMembers = (await team.members).filter(value => value.id !== membership.id && value.isAdmin);

            otherMembers.map(async value => {
                let recipient = await value.user;
                await PushNotificationService._buildNotification({
                    recipient,
                    title: `Dein Team wird größer!`,
                    body: `${user.screenName} möchte deinem Team beitreten.`,
                    icon: 'md-group',
                    path: 'App/CompetitiveTab/Main/MyTeams'
                })
            });
        } catch (e) {
            console.error(e)
        }
    }

    public async notifyAdminStatusChanged(memberShip: Membership) {

    }

    @subscribe(ChallengeCompletion)
    public async teamAcquiredBadge(_challengeCompletion: ChallengeCompletion, action: string) {
        if (action !== "add") return;
        try {
            let challengeCompletion = await getRepository(ChallengeCompletion).findOne(_challengeCompletion.id);
            if (!challengeCompletion) return;
            if (challengeCompletion.teamNotified) return;

            challengeCompletion.teamNotified = true;
            await getRepository(ChallengeCompletion).save(challengeCompletion);

            let owner = await challengeCompletion.owner;
            let memberships = await owner.memberships;
            let team = memberships.length > 0 ? await memberships[0].team : null;
            if (team === null) return;

            let members = (await team.members).filter(value => value.id !== memberships[0].id);

            let badge = await (await challengeCompletion.seasonPlanChallenge).challenge;

            members.map(async value => {
                let recipient = await value.user;
                await PushNotificationService._buildNotification({
                    recipient,
                    title: `Dein Team punktet!`,
                    body: `${owner.screenName} hat gerade das Abzeichen ${badge.name} geschafft!`,
                    icon: 'md-star',
                    path: 'App/CompetitiveTab'
                })
            });
        } catch (e) {
            console.error(e)
        }

    }

    @subscribe(FeedComment)
    public async commentListener(_feedComment: FeedComment, action: string) {

        let feedComment = await getRepository(FeedComment).findOneOrFail(_feedComment.id);
        let feedCommentAuthor = (await feedComment.author).screenName;
        let parent = await feedComment.parent || null;
        let post = await feedComment.post || null;


        if (parent) {
            let parentAuthor = await parent.author;
            let subscription = await parentAuthor.subscription;
            if (subscription) {
                let notification = new Notification();
                notification.user = Promise.resolve(parentAuthor);
                notification.subscription = subscription;
                notification.status = "pending";
                notification.title = `Neuer Kommentar`;
                notification.body = `${feedCommentAuthor} hat auf deinen Kommentar geantwortet`;
                notification.icon = "md-chatbubbles";
                notification.path = "App/FeedTab/" + post.id

                getRepository(Notification).save(notification).catch(err => console.error(err));
            }
        }

        if (post) {
            let parentAuthor = await post.author;
            let subscription = await parentAuthor.subscription;
            if (subscription) {
                let notification = new Notification();
                notification.user = Promise.resolve(parentAuthor);
                notification.subscription = subscription;
                notification.status = "pending";
                notification.title = `Neuer Kommentar`;
                notification.body = `${feedCommentAuthor} hat auf deinen Post ${post.title} geantwortet`;
                notification.icon = "md-chatbubbles";
                notification.path = "App/FeedTab/" + post.id

                getRepository(Notification).save(notification).catch(err => console.error(err));
            }
        }
    }

    @subscribe(FeedPost)
    public async feedPostListener(_feedPost: FeedPost, action: string) {

        if (action !== "pinned") return;

        let post = await getRepository(FeedPost).findOne(_feedPost.id);
        if (!post) {
            console.error("empty post");
            return;
        }

        let currentSubscriptions = await getRepository(Subscription).find().catch(err => console.error(err)) || null;

        let pendingNotifications = await Promise.all(currentSubscriptions.map(async value => {
            let notification = new Notification();
            notification.user = Promise.resolve(await value.user);
            notification.subscription = value;
            notification.status = "pending";
            notification.title = "K4All News";
            notification.body = post.title;
            notification.icon = "md-information-circle-outline";
            notification.path = "App/FeedTab/" + post.id

            return notification;
        })) || null;

        let notifications = await getRepository(Notification).save(pendingNotifications).catch(err => console.error(err));
        console.log(notifications);
        return;
    }

    @subscribe(SeasonPlan)
    public async seasonPlanListener(_seasonPlan: SeasonPlan, action) {

        let seasonPlan = await getRepository(SeasonPlan).findOne(_seasonPlan.id);
        let thema = await seasonPlan.thema;
        let currentSubscriptions = await getRepository(Subscription).find().catch(err => console.error(err)) || null;

        let pendingNotifications = await Promise.all(currentSubscriptions.map(async value => {
            return PushNotificationService._buildNotification({
                recipient: await value.user,
                title: `Neues Thema!`,
                body: thema.title || thema.name,
                path: "App/BadgeTab"
            });
        })) || null;

        return;

    }

    @subscribe(User)
    public async notifyTeamLevelUp(_user, action) {
        try {
            let user = await getRepository(User).findOne(_user.id);
            if (!user || action !== "levelup") return;
            let playerLevel = getCurrentLevel(user.score);
            let memberships = await user.memberships;
            let team = memberships.length > 0 ? await memberships[0].team : null;
            if (team === null) return;

            let members = (await team.members).filter(value => value.id !== memberships[0].id);

            members.map(async value => {
                let recipient = await value.user;
                await PushNotificationService._buildNotification({
                    recipient,
                    title: `Dein Team levelt auf!`,
                    body: `Dein Teammitglied ${user.screenName} hat gerade die Entwicklungsstufe ${playerLevel.name} in rot erreicht.`,
                    icon: 'md-star',
                    path: 'App/CompetitiveTab'
                })
            });
        } catch (e) {
            console.error(e)
        }
    }

    public async remindAchievements(): Promise<Notification[]> {
        let uncompletedAchievementSelections = await this.achievementSelectionRepository.find();
        let ac = await Promise.all(uncompletedAchievementSelections.map(async as => {
            return {as, ac: await as.achievementCompletions, u: await as.owner}
        }));
        //TODO zusammenfassen

        let groupByUserId = (xs) => {
            return xs.reduce((a, value) => {
                let arr = (a[value.u.id] || []);
                arr.push(value);
                return {
                    [value.u.id]: arr,
                    ...a
                }
            }, {})
        };

        let notifyOneUncompletedSelection = async achievementSelection => {
            const achievement = await achievementSelection.achievement;
            return PushNotificationService._buildNotification({
                recipient: await achievementSelection.owner,
                title: `Eine Aktivität wartet auf Dich!`,
                body: `Deine Aktivität "${achievement.title || achievement.name}" wartet auf Dich!`,
                path: "/App/BadgeTab/Achievements"
            })
        };

        let notifyManyUncompletedSelection = async (achievementSelections) => {
            if (!achievementSelections) return null;
            let recipient = await achievementSelections[0].owner
            return PushNotificationService._buildNotification({
                recipient: recipient,
                title: `Es warten noch Aktivitäten auf Dich!`,
                body: `Es warten noch ${achievementSelections.length} Aktivitäten auf Dich!`,
                path: "/App/BadgeTab/Achievements"
            })
        };

        let grouped = groupByUserId(ac);

        return Promise.all(Object.keys(grouped)
            .filter((userId) =>
                grouped[userId] !== []
            ).map(userId => {
                let acs = grouped[userId]
                if (acs.length === 0) return null;
                let uncompletedAchievements = acs.filter(ac => ac.ac.length === 0 && moment(ac.as.timeOutDate).add(7, 'day') >= moment());
                if (uncompletedAchievements.length === 0) return null;
                if (uncompletedAchievements.length === 1) {
                    return notifyOneUncompletedSelection(uncompletedAchievements[0].as);
                } else {
                    return notifyManyUncompletedSelection(uncompletedAchievements.map(value => value.as))
                }

            }).filter(value => value !== null));

    }

    private static async _buildNotification({recipient, title, body, icon = "md-information-circle-outline", path = "App/NotificationsTab"}): Promise<Notification> {
        let subscription = await recipient.subscription;
        if (subscription) {
            let notification = new Notification();
            notification.user = Promise.resolve(recipient);
            notification.subscription = subscription;
            notification.status = "pending";
            notification.title = title;
            notification.body = body;
            notification.icon = icon;
            notification.path = path;
            return getRepository(Notification).save(notification);
        }

        return null;
    }
}