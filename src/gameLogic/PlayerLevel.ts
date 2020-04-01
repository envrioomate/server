import {Field, Int, ObjectType} from "type-graphql";


@ObjectType()
export class RemoteIcon {
    @Field(type => String)
    type: string = "remote";
    @Field(type => String)
    path: string;
}

@ObjectType()
export class PlayerLevel {
    @Field(type => Int)
    index: number;
    
    @Field(type => String)
    name: string;
    
    @Field(type => RemoteIcon)
    icon: RemoteIcon;

    @Field(type => Int)
    maxScore: number;


}

export const getCurrentLevel = (score) => {
    for (let l of LevelUpTable) {
        if (score < l.maxScore) {
            return l;
        }
    }
    return LevelUpTable[LevelUpTable.length - 1]
};


export const LevelUpTable: PlayerLevel[] =
    [
        {
            index: 0,
            name: "Ameise",
            icon: {
                type: "remote",
                path: "./img/playerLevels/ant.png"
            },
            maxScore: 700
        },
        {
            index: 1,
            name: "Biene",
            icon: {
                type: "remote",
                path: "./img/playerLevels/bee.png"
            },
            maxScore: 1400
        },
        {
            index: 2,
            name: "Schmetterling",
            icon: {
                type: "remote",
                path: "./img/playerLevels/butterfly.png"
            },
            maxScore: 2100
        },
        {
            index: 3,
            name: "Heuschrecke",
            icon: {
                type: "remote",
                path: "./img/playerLevels/cricket.png"
            },
            maxScore: 2800
        },
        {
            index: 4,
            name: "Libelle",
            icon: {
                type: "remote",
                path: "./img/playerLevels/dragonfly.png"
            },
            maxScore: 3500
        },
        {
            index: 5,
            name: "Schecke",
            icon: {
                type: "remote",
                path: "./img/playerLevels/snail.png"
            },
            maxScore: 4300
        },
        {
            index: 6,
            name: "Seepferdchen",
            icon: {
                type: "remote",
                path: "./img/playerLevels/seahorse.png"
            },
            maxScore: 99999
        }
    ]
;

