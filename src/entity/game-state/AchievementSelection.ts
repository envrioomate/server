import {
    BeforeInsert,
    Column,
    CreateDateColumn,
    Entity,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Field, Int, ObjectType} from "type-graphql";
import {User} from "../user/User";
import {Achievement} from "../wiki-content/Achievement";
import {AchievementCompletion} from "./AchievementCompletion";

import * as moment from 'moment';
import 'moment/locale/de';
moment.locale('de');


@Entity()
@ObjectType()
export class AchievementSelection {
    @Field(type => Int, {nullable: true})
    @PrimaryGeneratedColumn()
    id?: number;

    @Field(type => Date)
    @CreateDateColumn()
    createdAt: Date;

    @Field(type => Date)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(type => User)
    @ManyToOne(type => User, u => u.achievementSelections)
    owner: Promise<User>;

    @Field(type => Achievement)
    @ManyToOne(type => Achievement, a => a.achievementSelections)
    achievement: Promise<Achievement>;

    @Field(type => [AchievementCompletion], {nullable: true})
    @OneToMany(type => AchievementCompletion, as => as.achievementSelection, {nullable: true})
    achievementCompletions?: Promise<AchievementCompletion[]>;

    @Field(type => Date, {nullable: true})
    @Column({nullable: true})
    timeOutDate: Date;

    @BeforeInsert()
    public async calcTimeOutDate() {
        let _achievement = await this.achievement;
        let timeOutDate = moment(this.createdAt);
        timeOutDate.add(_achievement.weeks, 'week');
        this.timeOutDate = timeOutDate.toDate();
        return this.timeOutDate;
    }
    

}