import {
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryColumn,
    UpdateDateColumn
} from "typeorm";
import {Quelle} from "./Quelle";
import {Oberthema} from "./Oberthema";
import {Badge} from "./Badge";
import {Props} from "./Props";
import {WikiImage} from "./WikiImage";
import {Kategorie} from "./Kategorie";
import {SeasonPlan} from "../game-state/SeasonPlan";
import {Field, ObjectType} from "type-graphql";

@Entity()
@ObjectType()
export class Thema{

    @Field(type => String)
    @PrimaryColumn({type: "varchar", length: 191})
    name: string;

    @Field(type => String)
    @Column()
    title: string;

    @Field(type => String)
    @Column({type: "text"})
    text: string;

    @Field(type => WikiImage, {nullable: true})
    @ManyToOne(type => WikiImage, {eager: true})
    headerImage: Promise<WikiImage>;

    @Field(type => Date)
    @CreateDateColumn()
    createdAt: Date;

    @Field(type => Date)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(type => [Badge], {nullable: true})
    @OneToMany(type => Badge, c => c.thema,{cascade: true})
    @JoinTable()
    badges: Promise<Badge[]>;

    @Field(type => Props)
    @ManyToOne(type => Props)
    props: Promise<Props>;

    @Field(type => [SeasonPlan], {nullable: true})
    @OneToMany(type => SeasonPlan, s => s.themenwoche)
    usages: Promise<SeasonPlan[]>;

    public static fromTemplate(templateValues: any): Thema {
        let thema = new Thema();
        thema.name = templateValues.name;
        thema.title = templateValues.title;
        thema.text = templateValues.text;
        return thema;
    }
}