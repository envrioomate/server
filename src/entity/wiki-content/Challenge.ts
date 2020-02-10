import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {Themenwoche} from "./Themenwoche";
import {Props} from "./Props";
import {Kategorie} from "./Kategorie";
import {Oberthema} from "./Oberthema";
import {Field, Int, ObjectType, registerEnumType} from "type-graphql";
import {WikiImage} from "./WikiImage";

export enum ChallengeGoalType {
    QUALITATIVE = 0,
    QUANTITY_ASC = 1,
    QUANTITY_DSC = 2
}

registerEnumType(ChallengeGoalType, {
    name: "ChallengeGoalType",
    description: "Defines how ChallengeGoals are ordered by their quantity."
});

@ObjectType()
export class ChallengeGoals {

    @Field(type => ChallengeGoalType)
    @Column()
    challengeGoalType: ChallengeGoalType;

    @Field(type => String)
    @Column()
    minCompletion: String;

    @Field(type => Number)
    @Column()
    minQuantity: number;

    @Field(type => String)
    @Column()
    medCompletion: String;

    @Field(type => Number)
    @Column()
    medQuantity: number;

    @Field(type => String)
    @Column()
    goodCompletion: String;

    @Field(type => Number)
    @Column()
    goodQuantity: number;
    @Field(type => String)
    @Column()
    maxCompletion: String;

    @Field(type => Number)
    @Column()
    maxQuantity: number;
}

@Entity()
@ObjectType()
export class Challenge {

    @Field(type => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => String)
    @Column()
    title: string;

    @Field(type => String)
    @Column({type: "text"})
    content: string;

    @Field(type => String, {nullable: true})
    @Column({ type: "text", nullable: true })
    tip?: string;

    @Field(type => Int, {nullable: true})
    @Column({nullable: true})
    score?: number;

    @Field(type => Boolean)
    @Column()
    isSpare: boolean;

    @Field(type => Date)
    @CreateDateColumn()
    createdAt: Date;

    @Field(type => Date)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(type => Themenwoche)
    @ManyToOne(type => Themenwoche, t => t.challenges, {nullable: true})
    themenWoche: Promise<Themenwoche>;

    @Field(type => Kategorie)
    @ManyToOne(type => Kategorie, k => k.challenges)
    kategorie: Promise<Kategorie>;

    @Field(type => Oberthema)
    @ManyToOne(type => Oberthema, o => o.challenges)
    oberthema: Promise<Oberthema>;

    @Field(type => Props)
    @ManyToOne(type => Props)
    props: Promise<Props>;

    @Field(type => WikiImage, {nullable: true})
    @ManyToOne(type => WikiImage)
    headerImage: Promise<WikiImage>;

    @Field(type => ChallengeGoals, {nullable: true})
    @Column(type => ChallengeGoals)
    challengeGoals: Promise<ChallengeGoals>;

    headerImageUrl?: string;

    static fromTemplate(challengeTemplate): Challenge {
        let challenge = new Challenge();
        challenge.title = challengeTemplate.Name;
        challenge.content = challengeTemplate.Text;
        challenge.score = challengeTemplate.Ersparnis || 2;
        challenge.isSpare = !!challengeTemplate.Ersatzchallenge || false;
        challenge.headerImageUrl = challengeTemplate.HeaderImage || null;
        return challenge;
    }
}
