import {
    Column,
    CreateDateColumn,
    Entity, JoinTable, ManyToMany,
    ManyToOne,
    OneToMany, PrimaryColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Kategorie} from "./Kategorie";
import {Thema} from "./Thema";
import {Props} from "./Props";
import {Badge} from "./Badge";
import {Field, ObjectType} from "type-graphql";

@Entity()
@ObjectType()
export class Oberthema {

    @Field(type => String)
    @PrimaryColumn({type: "varchar", length: 191})
    name: string;

    @Field(type => Date)
    @CreateDateColumn()
    createdAt: Date;

    @Field(type => Date)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(type => Kategorie)
    @ManyToOne(type => Kategorie, k => k.oberthemen)
    kategorie: Promise<Kategorie>;

    @Field(type => Props)
    @ManyToOne(type => Props)
    props: Promise<Props>;

    static fromWeekTemplate(templateValues: any) {
        let oberthema = new Oberthema();
        oberthema.name = templateValues.Oberthema;
        return oberthema;
    }
}