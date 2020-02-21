import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne, OneToMany, PrimaryColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Field, Int, ObjectType} from "type-graphql";
import {Props} from "./Props";
import {Badge} from "./Badge";
import {AchievementSelection} from "../game-state/AchievementSelection";
import {AchievementCompletion} from "../game-state/AchievementCompletion";

@Entity()
@ObjectType()
export class Achievement{

    @Field(type => String)
    @PrimaryColumn({type: "varchar", length: 191})
    name: string;

    @Field(type => String)
    @Column()
    title: string;

    @Field(type => String)
    @Column({type: "text"})
    text: string;

    @Field(type => Int, {nullable: true})
    @Column({nullable: true})
    score?: number;

    @Field(type => String, {nullable: true})
    @Column({nullable: true})
    maxCompletion: string;

    @Field(type => Badge)
    @ManyToOne(type => Badge)
    badge: Promise<Badge>;

    @CreateDateColumn()
    @Field(type => Date)
    createdAt: Date;

    @Field(type => Date)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(type => Props)
    @ManyToOne(type => Props)
    props: Promise<Props>;

    @Field(type => Boolean)
    @Column({default: false})
    recurring: boolean;

    @Field(type => Int)
    @Column({default: 12})
    weeks: number;

    @Field(type => Int)
    @Column({default: 1})
    weekFrequency: number;

    @Field(type => String, {nullable: true})
    @Column({nullable: true})
    externalLink?: String;

    @Field(type => [AchievementSelection], {nullable: true})
    @OneToMany(type => AchievementSelection, as => as.achievement, {nullable: true})
    achievementSelections?: Promise<AchievementSelection[]> ;

    @Field(type => [AchievementCompletion], {nullable: true})
    @OneToMany(type => AchievementCompletion, as => as.achievement, {nullable: true})
    achievementCompletions?: Promise<AchievementCompletion[]> ;

    badgeName?: string;

    static fromTemplate(templateValues: any) {
        let achievement = new Achievement();
        achievement.name = templateValues.name;
        achievement.title = templateValues.title;
        achievement.text = templateValues.text;
        achievement.score = templateValues.score;
        achievement.badgeName = templateValues.badge;
        achievement.recurring = templateValues.recurring || false;
        achievement.weeks = templateValues.weeks || 12;
        achievement.weekFrequency = templateValues.weekFrequency || 1;
        achievement.externalLink = templateValues.extenalLink;
        achievement.maxCompletion = templateValues.maxCompletion || "max";
        return achievement;
    }
}