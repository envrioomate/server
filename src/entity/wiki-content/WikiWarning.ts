import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Props} from "./Props";
import {Field, Int, ObjectType} from "type-graphql";

export enum WikiWarnings {
    NoTopic = "NoTopic",
    NoChallenges = "NoChallenges",
    NoSpareChallenges = "NoSpareChallenges",
    NotEnoughDefaultChallenges = "NotEnoughDefaultChallenges",
    TooManyDefaultChallenges = "TooManyDefaultChallenges",
    EmptyText = "EmptyText",
    NoHeaderImage = "NoHeaderImage",
    TemplateParsingError = "TemplateParsingError"
}

@Entity()
@ObjectType()
export class WikiWarning {

    @Field(type => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => Date)
    @CreateDateColumn()
    createdAt: Date;

    @Field(type => Date)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(type => Props)
    @OneToOne(type => Props, prop => prop.warnings)
    @JoinColumn()
    props: Props;

    @Field(type => String)
    @Column()
    warnings: string; // Simplicity > NF and TypeORMs non existent set support TODO make less broken

    @Field(type => String, {nullable: true})
    @Column("longtext", {nullable: true})
    error: string;

    static fromWarnings(warnings: {wikiwarning: WikiWarning, error: string}[]): WikiWarning {
        let wikiWarning = new WikiWarning();
        wikiWarning.warnings = warnings.map((w) => w.wikiwarning.toString()).join('|');
        wikiWarning.error = warnings.map(w => w.error.toString()).join('|');
        return wikiWarning;
    }

    private compact(arr) {
        return arr.map((w) => w.toString()).join('|');
    }

    public push(warning: WikiWarnings) {
        this.warnings = this.compact(this.toArray().push(warning))
    }

    public toArray() {
        return this.warnings.split('|');
    }

}