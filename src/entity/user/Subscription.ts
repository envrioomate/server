import {Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn} from "typeorm";
import {User} from "./User";
import {Field, Int, ObjectType} from "type-graphql";
import {Notification} from "./Notification";

@Entity()
@ObjectType()
export class Subscription {
    @Field(type => Int, {nullable: true})
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => User, {nullable: true})
    @OneToOne(type => User, u => u.subscription)
    @JoinColumn()
    user: Promise<User>;

    @Field(type => String, {nullable: true})
    @Column()
    pushToken: string;

    @Field(type => [Notification], {nullable: true})
    @OneToMany(type => Notification, n => n.subscription, {cascade: true, nullable: true})
    notifications: Promise<Notification[]>;
}