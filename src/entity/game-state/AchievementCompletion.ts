import {CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {Field, Int, ObjectType} from "type-graphql";
import {User} from "../user/User";
import {Achievement} from "../wiki-content/Achievement";
import {AchievementSelection} from "./AchievementSelection";


@Entity()
@ObjectType()
export class AchievementCompletion {
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
    @ManyToOne(type => User, u => u.achievementCompletions)
    owner: Promise<User>;

    @Field(type => Achievement)
    @ManyToOne(type => Achievement, a => a.achievementCompletions)
    achievement: Promise<Achievement>;

    @Field(type => AchievementSelection)
    @ManyToOne(type => AchievementSelection, as => as.achievementCompletions)
    achievementSelection: Promise<AchievementSelection>;
}