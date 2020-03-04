import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BeforeInsert,
    ManyToOne,
    OneToOne,
    JoinColumn,
    CreateDateColumn, ManyToMany, JoinTable, getRepository
} from "typeorm";
import * as bcrypt from 'bcrypt-nodejs';
import {Team} from "./Team";
import {User} from "../user/User";
import {dateFormat} from "dateformat";
import {Badge} from "../wiki-content/Badge";
import {Field, Int, ObjectType} from "type-graphql";

@ObjectType()
@Entity()
export class Membership {

    @Field(type => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => User)
    @ManyToOne(type => User, user => user.memberships)
    user: Promise<User>;

    @Field(type => Team)
    @ManyToOne(type => Team, t => t.members)
    team: Promise<Team>;

    @Field(type => Date)
    @CreateDateColumn()
    dateCreated: Date;

    @Field(type => Boolean)
    @Column()
    isActive: Boolean = false;

    @Field(type => Date, {nullable: true})
    @Column({nullable: true})
    activationDate?: Date;

    @Field(type => Boolean)
    @Column()
    isAdmin: Boolean = false;

    @Field(type => Boolean)
    @Column({default: true})
    isAccepted: Boolean = true;
}
