import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryColumn, UpdateDateColumn} from "typeorm";
import {Props} from "./Props";
import {Field, ObjectType} from "type-graphql";

@Entity()
@ObjectType()
export class WikiImage {

    @Field(type => String)
    @Column()
    mimetype: string;

    @Field(type => String)
    @Column()
    url: string;

    @Field(type => String)
    @Column()
    uploader: string;

    @Field(type => Date)
    @Column()
    timestamp: Date;

    @Field(type => Date)
    @CreateDateColumn()
    createdAt: Date;

    @Field(type => Date)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(type => String, {nullable: true})
    @Column({nullable: true})
    details?: string;

    @Field(type => String)
    @PrimaryColumn({type: "varchar", length: 191})
    canonicalName: string;

    @Field(type => Props)
    @ManyToOne(type => Props)
    props: Promise<Props>;

    static fromRequest(query): WikiImage {
        const queryResult = query.data.query;
        console.log(queryResult.pages[queryResult.pageids[0]]);
        const {title: canonicalName, imageinfo: [imageinfo], revisions: [revisions]} = queryResult.pages[queryResult.pageids[0]];
        let wikiImage = new WikiImage();
        wikiImage.canonicalName = canonicalName;
        wikiImage.uploader = imageinfo.user;
        wikiImage.timestamp = imageinfo.timestamp;
        wikiImage.url = imageinfo.url;
        wikiImage.mimetype = imageinfo.mime;
        wikiImage.details = revisions['*'];
        return wikiImage;
    }
}