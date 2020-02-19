import {
    BeforeInsert,
    Column,
    CreateDateColumn,
    Entity, getRepository,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn
} from "typeorm";
import {Field, Int, ObjectType} from "type-graphql";
import * as bcrypt from 'bcrypt-nodejs';
import {Membership} from "../social/Membership";
import {PasswordResetToken} from "./PasswordResetToken";
import {FeedPost} from "../social/FeedPost";
import {FeedComment} from "../social/FeedComment";
import {Media} from "../Media";
import {ChallengeCompletion} from "../game-state/ChallengeCompletion";
import {ChallengeRejection} from "../game-state/ChallengeRejection";
import {ChallengeReplacement} from "../game-state/ChallengeReplacement";
import {Notification} from "./Notification";
import {Subscription} from "./Subscription";
import {AchievementSelection} from "../game-state/AchievementSelection";
import {AchievementCompletion} from "../game-state/AchievementCompletion";
import {Badge} from "../wiki-content/Badge";

export enum Role {
    User = 0,
    Admin = 1
}

@Entity()
@ObjectType()
export class User { //TODO split into profile data and user data

    @Field(type => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => String)
    @Column()
    userName: string;


    @Field(type => String)
    @Column()
    screenName: string;

    @Field(type => Date)
    @CreateDateColumn()
    dateCreated: Date;

    @Field(type => Boolean)
    @Column()
    emailConfirmed: boolean = false;

    @Field(type => Boolean)
    @Column()
    isBanned: boolean = false;


    @Column()
    hash: string;

    password: string;

    @Field(type => Int)
    @Column()
    role: Role = 0;

    @OneToMany(type => Membership, m => m.user, {eager: true})
    memberships: Promise<Membership[]>;

    @OneToOne(type => PasswordResetToken, p => p.user, {nullable: true})
    @Field(type => PasswordResetToken, {nullable: true})
    passwordResetToken: PasswordResetToken;


    @OneToOne(type => Subscription, s => s.user, {nullable: true})
    @Field(type => Subscription, {nullable: true})
    subscription?: Promise<Subscription>;

    @Field(type => Media, {nullable: true})
    @ManyToOne(type => Media, {nullable: true})
    avatar?: Promise<Media>;

    @Field(type => [Media], {nullable: true})
    @OneToMany(type => Media, media => media.uploader, {nullable: true})
    media?: Promise<Media[]>;

    @Field(type => [Notification], {nullable: true})
    @OneToMany(type => Notification, notification => notification.user, {nullable: true})
    notifications?: Promise<Notification[]>;

    @Field(type => [FeedPost], {nullable: true})
    @OneToMany(type => FeedPost, post => post.author, {nullable: true})
    posts?: Promise<FeedPost[]>;

    @Field(type => [FeedComment], {nullable: true})
    @OneToMany(type => FeedPost, post => post.author, {nullable: true})
    comments?: Promise<FeedComment[]>;

    @Field(type => [ChallengeCompletion], {nullable: true})
    @OneToMany(type => ChallengeCompletion, cc => cc.owner, {nullable: true})
    challengeCompletions?: Promise<ChallengeCompletion[]>;

    @Field(type => [ChallengeRejection], {nullable: true})
    @OneToMany(type => ChallengeRejection, cr => cr.owner, {nullable: true})
    challengeRejections?: Promise<ChallengeRejection[]>;

    @Field(type => [ChallengeReplacement], {nullable: true})
    @OneToMany(type => ChallengeReplacement, cr => cr.owner, {nullable: true})
    challengeReplacements?: Promise<ChallengeReplacement[]>;

    @Field(type => [AchievementSelection], {nullable: true})
    @OneToMany(type => AchievementSelection, as => as.owner, {nullable: true})
    achievementSelections?: Promise<AchievementSelection[]>;

    @Field(type => [AchievementCompletion], {nullable: true})
    @OneToMany(type => AchievementCompletion, as => as.owner, {nullable: true})
    achievementCompletions?: Promise<AchievementCompletion[]>;

    @Field(type => Int)
    @Column({default: 0})
    score: number;

    @BeforeInsert()
    public encrypt() {
        if (this.password)
            this.hash = bcrypt.hashSync(this.password, bcrypt.genSaltSync()); //TODO make more async
    }

    public validatePassword(candidate: string): boolean {
        return bcrypt.compareSync(candidate, this.hash)
    }

    public transfer(fullProfile: boolean = false) {
        let o;
        if (fullProfile) {
            o = {
                id: this.id,
                userName: this.userName,
                screenName: this.screenName,
                dateCreated: this.dateCreated,
                emailConfirmed: this.emailConfirmed,
                isBanned: this.isBanned,
                hasGroup: !!this.memberships
            }
        } else {
            o = {
                id: this.id,
                screenName: this.screenName
            }
        }

        return o;
    }

    public async recalculateScore() {
        let achievementCompletions = (await this.achievementCompletions.catch((err) => {
            console.error(err);
            return null
        }));
        let achievementScores = await Promise.all(
            achievementCompletions.map(async (ac) => {
                return (await ac.achievement).score
            })).catch((err) => {
            console.error(err);
            return null
        });

        let badgeCompletions = await this.challengeCompletions.catch((err) => {
            console.error(err);
            return null
        });
        let badgeScores = await Promise.all(
            badgeCompletions.map(async (bc) => {
                let badge: Badge = await (await bc.seasonPlanChallenge).challenge || null; // TODO consider completion level for scoring?
                return badge.score;
            })).catch((err) => {
            console.error(err);
            return null
        });
        const sum = (accumulator: number = 0, value: number) => accumulator + value;
        const achievementScore = achievementScores.reduce(sum, 0);
        const badgeScore = badgeScores.reduce(sum, 0);
        this.score = achievementScore + badgeScore;
        getRepository(User).save(this).catch(err => console.error(err));
    }
}
