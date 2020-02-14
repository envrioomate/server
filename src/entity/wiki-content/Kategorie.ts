import {
    Column,
    CreateDateColumn,
    Entity,
    JoinTable, ManyToMany, ManyToOne,
    OneToMany, PrimaryColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Oberthema} from "./Oberthema";
import {Props} from "./Props";
import {Badge} from "./Badge";
import {Thema} from "./Thema";
import {Field, ObjectType} from "type-graphql";

@Entity()
@ObjectType()
export class Kategorie {

    @Field(type => String)
    @PrimaryColumn({type: "varchar", length: 191})
    name: string;

    @Field(type => [Oberthema])
    @OneToMany(type => Oberthema, o => o.kategorie, {eager: true})
    oberthemen: Promise<Oberthema[]>;


    @Field(type => Date)
    @CreateDateColumn()
    createdAt: Date;

    @Field(type => Date)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(type => [Badge])
    @ManyToMany(type => Badge, {eager: true})
    @JoinTable()
    challenges: Promise<Badge[]>;

    @Field(type => Props)
    @ManyToOne(type => Props)
    props: Promise<Props>;


}