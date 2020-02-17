import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {Field, Int, ObjectType, registerEnumType} from "type-graphql";
import {User} from "../user/User";
import {Achievement} from "../wiki-content/Achievement";
import {AchievementSelection} from "./AchievementSelection";

export enum AchievementCompletionType {
    COMPLETED = 0, TIMED_OUT = 1, RECURRING = 2, RECURRING_TIMED_OUT = 3
}

registerEnumType(AchievementCompletionType, {
    name: "AchievementCompletionType",
    description: "Stores the achieved ChallengeGoal. If null assume MIN"
});


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

    @Field(type => AchievementCompletionType)
    @Column()
    achievementCompletionType: AchievementCompletionType;

}