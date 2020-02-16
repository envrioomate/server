import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BeforeInsert,
    ManyToOne,
    OneToOne,
    CreateDateColumn,
    JoinColumn, OneToMany
} from "typeorm";
import {ObjectType, Field, Int} from "type-graphql";
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
    @Field(type => Subscription,{nullable: true})
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
    achievementSelections?: Promise<AchievementSelection[]> ;


    @Field(type => [AchievementCompletion], {nullable: true})
    @OneToMany(type => AchievementCompletion, as => as.owner, {nullable: true})
    achievementCompletions?: Promise<AchievementCompletion[]> ;

    @BeforeInsert()
    public encrypt () {
        if(this.password)
            this.hash = bcrypt.hashSync(this.password, bcrypt.genSaltSync()); //TODO make more async
    }

    public validatePassword(candidate: string): boolean {
        return bcrypt.compareSync(candidate, this.hash)
    }

    public transfer(fullProfile : boolean = false) {
        let o;
        if (fullProfile) {
            o =   {
                id : this.id,
                userName : this.userName,
                screenName: this.screenName,
                dateCreated: this.dateCreated,
                emailConfirmed : this.emailConfirmed,
                isBanned : this.isBanned,
                hasGroup: !!this.memberships
            }
        } else {
            o =   {
                id : this.id,
                screenName: this.screenName
            }
        }

        return o;
    }
}
