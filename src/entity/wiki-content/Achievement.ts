import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne, PrimaryColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Field, Int, ObjectType} from "type-graphql";
import {Props} from "./Props";
import {Badge} from "./Badge";

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

    badgeName?: string;

    static fromTemplate(templateValues: any) {
        let achievement = new Achievement();
        achievement.name = templateValues.name;
        achievement.title = templateValues.title;
        achievement.text = templateValues.text;
        achievement.score = templateValues.score;
        achievement.badgeName = templateValues.badge;
        return achievement;
    }
}