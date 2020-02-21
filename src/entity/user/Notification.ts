import {Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn} from "typeorm";
import {Field, Int, ObjectType, registerEnumType} from "type-graphql";
import {User} from "./User";
import {TeamResolverErrors} from "../../resolver/TeamResolver";
import {Subscription} from "./Subscription";

@Entity()
@ObjectType()
export class Notification {
    @PrimaryGeneratedColumn()
    @Field(type => Int)
    id: number;

    @ManyToOne(type => User, user => user.notifications)
    @Field(type => User)
    user: Promise<User>;

    @ManyToOne(type => Subscription, {eager: true})
    @Field(type => Subscription)
    subscription: Subscription;

    @Column()
    @Field(type => String)
    title: string;

    @Column()
    @Field(type => String)
    body: string;

    @Column()
    @Field(type => String)
    icon: string;

    @Column()
    @Field(type => String)
    status: 'delivered'|'sent'|'pending'|'failed';

    @Column()
    @Field(type => Int)
    ticketId: string;
}