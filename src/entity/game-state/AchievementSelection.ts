import {
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
    achievementCompletions?: Promise<AchievementCompletion[]> ;

}