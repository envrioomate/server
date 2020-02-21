import Expo, {ExpoPushMessage, ExpoPushTicket} from 'expo-server-sdk';
import {Subscription} from "../entity/user/Subscription";
import {InjectRepository} from "typeorm-typedi-extensions";
import {getRepository, Repository} from "typeorm";
import {Notification} from "../entity/user/Notification";
import {User} from "../entity/user/User";
import * as schedule from 'node-schedule';
import {subscribe} from "../util/EventUtil";
import {Membership} from "../entity/social/Membership";
import {FeedComment} from "../entity/social/FeedComment";
import {Container, Service} from "typedi";
import {FeedPost} from "../entity/social/FeedPost";
import {SeasonPlan} from "../entity/game-state/SeasonPlan";

@Service()
export class PushNotificationService {
    private expo = new Expo();

    pushCurrentMessagesJob;

    constructor(
        @InjectRepository(Notification) private readonly notificationRepository: Repository<Notification>,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
    ) {
        //collect unsent messages for 5 min and then push all of them
        this.pushCurrentMessagesJob = schedule.scheduleJob('*/5 * * * *', this._pushPendingNotifications);
    }

    private static _pushMessages = async (messages: {notification: Notification, message: ExpoPushMessage}[])
        : Promise<{notification: Notification, message: ExpoPushMessage}[]> => {
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
        let tickets: ExpoPushTicket[] = ticketChunks.reduce((tickets, chunks) => tickets.concat(...chunks));
        return messages.map((message, index) => {
            message.notification.ticketId = tickets[index].id;
            return message
        }) // Array.zip() would be nice
    };

    private _pushPendingNotifications = async () => {
        //find all notifications that are not yet being sent
        let currentPendingNotifications = await this.notificationRepository.find({where: {status: 'pending'}});
        //lock them to this worker process
        currentPendingNotifications.forEach(async (notification) => {
            notification.status = "sent";
        });
        currentPendingNotifications = await this.notificationRepository.save(currentPendingNotifications);
        //generate ExpoPushMessages from Notification entities
        let messages = await Promise.all(currentPendingNotifications.map(async (notification) => {
            let recipient = await notification.user;
            let subscription = await recipient.subscription;
            let message: ExpoPushMessage = null;
            if(subscription) {
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
                path: 'App/ProfileTab'
            },
        };
        await this.expo.sendPushNotificationsAsync([message])
    }

    @subscribe(Membership)
    public async membershipListener(membership: Membership, action: string) {
        switch (action) {
            case 'confirm':
                return this.notifyJoinedTeam(membership);
            case 'request':
                return this.notifyRequestJoinTeam(membership);
            case 'admin':
                return this.notifyAdminStatusChanged(membership);
            default:
                console.error(`Action ${action} not matched by PushNotificationService.membershipListener!`);
                return;
        }
    }

    public async notifyJoinedTeam(memberShip: Membership) {

    }

    public async notifyRequestJoinTeam(memberShip: Membership) {

    }

    public async notifyAdminStatusChanged(memberShip: Membership) {

    }

    @subscribe(FeedComment)
    public async commentListener(_feedComment: FeedComment, action: string) {

        let feedComment = await getRepository(FeedComment).findOneOrFail(_feedComment.id);
        let feedCommentAuthor = (await feedComment.author).screenName;
        let parent = await feedComment.parent || null;
        let post = await feedComment.post || null;


        if(parent) {
            let parentAuthor = await parent.author;
            let subscription = await parentAuthor.subscription;
            if (subscription) {
                let notification = new Notification();
                notification.user = Promise.resolve(parentAuthor);
                notification.subscription = subscription;
                notification.status = "pending";
                notification.title = `Neuer Kommentar` ;
                notification.body = `${feedCommentAuthor} hat auf deinen Kommentar geantwortet`;
                notification.icon = "md-chatbubbles";
                notification.path = "App/FeedTab/" + post.id

                getRepository(Notification).save(notification).catch(err => console.error(err));
            }
        }

        if(post) {
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

        if(action !== "pinned") return;

        let post = await getRepository(FeedPost).findOne(_feedPost.id);
        if(!post) {
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
            let notification = new Notification();
            notification.user = Promise.resolve(await value.user);
            notification.subscription = value;
            notification.status = "pending";
            notification.title = "Neues Thema";
            notification.body = thema.title || thema.name;
            notification.icon = "md-information-circle-outline";
            notification.path = "App/BadgeTab"
            return notification;
        })) || null;

        let notifications = await getRepository(Notification).save(pendingNotifications).catch(err => console.error(err));
        console.log(notifications);
        return;

    }

}