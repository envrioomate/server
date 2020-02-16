import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne, OneToMany,
    PrimaryColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Thema} from "./Thema";
import {Props} from "./Props";
import {Kategorie} from "./Kategorie";
import {Oberthema} from "./Oberthema";
import {Field, Int, ObjectType, registerEnumType} from "type-graphql";
import {WikiImage} from "./WikiImage";
import {Achievement} from "./Achievement";

export enum BadgeGoalType {
    QUALITATIVE = 0,
    QUANTITY_ASC = 1,
    QUANTITY_DSC = 2
}



registerEnumType(BadgeGoalType, {
    name: "BadgeGoalType",
    description: "Defines how BadgeGoals are ordered by their quantity."
});

@ObjectType()
export class BadgeGoals {

    @Field(type => BadgeGoalType)
    @Column()
    badgeGoalType: BadgeGoalType;

    @Field(type => String)
    @Column()
    minCompletion: String;

    @Field(type => Int, {nullable: true})
    @Column({nullable: true})
    minQuantity?: number;

    @Field(type => String)
    @Column()
    medCompletion: String;

    @Field(type => Int, {nullable: true})
    @Column({nullable: true})
    medQuantity?: number;

    @Field(type => String)
    @Column()
    goodCompletion: String;

    @Field(type => Int, {nullable: true})
    @Column({nullable: true})
    goodQuantity?: number;

    @Field(type => String)
    @Column()
    maxCompletion: String;

    @Field(type => Int, {nullable: true})
    @Column({nullable: true})
    maxQuantity?: number;

    strToBadgeGoalType(goalType: string) {
        switch (goalType) {
            case("QUALITATIVE"): return BadgeGoalType.QUALITATIVE;
            case("QUANTITATIVE_ASC"): return BadgeGoalType.QUANTITY_ASC;
            case("QUANTITATIVE_DSC"): return BadgeGoalType.QUANTITY_DSC;
        }
    }
}

@Entity()
@ObjectType()
export class Badge {



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

    @Field(type => Date)
    @CreateDateColumn()
    createdAt: Date;

    @Field(type => Date)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(type => Thema)
    @ManyToOne(type => Thema, t => t.badges, {nullable: true})
    thema: Promise<Thema>;

    @Field(type => Props)
    @ManyToOne(type => Props)
    props: Promise<Props>;

    @Field(type => WikiImage, {nullable: true})
    @ManyToOne(type => WikiImage)
    headerImage: WikiImage;

    @Field(type => WikiImage, {nullable: true})
    @ManyToOne(type => WikiImage)
    icon: WikiImage;

    @Field(type => BadgeGoals, {nullable: true})
    @Column(type => BadgeGoals)
    badgeGoals: BadgeGoals;

    @Field(type => [Achievement], {nullable: true})
    @OneToMany(type => Achievement, a => a.badge, {cascade: true})
    achievements: Promise<Achievement[]>;

    static fromTemplate(challengeTemplate): Badge {
        let badge = new Badge();
        badge.name = challengeTemplate.name;
        badge.title = challengeTemplate.title;
        badge.text = challengeTemplate.text;
        badge.score = challengeTemplate.score || 2;

        let badgeGoals = new BadgeGoals();
        badgeGoals.badgeGoalType = badgeGoals.strToBadgeGoalType(challengeTemplate.badgeGoalType);
        badgeGoals.minCompletion = challengeTemplate.minCompletion;
        badgeGoals.minQuantity = challengeTemplate.minQuantity;
        badgeGoals.medCompletion = challengeTemplate.medCompletion;
        badgeGoals.medQuantity = challengeTemplate.medQuantity;
        badgeGoals.goodCompletion = challengeTemplate.goodCompletion;
        badgeGoals.goodQuantity = challengeTemplate.goodQuantity;
        badgeGoals.maxCompletion = challengeTemplate.maxCompletion;
        badgeGoals.maxQuantity = challengeTemplate.maxQuantity;
        badge.badgeGoals = badgeGoals;

        return badge;
    }
}
